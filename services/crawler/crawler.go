package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/schollz/progressbar"
)

type TxDirection string
type OperationType string

const (
	Outgoing            TxDirection = "outgoing"
	Incoming            TxDirection = "incoming"
	ConcurrencyLimit                = 200
	AWSAthenaTimeFormat             = "2006-01-02T15:04:05.000Z"
)

type Chain struct {
	Name    ChainType
	Network NetworkType
}

type Event struct {
	Chain            ChainType    `json:"chain"`
	Network          NetworkType  `json:"network"`
	Provider         ProviderType `json:"provider"`
	Type             EventType    `json:"type"`
	Height           int64        `json:"height"`
	Block            string       `json:"block"`
	Transaction      string       `json:"transaction"`
	ReceivedAt       string       `json:"received_at"`
	Sender           string       `json:"sender" `
	Recipient        string       `json:"recipient"`
	Amount           string       `json:"amount"`
	Price            float64      `json:"price"`
	SenderBalance    string       `json:"sender_balance"`
	RecipientBalance string       `json:"recipient_balance"`
	GasFee           string       `json:"gas_fee"`
}

type WalletEvent struct {
	WalletAddress string      `json:"wallet_address"`
	Balance       string      `json:"wallet_balance"`
	Direction     TxDirection `json:"tx_direction"`
	TxId          string      `json:"tx_id"`
	ReceivedAt    string      `json:"received_at"`
	Amount        string      `json:"amount"`
	Price         float64     `json:"price"`
	GasFee        string      `json:"gas_fee"`
}

type StakingActionEvent struct {
	WalletAddress    string `json:"wallet_address"`
	StakeDeposit     int64  `json:"stake_deposit"`
	CreatedAt        string `json:"created_at"`
	StakeRebalance   int64  `json:"stake_rebalance"`
	WithdrawalAmount int64  `json:"withdrawal_amount"`
	DistributeReward int64  `json:"distribute_reward"`
}
type Pkg struct {
	Version string `json:"version"`
}

type Table struct {
	Name     string
	Database string
	Version  string
	Bucket   string
	SerDe    string
}

type Crawler interface {
	Crawl() error
	Close() error
}

type EthereumCrawler struct {
	EthereumClient
	Logger
	Mutex          *sync.Mutex
	Begin          time.Time
	Elapsed        time.Duration
	Glue           *GlueClient
	S3             *S3Client
	Sema           chan struct{}
	Wg             *sync.WaitGroup
	Head           uint64
	EventsConsumed int
	Version        int
	Progress       *progressbar.ProgressBar
}

func NewEthereumCrawler() (*EthereumCrawler, error) {
	err := LoadEnv()

	if err != nil {
		return nil, err
	}

	raw := os.Getenv("ETHEREUM_RPC")

	if raw == "" {
		return nil, errors.New("ETHERUEM_RPC env variable is not set")
	}

	url, err := url.Parse(raw)

	if err != nil {
		return nil, err
	}

	client, err := NewEthereumClient(Casimir, *url)

	if err != nil {
		return nil, err
	}

	head, err := client.Client.BlockNumber(context.Background())

	if err != nil {
		return nil, err
	}

	config, err := LoadDefaultAWSConfig()

	if err != nil {
		return nil, err
	}

	glue, err := NewGlueClient(config)

	if err != nil {
		return nil, err
	}

	s3c, err := NewS3Client()

	if err != nil {
		return nil, err
	}

	return &EthereumCrawler{
		EthereumClient: *client,
		Logger:         NewStdoutLogger(),
		Mutex:          &sync.Mutex{},
		Sema:           make(chan struct{}, ConcurrencyLimit),
		Glue:           glue,
		S3:             s3c,
		Head:           head,
		Wg:             &sync.WaitGroup{},
		Begin:          time.Now(),
	}, nil
}

