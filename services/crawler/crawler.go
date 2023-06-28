package main

import (
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
	AWSAthenaTimeFormat             = "2006-01-02 15:04:05.999999999"
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
type PkgJSON struct {
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
	Exchange       Exchange
	Sema           chan struct{}
	Wg             *sync.WaitGroup
	Head           uint64
	EventsConsumed int
	Version        int
	Progress       *progressbar.ProgressBar
	// block and tx events
	txBucket      string
	walletBucket  string
	stakingBucket string
}

func NewEthereumCrawler() (*EthereumCrawler, error) {
	raw := os.Getenv("ETHEREUM_RPC")

	if raw == "" {
		return nil, errors.New("ETHEREUM_RPC env variable is not set")
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

	key := os.Getenv("CRYPTOCOMPARE_API_KEY")

	if key == "" {
		return nil, errors.New("CRYPTOCOMPARE_API_KEY env variable is not set")
	}

	exchange, err := NewCryptoCompareExchange(key)

	if err != nil {
		return nil, err
	}

	_, err = exchange.CurrentPrice(Ethereum, USD)

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

func (c *EthereumCrawler) Introspect() error {
	l := c.Logger
	err := c.Glue.LoadDatabases()

	if err != nil {
		return err
	}

	err = c.Glue.LoadTables(AnalyticsDatabaseDev)

	if err != nil {
		return err
	}

	for _, t := range c.Glue.Tables {
		tableVersion, err := strconv.Atoi(string([]rune(*t.Name)[len(*t.Name)-1]))

		if err != nil {
			return err
		}

		table := Table{
			Database: *t.DatabaseName,
			Name:     *t.Name,
			Version:  strconv.Itoa(tableVersion),
		}

		resourceVersion, err := ResourceVersion()

		if err != nil {
			return err
		}

		// we expect table version to match resource version otherwise the resoure is not ready yet wait
		if tableVersion != resourceVersion {
			l.Error(fmt.Sprintf("database=%s %s table=%s resource_version=%s \n", AnalyticsDatabaseDev, table.String(), *t.Name, strconv.Itoa(resourceVersion)))
			return errors.New("resource version does not match table version")
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
			c.txBucket = table.Bucket
		} else if strings.Contains(*t.Name, "staking") {
			c.stakingBucket = table.Bucket
		} else if strings.Contains(*t.Name, "wallet") {
			c.walletBucket = table.Bucket
		}
	}

	if strings.HasPrefix(c.txBucket, "s3://") {
		c.txBucket = strings.TrimPrefix(c.txBucket, "s3://")
	}

	if strings.HasPrefix(c.walletBucket, "s3://") {
		c.walletBucket = strings.TrimPrefix(c.walletBucket, "s3://")
	}

	return nil
}

func ResourceVersion() (int, error) {
	f, err := os.ReadFile("common/data/package.json")

	if err != nil {
		return 0, err
	}

	var pkg PkgJSON

	err = json.Unmarshal(f, &pkg)

	if err != nil {
		return 0, err
	}

	var major int

	semver := strings.Split(pkg.Version, ".")

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

func (c *EthereumCrawler) Crawl() error {
	l := c.Logger

	err := c.Introspect()

	if err != nil {
		return nil
	}

	l.Info("crawling %d blocks...\n", c.Head+1)

	step := 250_000

	for i := int(c.Head); i >= 0; i -= step {
		start := i
		end := i - step + 1

		if end < 0 {
			end = 0
		}

		c.Wg.Add(1)
		go func(start, end int) {
			defer func() {
				c.Wg.Done()
				<-c.Sema
				l.Info("completed batch=%d start=%d end=%d\n", i/step, start, end)
			}()

			l.Info("started batch=%d start=%d end=%d\n", i/step, start, end)
			for j := start; j >= end; j-- {
				txEvents, walletEvents, err := c.ProcessBlock(int(j))

				if err != nil {
					l.Error("block=%d error=%s\n", j, err.Error())
					continue
				}

				if len(txEvents) != 0 {
					err = c.SaveTxEvents(int(j), txEvents)

					if err != nil {
						l.Error("block=%d error=%s\n", j, err.Error())
						continue
					}
				}

				if len(walletEvents) != 0 {
					err = c.SaveWalletEvents(int(j), walletEvents)

					if err != nil {
						l.Error("block=%d error=%s\n", j, err.Error())
						continue
					}
				}
				// c.Mutex.Lock()
				// c.EventsConsumed += len(txEvents) + len(walletEvents)
				// c.Mutex.Unlock()
			}
		}(start, end)
	}
	return nil
}

func (c *EthereumCrawler) SaveTxEvents(block int, tx []*Event) error {
	var txEvents bytes.Buffer

	if len(tx) == 0 {
		return errors.New("events are empty")
	}

	for _, e := range tx {
		b, err := json.Marshal(e)

		if err != nil {
			return err
		}

		txEvents.Write(b)
		txEvents.WriteByte('\n')

	}

	if c.txBucket[len(c.txBucket)-1] == '/' {
		c.txBucket = c.txBucket[:len(c.txBucket)-1]
	}

	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), c.Network.String(), block)

	err := c.S3.UploadBytes(c.txBucket, dest, &txEvents)

	if err != nil {
		return err
	}

	c.Logger.Info("uploaded %d tx events to %s\n", len(tx), dest)
	return nil
}

func (c *EthereumCrawler) SaveWalletEvents(block int, wallet []*WalletEvent) error {
	if len(wallet) == 0 {
		return errors.New("events are empty")
	}

	var walletEvents bytes.Buffer

	for _, e := range wallet {
		b, err := json.Marshal(e)

		if err != nil {
			return err
		}

		walletEvents.Write(b)
		walletEvents.WriteByte('\n')
	}

	if c.walletBucket[len(c.walletBucket)-1] == '/' {
		c.walletBucket = c.walletBucket[:len(c.walletBucket)-1]
	}

	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), c.Network.String(), block)

	err := c.S3.UploadBytes(c.walletBucket, dest, &walletEvents)

	if err != nil {
		return err
	}

	c.Logger.Info("uploaded %d wallet events to %s\n", len(wallet), dest)
	return nil
}
func (c *EthereumCrawler) Close() {
	c.Wg.Wait()
	c.Elapsed = time.Since(c.Begin)
	c.Client.Close()
	close(c.Sema)
	c.Logger.Info("events consumed=%d\n", c.EventsConsumed)
	c.Logger.Info("time elapsed=%s\n", c.Elapsed.Round(time.Millisecond))
}

