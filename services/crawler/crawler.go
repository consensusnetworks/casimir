package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type TxDirection string
type OperationType string

const (
	Outgoing            TxDirection = "outgoing"
	Incoming            TxDirection = "incoming"
	ConcurrencyLimit                = 200
	AWSAthenaTimeFormat             = "2006-01-02 15:04:05.999999999"
)

type EthereumCrawler struct {
	Logger
	EthereumClient
	Mutex    *sync.Mutex
	Begin    time.Time
	Elapsed  time.Duration
	Glue     *GlueClient
	S3       *S3Client
	Exchange Exchange
	Sema     chan struct{}
	Wg       *sync.WaitGroup
	Head     uint64
	Version  int
	// block and tx events included
	EventBucket    string
	WalletBucket   string
	StakingBucket  string
	AlreadyCrawled *[]int64
}

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

func NewEthereumCrawler() (*EthereumCrawler, error) {
	logger, err := NewLogger(false)

	if err != nil {
		return nil, errors.New("FailedToCreateLogger: " + err.Error())
	}

	l := logger.Sugar()

	url := os.Getenv("ETHEREUM_RPC_URL")

	if url == "" {
		l.Infof("EnvVariableNotFound: ETHEREUM_RPC_URL")
		return nil, errors.New("EnvVariableNotFound: ETHEREUM_RPC_URL is not set")
	}

	client, err := NewEthereumClient(url)

	if err != nil {
		l.Infof("FailedToCreateEthereumClient: %s", err.Error())
		return nil, err
	}

	head, err := client.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("FailedToGetBlockNumber: %s", err.Error())
		return nil, err
	}

	config, err := LoadDefaultAWSConfig()

	if err != nil {
		l.Infof("FailedToLoadDefaultAWSConfig: %s", err.Error())
		return nil, err
	}

	glue, err := NewGlueClient(config)

	if err != nil {
		l.Infof("FailedToCreateGlueClient: %s", err.Error())
		return nil, err
	}

	s3c, err := NewS3Client(config)

	if err != nil {
		l.Infof("FailedToCreateS3Client: %s", err.Error())
		return nil, err
	}

	return &EthereumCrawler{
		EthereumClient: *client,
		Mutex:          &sync.Mutex{},
		Sema:           make(chan struct{}, ConcurrencyLimit),
		Glue:           glue,
		S3:             s3c,
		Head:           head,
		Wg:             &sync.WaitGroup{},
		Begin:          time.Now(),
		Logger:         *logger,
	}, nil
}

func (c *EthereumCrawler) Crawl() error {
	l := c.Logger.Sugar()

	l.Infof("StartedCrawling: head=%d", c.Head)

	step := 250_000 // 250k blocks per batch
	head := int64(c.Head)
	// head := int64(2)
	tail := int64(0)

	for i := head; i >= tail; i -= int64(step) {
		start := i
		end := i - int64(step)

		if end < 0 {
			end = 0
		}

		c.Wg.Add(1)
		go func(start, end, i int64) {
			defer func() {
				c.Wg.Done()
				<-c.Sema
				l.Infof("CompletedBatch: batch=%d start=%d end=%d", i/int64(step), start, end)
			}()

			c.Sema <- struct{}{}

			l.Infof("StartedBatch: batch=%d start=%d end=%d", i/int64(step), start, end)

			for j := start; j >= end; j-- {
				if c.IsBlockConsumed(int64(j)) {
					l.Infof("BlockAlreadyConsumed: block=%d", j)
					continue
				}

				tx, wallet, err := c.ProcessBlock(int(j))

				if err != nil {
					l.Errorf("FailedToConsumeBlock: block=%d error=%s", j, err.Error())
					continue
				}

				err = c.SaveBlock(int64(j), tx, wallet)

				if err != nil {
					l.Errorf("FailedToSaveBlock: block=%d error=%s", j, err.Error())
					continue
				}
			}
		}(start, end, i)
	}
	return nil
}

func (c *EthereumCrawler) RetryFailedBlocks() {
	l := c.Logger.Sugar()

	_, err := os.Stat(LogFile)

	if err != nil {
		l.Infof("FailedToOpenLogFile: %s", err.Error())
		return
	}

	f, err := os.Open(LogFile)

	if err != nil {
		l.Infof("FailedToOpenLogFile: %s", err.Error())
		return
	}

	defer f.Close()

	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		var entry LogEntry

		err := json.Unmarshal(scanner.Bytes(), &entry)

		if err != nil {
			l.Infof("FailedToUnmarshalLogEntry: %s", err.Error())
			continue
		}

		if entry.Level != "ERROR" {
			continue
		}

		fmt.Println(entry.Message)

		// TODO: handle retry on block and tx level
	}

	if err := scanner.Err(); err != nil {
		l.Infof("FailedToScanLogFile: %s", err.Error())
		return
	}

	err = os.Remove(LogFile)

	if err != nil {
		l.Infof("FailedToRemoveLogFile: %s", err.Error())
		return
	}

	l.Infof("RemovedLogFile: %s", LogFile)
}