func (c *EthereumCrawler) Crawl() error {
	l := c.Logger

	_, err := c.Introspect()

	if err != nil {
		return nil
	}

	l.Info("crawling %d blocks...\n", c.Head+1)

	step := 250000

	for i := int(c.Head); i >= 0; i -= step {
		start := i
		end := i - step + 1

		if end < 0 {
			end = 0
		}

		l.Info("batch=%d start=%d end=%d\n", i/step, start, end)

		c.Wg.Add(1)

		go func(start, end int) {
			defer func() {
				c.Wg.Done()
				<-c.Sema
			}()

			l.Info("batch=%d start=%d end=%d\n", i/step, start, end)

			for j := start; j >= end; j-- {
				events, walletEvents, err := c.ProcessBlock(int(j))

				if err != nil {
					l.Error("error processing block=%d err=%s\n", j, err)
				}

				l.Info("transaction events = %d wallet events = %d\n", len(events), len(walletEvents))
			}
		}(start, end)
	}
	return nil
}

func (c *EthereumCrawler) Introspect() (map[string]Table, error) {
	l := c.Logger
	err := c.Glue.LoadDatabases()

	if err != nil {
		return nil, err
	}

	err = c.Glue.LoadTables(AnalyticsDatabaseDev)

	if err != nil {
		return nil, err
	}

	tables := make(map[string]Table, 3)

	for _, t := range c.Glue.Tables {
		tableVersion, err := strconv.Atoi(string([]rune(*t.Name)[len(*t.Name)-1]))

		if err != nil {
			return nil, err
		}

		table := Table{
			Database: *t.DatabaseName,
			Name:     *t.Name,
			Version:  strconv.Itoa(tableVersion),
		}

		resourceVersion, err := ResourceVersion()

		if err != nil {
			return nil, err
		}

		// we expect table version to match resource version otherwise the resoure is not ready yet wait
		if tableVersion != resourceVersion {
			l.Error(fmt.Sprintf("database=%s %s table=%s resource_version=%s \n", AnalyticsDatabaseDev, table.String(), *t.Name, strconv.Itoa(resourceVersion)))
			return nil, errors.New("resource version does not match table version")
		}

		if t.StorageDescriptor.Location != nil {
			table.Bucket = *t.StorageDescriptor.Location
		}

		if t.StorageDescriptor.SerdeInfo.Name == nil {
			serde := t.StorageDescriptor.SerdeInfo.SerializationLibrary
			table.SerDe = strings.Split(*serde, ".")[3]
		} else {
			table.SerDe = *t.StorageDescriptor.SerdeInfo.Name
		}

		if strings.Contains(*t.Name, "event") {
			tables["events"] = table
		} else if strings.Contains(*t.Name, "staking_action") {
			tables["staking"] = table
		} else if strings.Contains(*t.Name, "wallet") {
			tables["wallet"] = table
		}
	}
	return tables, nil
}

func ResourceVersion() (int, error) {
	f, err := os.ReadFile("common/data/package.json")

	if err != nil {
		return 0, err
	}

	var pkgJson Pkg

	err = json.Unmarshal(f, &pkgJson)

	if err != nil {
		return 0, err
	}

	var major int

	semver := strings.Split(pkgJson.Version, ".")

	if len(semver) < 3 {
		return 0, errors.New("invalid semver")
	}

	major, err = strconv.Atoi(semver[0])

	if err != nil {
		return 0, err
	}

	if major < 1 {
		return 0, errors.New("major version must be greater than 0")
	}
	return major, nil
}

func (t Table) String() string {
	return fmt.Sprintf("table=%s version=%s database=%s bucket=%s serde=%s", t.Name, t.Version, t.Database, t.Bucket, t.SerDe)
}

func (c *EthereumCrawler) Close() {
	c.Wg.Wait()
	c.Elapsed = time.Since(c.Begin)
	c.Client.Close()
	close(c.Sema)
	c.Logger.Info("eventsConsumed=%d\n", c.EventsConsumed)
	c.Logger.Info("timeElapsed=%s\n", c.Elapsed.Round(time.Millisecond))
}