func (c *EthereumCrawler) ProcessBlock(height int) ([]*Event, []*WalletEvent, error) {
	l := c.Logger

	var events []*Event
	var walletEvents []*WalletEvent

	block, err := c.Client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		return nil, nil, err
	}

	l.Info("processing_block=%d\n", block.Number().Int64())

	blockEvent, err := c.EventFromBlock(block)

	if err != nil {
		return nil, nil, err
	}

	events = append(events, blockEvent)

	if block.Transactions().Len() > 0 {
		for i, tx := range block.Transactions() {
			l.Info("processing tx %d of %d\n", i+1, block.Transactions().Len())

			receipt, err := c.Client.TransactionReceipt(context.Background(), tx.Hash())

			if err != nil {
				return nil, nil, err
			}

			txEvents, walletEvent, err := c.EventsFromTransaction(block, receipt)

			if err != nil {
				return nil, nil, err
			}

			events = append(events, txEvents...)
			walletEvents = append(walletEvents, walletEvent...)
		}
	}
	return events, walletEvents, nil
}

func (c *EthereumCrawler) EventsFromTransaction(b *types.Block, receipt *types.Receipt) ([]*Event, []*WalletEvent, error) {
	var txEvents []*Event
	var walletEvents []*WalletEvent

	l := c.Logger

	for index, tx := range b.Transactions() {
		txEvent := Event{
			Chain:       Ethereum,
			Network:     c.Network,
			Provider:    Casimir,
			Type:        Transaction,
			Height:      int64(b.Number().Uint64()),
			Transaction: tx.Hash().Hex(),
			ReceivedAt:  time.Unix(int64(b.Time()), 0).Format(AWSAthenaTimeFormat),
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

		txEvents = append(txEvents, &txEvent)

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
		// TODO: handle contract events (staking action)
	}

	if len(walletEvents) == 0 || len(walletEvents) != len(txEvents)*2 {
		l.Error("wallet events and tx events mismatch, wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
	}

	return txEvents, walletEvents, nil
}

func (c *EthereumCrawler) EventFromBlock(b *types.Block) (*Event, error) {
	event := Event{
		Chain:      Ethereum,
		Network:    c.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b.Number().Uint64()),
		Block:      b.Hash().Hex(),
		ReceivedAt: time.Unix(int64(b.Time()), 0).Format(AWSAthenaTimeFormat),
	}
	return &event, nil
}

func (t Table) String() string {
	return fmt.Sprintf("table=%s version=%s database=%s bucket=%s serde=%s", t.Name, t.Version, t.Database, t.Bucket, t.SerDe)
}