func (c *EthereumCrawler) Close() {
	c.Wg.Wait()
	c.Client.Close()

	close(c.Sema)

	// c.RetryFailedBlocks()

	l := c.Logger.Sugar()
	defer l.Sync()

	l.Infof("TimeElapsed=%s", c.Elapsed.Round(time.Millisecond))
	c.Elapsed = time.Since(c.Begin)
}

// ConsumeBlock consumes the blocks events (1 event for the block + 1 event per transaction). e.g. 1 block with 10 transactions will return 11 events
func (c *EthereumCrawler) ProcessBlock(height int) (*[]Event, *[]WalletEvent, error) {
	l := c.Logger.Sugar()

	tx, wallet, err := c.BlockEvents(int64(height))

	if err != nil {
		l.Infof("FailedToGetBlockEvents: block=%d error=%s", height, err.Error())
		return nil, nil, err
	}

	return tx, wallet, nil
}

// SaveBlock saves all block events to a s3 bucket
func (c *EthereumCrawler) SaveBlock(block int64, tx *[]Event, wallet *[]WalletEvent) error {
	l := c.Logger.Sugar()

	if len(*tx) != 0 {
		err := c.SaveTxEvents(block, tx)

		if err != nil {
			l.Infof("FailedToSaveTxEvents: " + err.Error())
			return err
		}
	}

	if len(*wallet) != 0 {
		err := c.SaveWalletEvents(block, wallet)

		if err != nil {
			l.Infof("FailedToSaveWalletEvents: %s", err.Error())
			return err
		}

	}

	l.Infof("SavedBlock: block=%d tx_events=%d wallet_events=%d", block, len(*tx), len(*wallet))
	return nil
}

// SaveWalletEvents saves all wallet events to the specified bucket
func (c *EthereumCrawler) SaveTxEvents(block int64, tx *[]Event) error {
	l := c.Logger.Sugar()
	var txEvents bytes.Buffer

	for _, e := range *tx {
		b, err := json.Marshal(e)

		if err != nil {
			l.Errorf("MarshallError: %s", err.Error())
			return err
		}

		txEvents.Write(b)
		txEvents.WriteByte('\n')

	}

	if c.EventBucket[len(c.EventBucket)-1] == '/' {
		c.EventBucket = c.EventBucket[:len(c.EventBucket)-1]
	}

	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), c.Network.String(), block)

	err := c.S3.UploadBytes(c.EventBucket, dest, &txEvents)

	if err != nil {
		l.Infof("FailedToUpload: %s", err.Error())
		return err
	}

	return nil
}

// SaveWalletEvents saves all wallet events to the specified bucket
func (c *EthereumCrawler) SaveWalletEvents(block int64, wallet *[]WalletEvent) error {
	l := c.Logger.Sugar()

	var walletEvents bytes.Buffer

	for _, e := range *wallet {
		b, err := json.Marshal(e)

		if err != nil {
			l.Infof("MarshallError: %s", err.Error())
			return err
		}

		walletEvents.Write(b)
		walletEvents.WriteByte('\n')
	}

	if c.WalletBucket[len(c.WalletBucket)-1] == '/' {
		c.WalletBucket = c.WalletBucket[:len(c.WalletBucket)-1]
	}

	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), c.Network.String(), block)

	err := c.S3.UploadBytes(c.WalletBucket, dest, &walletEvents)

	if err != nil {
		l.Infof("FailedToUpload: %s", err.Error())
		return err
	}

	return nil
}

// BlockEvents returns all events for a given block
func (c *EthereumCrawler) BlockEvents(height int64) (*[]Event, *[]WalletEvent, error) {
	l := c.Logger.Sugar()

	var txEvents []Event
	var walletEvents []WalletEvent

	b, err := c.Client.BlockByNumber(context.Background(), big.NewInt(height))

	if err != nil {
		l.Infof("FailedToGetBlock: %s", err.Error())
		return nil, nil, err
	}

	blockEvent := Event{
		Chain:      Ethereum,
		Network:    c.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b.Number().Uint64()),
		Block:      b.Hash().Hex(),
		ReceivedAt: time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
	}

	txEvents = append(txEvents, blockEvent)

	for index, tx := range b.Transactions() {
		receipt, err := c.Client.TransactionReceipt(context.Background(), tx.Hash())

		if err != nil {
			l.Infof("FailedToGetTransactionReceipt: %s", err.Error())
			return nil, nil, err
		}

		l.Infof("ProcessingTransaction: Transaction %d of %d", index+1, len(b.Transactions()))

		txEvent := Event{
			Chain:       Ethereum,
			Network:     c.Network,
			Provider:    Casimir,
			Block:       b.Hash().Hex(),
			Type:        Transaction,
			Height:      int64(b.Number().Uint64()),
			Transaction: tx.Hash().Hex(),
			ReceivedAt:  time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
		}

		if tx.Value() != nil {
			txEvent.Amount = tx.Value().String()
		}

		txEvent.GasFee = new(big.Int).Mul(tx.GasPrice(), big.NewInt(int64(receipt.GasUsed))).String()

		if tx.To() != nil {
			txEvent.Recipient = tx.To().Hex()
			recipeintBalance, err := c.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

			if err != nil {
				l.Infof("FailedToGetBalanceAt: %s", err.Error())
				return nil, nil, err
			}

			txEvent.RecipientBalance = recipeintBalance.String()
		}

		sender, err := c.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

		if err != nil {
			l.Infof("FailedToGetTransactionSender: %s", err.Error())
			return nil, nil, err
		}

		if sender.Hex() != "" {
			txEvent.Sender = sender.Hex()

			senderBalance, err := c.Client.BalanceAt(context.Background(), sender, b.Number())

			if err != nil {
				l.Infof("FailedToGetBalanceAt: %s", err.Error())
				return nil, nil, err
			}

			txEvent.SenderBalance = senderBalance.String()
		}

		txEvents = append(txEvents, txEvent)

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

		walletEvents = append(walletEvents, senderWalletEvent)

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

		walletEvents = append(walletEvents, receiptWalletEvent)
		// TODO: handle contract events (staking action)
	}

	// don't stop processing we will retry later (-1 because the txEvent includes the block event)
	if len(txEvents) != 0 && len(walletEvents) != 0 && len(walletEvents) != (len(txEvents)-1)*2 {
		l.Errorf("TxWalletEventsMismatch: wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
	}

	return &txEvents, &walletEvents, nil
}