func EncodeToNDJSONBytes(events []*Event) ([]byte, error) {
	if len(events) == 0 {
		return nil, nil
	}

	var buf bytes.Buffer
	writer := bufio.NewWriter(&buf)

	enc := json.NewEncoder(writer)
	enc.SetEscapeHTML(false)

	for _, event := range events {
		if err := enc.Encode(event); err != nil {
			return nil, err
		}
	}

	if err := writer.Flush(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (c *EthereumCrawler) ProcessBlock(height int) ([]*Event, []*WalletEvent, error) {
	l := c.Logger

	var events []*Event
	var walletEvents []*WalletEvent

	block, err := c.Client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		return nil, nil, err
	}

	blockEvent, err := c.EventFromBlock(block)

	if err != nil {
		return nil, nil, err
	}

	events = append(events, blockEvent)

	l.Info("processing block=%d\n", blockEvent.Height)

	if block.Transactions().Len() > 0 {
		for _, tx := range block.Transactions() {
			receipt, err := c.Client.TransactionReceipt(context.Background(), tx.Hash())

			if err != nil {
				return nil, nil, err
			}

			// this includes transaction events and wallet events
			txEvents, walletEvent, err := c.WalletAndEventFromTransaction(block, receipt)

			if err != nil {
				return nil, nil, err
			}

			events = append(events, txEvents...)
			walletEvents = append(walletEvents, walletEvent...)
		}
	}
	return events, walletEvents, nil
}

func (c *EthereumCrawler) WalletAndEventFromTransaction(b *types.Block, receipt *types.Receipt) ([]*Event, []*WalletEvent, error) {
	var events []*Event

	var walletEvents []*WalletEvent

	for index, tx := range b.Transactions() {
		txEvent := Event{
			Chain:       Ethereum,
			Network:     c.Network,
			Provider:    Casimir,
			Type:        Transaction,
			Height:      int64(b.Number().Uint64()),
			Transaction: tx.Hash().Hex(),
			ReceivedAt:  time.Now().Format(AWSAthenaTimeFormat),
		}

		if tx.Value() != nil {
			txEvent.Amount = tx.Value().String()
		}

		// gas fee = gas price * gas used
		txEvent.GasFee = new(big.Int).Mul(tx.GasPrice(), big.NewInt(int64(receipt.GasUsed))).String()

		if tx.To() != nil {
			txEvent.Recipient = tx.To().Hex()
			recipeintBalance, err := c.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

			if err != nil {
				return nil, nil, err
			}

			txEvent.RecipientBalance = recipeintBalance.String()
		}

		sender, err := c.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

		if err != nil {
			return nil, nil, err
		}

		if sender.Hex() != "" {
			txEvent.Sender = sender.Hex()

			senderBalance, err := c.Client.BalanceAt(context.Background(), sender, b.Number())

			if err != nil {
				return nil, nil, err
			}

			txEvent.SenderBalance = senderBalance.String()
		}

		senderWalletEvent := WalletEvent{
			WalletAddress: txEvent.Sender,
			Balance:       txEvent.SenderBalance,
			Direction:     Outgoing,
			TxId:          txEvent.Transaction,
			ReceivedAt:    txEvent.ReceivedAt,
			Amount:        txEvent.Amount,
			Price:         txEvent.Price,
			GasFee:        txEvent.GasFee,
		}

		walletEvents = append(walletEvents, &senderWalletEvent)

		receiptWalletEvent := WalletEvent{
			WalletAddress: txEvent.Recipient,
			Balance:       txEvent.RecipientBalance,
			Direction:     Incoming,
			TxId:          txEvent.Transaction,
			ReceivedAt:    txEvent.ReceivedAt,
			Amount:        txEvent.Amount,
			Price:         txEvent.Price,
			GasFee:        txEvent.GasFee,
		}

		walletEvents = append(walletEvents, &receiptWalletEvent)

		// TODO: handle contract events
	}

	return events, walletEvents, nil
}

func (c *EthereumCrawler) EventFromBlock(b *types.Block) (*Event, error) {
	event := Event{
		Chain:      Ethereum,
		Network:    c.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b.Number().Uint64()),
		Block:      b.Hash().Hex(),
		ReceivedAt: time.Now().Format(AWSAthenaTimeFormat),
	}
	return &event, nil
}
