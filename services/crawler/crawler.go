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
	Outgoing         TxDirection = "outgoing"
	Incoming         TxDirection = "incoming"
	concurrencyLimit             = 200
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

type Wallet struct {
	Id         string      `json:"id" parquet:"name=id, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Address    string      `json:"address" parquet:"name=address, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Balance    string      `json:"balance" parquet:"name=balance, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	ReceivedAt string      `json:"received_at" parquet:"name=received_at, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Amount     string      `json:"amount" parquet:"name=amount, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Price      float64     `json:"price" parquet:"name=price, type=DOUBLE"`
	GasFee     string      `json:"gas_fee" parquet:"name=gas_fee, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Direction  TxDirection `json:"direction" parquet:"name=direction, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
}

type StakingAction struct {
	WalletAddress    string `json:"wallet_address" parquet:"name=wallet_address, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	StakeDeposit     int64  `json:"stake_deposit" parquet:"name=stake_deposit, type=INT64"`
	CreatedAt        string `json:"created_at" parquet:"name=created_at, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	StakeRebalance   int64  `json:"stake_rebalance" parquet:"name=stake_rebalance, type=INT64"`
	WithdrawalAmount int64  `json:"withdrawal_amount" parquet:"name=withdrawal_amount, type=INT64"`
	DistributeReward int64  `json:"distribute_reward" parquet:"name=distribute_reward, type=INT64"`
}
type Pkg struct {
	Version string `json:"version"`
}

type Table struct {
	Name    string
	Version string
	Bucket  string
}

type Crawler interface {
	Crawl() error
}