// Introspect loads all provisioned tables
func (c *EthereumCrawler) Introspect() error {
	l := c.Logger.Sugar()

	l.Infof("introspecting ethereum chain=%s network=%s", Ethereum, c.Network)

	err := c.Glue.LoadDatabases()

	if err != nil {
		return err
	}

	err = c.Glue.LoadTables(AnalyticsDatabaseDev)

	if err != nil {
		l.Infof("FailedToLoadGlueTables: %s", err.Error())
		return err
	}

	for _, t := range c.Glue.Tables {
		tableVersion, err := strconv.Atoi(string([]rune(*t.Name)[len(*t.Name)-1]))

		if err != nil {
			l.Infof("FailedToParseTableVersion: %s", err.Error())
			return err
		}

		table := Table{
			Database: *t.DatabaseName,
			Name:     *t.Name,
			Version:  strconv.Itoa(tableVersion),
		}

		resourceVersion, err := ResourceVersion()

		if err != nil {
			l.Infof("FailedToGetResourceVersion: %s", err.Error())
			return err
		}

		// we expect table version to match resource version otherwise the resoure is not ready yet wait
		if tableVersion != resourceVersion {
			l.Infof("ResourceVersionMismatch: table=%s resource=%d", table.Name, resourceVersion)
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
			c.EventBucket = table.Bucket
			c.EventBucket = strings.TrimPrefix(c.EventBucket, "s3://")
			c.EventBucket = strings.TrimSuffix(c.EventBucket, "/")

		} else if strings.Contains(*t.Name, "staking") {
			c.StakingBucket = table.Bucket
			c.StakingBucket = strings.TrimPrefix(c.StakingBucket, "s3://")
			c.StakingBucket = strings.TrimSuffix(c.StakingBucket, "/")
		} else if strings.Contains(*t.Name, "wallet") {
			c.WalletBucket = table.Bucket
			c.WalletBucket = strings.TrimPrefix(c.WalletBucket, "s3://")
			c.WalletBucket = strings.TrimSuffix(c.WalletBucket, "/")
		}

		l.Infof("event bucket=%s staking bucket=%s wallet bucket=%s", c.EventBucket, c.StakingBucket, c.WalletBucket)
	}

	consumedEventsBucket, err := c.S3.AlreadyConsumed(c.EventBucket, fmt.Sprintf("ethereum/%s", c.Network))

	if err != nil {
		return err
	}

	if len(*consumedEventsBucket) == 0 {
		l.Info("no consumed events found")
		l.Infof("chain=%s network=%s consumed=%d blocks", Ethereum, c.Network, len(*consumedEventsBucket))
	} else {
		l.Infof(fmt.Sprintf("chain=%s network=%s already consumed=%d blocks", Ethereum, c.Network, len(*consumedEventsBucket)))
	}

	c.AlreadyCrawled = consumedEventsBucket

	return nil
}

// IsBlockConsumed checks if a block has already been consumed by the crawler
func (c *EthereumCrawler) IsBlockConsumed(block int64) bool {
	for _, b := range *c.AlreadyCrawled {
		if b == block {
			return true
		}
	}
	return false
}

// ResourceVersion returns the current version of casimir data resource
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
		return 0, errors.New("InvalidSemver: must be in format major.minor.patch")
	}

	major, err = strconv.Atoi(semver[0])

	if err != nil {
		return 0, errors.New("InvalidSemver: major version must be an integer")
	}

	return major, nil
}

func (t Table) String() string {
	return fmt.Sprintf("table=%s version=%s database=%s bucket=%s serde=%s", t.Name, t.Version, t.Database, t.Bucket, t.SerDe)
}