type EtheruemCrawler struct {
	EtheruemClient
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

func NewEthereumCrawler() (*EtheruemCrawler, error) {
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

	return &EtheruemCrawler{
		EtheruemClient: *client,
		Logger:         NewStdoutLogger(),
		Mutex:          &sync.Mutex{},
		Sema:           make(chan struct{}, concurrencyLimit),
		Glue:           glue,
		S3:             s3c,
		Head:           head,
		Wg:             &sync.WaitGroup{},
		Begin:          time.Now(),
	}, nil
}

func (c *EtheruemCrawler) Crawl() error {
	l := c.Logger
	_, err := c.Introspect()

	if err != nil {
		return nil
	}

	defer func() {
		c.Close()
	}()

	diff := c.Head - 0 + 1

	l.Info("crawling %d blocks...\n", diff)

	err = os.Mkdir("data", 0755)

	if err != nil {
		return err
	}

	step := uint64(200)

	// for i := uint64(0); i < c.Head; i += step {
	for i := uint64(0); i < 1000; i += step {
		c.Sema <- struct{}{}
		c.Wg.Add(1)

		start := i
		end := i + 100 - 1

		if end > c.Head {
			end = c.Head
		}

		go func(start, end uint64) {
			defer func() {
				<-c.Sema
				c.Wg.Done()
			}()
			l.Info("batch=%d start=%d end=%d\n", i/step, start, end)

			for j := start; j <= end; j++ {
				events, err := c.ProcessBlock(int(j))

				if err != nil {
					l.Error("error processing block=%d err=%s\n", j, err)
					continue
				}

				ndjson, err := EncodeToNDJSONBytes(events)

				if err != nil {
					l.Error("error encoding events to ndjson err=%s\n", err)
					continue
				}

				// bucketPath := fmt.Sprintf("blocks/%d.ndjson", j)
				// tables := c.Glue.Tables
				// err = c.S3.UploadBytes(s)

				// save to local file
				fpath := fmt.Sprintf("data/%d-%d.ndjson", start, end)

				f, err := os.OpenFile(fpath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

				if err != nil {
					l.Error("error opening file=%s err=%s\n", fpath, err)
					continue
				}

				_, err = f.Write(ndjson)

				if err != nil {
					l.Error("error writing to file=%s err=%s\n", fpath, err)
					continue
				}

				c.Mutex.Lock()
				c.EventsConsumed++
				c.Mutex.Unlock()
			}
		}(start, end)
	}
	return nil
}

func (c *EtheruemCrawler) Close() {
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

func (c *EtheruemCrawler) ProcessBlock(height int) ([]*Event, error) {
	l := c.Logger

	var events []*Event

	block, err := c.Client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		return nil, err
	}

	blockEvent, err := c.BlockEvent(block)

	if err != nil {
		return nil, err
	}

	events = append(events, blockEvent)

	l.Info("processingBlock=%d\n", blockEvent.Height)

	if block.Transactions().Len() > 0 {
		for _, tx := range block.Transactions() {
			tx, err := c.Client.TransactionReceipt(context.Background(), tx.Hash())

			if err != nil {
				return nil, err
			}

			txEvent, err := c.TransactionEvent(block, tx)

			if err != nil {
				return nil, err
			}
			events = append(events, txEvent...)
		}
	}
	return events, nil
}

func (c *EtheruemCrawler) TransactionEvent(b *types.Block, tx *types.Receipt) ([]*Event, error) {
	var events []*Event

	for index, tx := range b.Transactions() {
		txEvent := Event{
			Chain:    Ethereum,
			Network:  c.Netowrk,
			Provider: Casimir,
			Type:     Transaction,
			Height:   int64(b.Number().Uint64()),
		}

		if tx.Hash().Hex() != "" {
			txEvent.Transaction = tx.Hash().Hex()
		}

		// recipient
		if tx.To().Hex() != "" {
			txEvent.Recipient = tx.To().Hex()

			// get receipt balance
			recipientBalance, err := c.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

			if err != nil {
				return nil, err
			}
			txEvent.RecipientBalance = recipientBalance.String()
		}

		// amount
		if tx.Value().String() != "" {
			txEvent.Amount = tx.Value().String()
		}

		sender, err := c.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

		if err != nil {
			return nil, err
		}

		// sender
		if sender.Hex() != "" {
			txEvent.Sender = sender.Hex()

			senderBalance, err := c.Client.BalanceAt(context.Background(), sender, b.Number())

			if err != nil {
				return nil, err
			}
			txEvent.SenderBalance = senderBalance.String()
		}
	}
	return events, nil
}

func (c *EtheruemCrawler) BlockEvent(b *types.Block) (*Event, error) {
	event := Event{
		Chain:    Ethereum,
		Network:  c.Netowrk,
		Provider: Casimir,
		Type:     Block,
		Height:   int64(b.Number().Uint64()),
		// GasFee:  b.s
	}

	if b.Hash().Hex() != "" {
		event.Block = b.Hash().Hex()
	}

	if b.Time() != 0 {
		event.ReceivedAt = time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999")
	}

	return &event, nil
}

func (c *EtheruemCrawler) Introspect() ([]Table, error) {
	l := c.Logger

	// l.Info("introspecting...\n")

	err := c.Glue.LoadDatabases()

	if err != nil {
		return nil, err
	}

	err = c.Glue.LoadTables(AnalyticsDatabaseDev)

	if err != nil {
		return nil, err
	}

	var tables []Table

	for _, t := range c.Glue.Tables {
		var table Table

		table.Name = *t.Name
		tableVersion, err := strconv.Atoi(string([]rune(*t.Name)[len(*t.Name)-1]))

		if err != nil {
			return nil, err
		}

		table.Version = strconv.Itoa(tableVersion)

		resourceVersion, err := ResourceVersion()

		if err != nil {
			return nil, err
		}

		// we expect table version to match resource version otherwise the resoure is not ready yet wait
		if tableVersion != resourceVersion {
			l.Error(fmt.Sprintf("database=%s %s table=%s resourceVersion=%s \n", AnalyticsDatabaseDev, table.String(), *t.Name, strconv.Itoa(resourceVersion)))
			return nil, errors.New("resource version does not match table version")
		}

		table.Version = strconv.Itoa(tableVersion)
		tables = append(tables, table)

		bucket := *t.StorageDescriptor.Location

		if bucket == "" {
			return nil, errors.New("an external table must have a s3 bucket")
		}

		table.Bucket = bucket
		// l.Info(fmt.Sprintf("database=%s %s table=%s \n", AnalyticsDatabaseDev, table.String(), *t.Name))
	}
	return tables, nil
}

func ResourceVersion() (int, error) {
	f, err := os.ReadFile("../../common/data/package.json")

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
	return fmt.Sprintf("table=%s version=%s bucket=%s", t.Name, t.Version, t.Bucket)
}
