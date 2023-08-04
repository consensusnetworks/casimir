package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math/big"
	"os"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
)

const (
	AWSAthenaTimeFormat = "2006-01-02 15:04:05.999999999"
)

var ConcurrencyLimit = 10

type EthereumCrawler struct {
	*Logger
	*EthereumService
	*Config
	Glue     *GlueService
	S3       *S3Service
	Wg       *sync.WaitGroup
	Sema     chan struct{}
	Head     uint64
	Version  int
	Env      Environment
	Start    time.Time
	Elapsed  time.Duration
	ForkedAt uint64
}

func NewEthereumCrawler(config Config) (*EthereumCrawler, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, errors.New("failed to create logger")
	}

	l := logger.Sugar()

	var eths *EthereumService

	if config.Fork {
		eth, err := NewEthereumService("http://127.0.0.1:8545")

		if err != nil {
			l.Infof("failed to create ethereum client: %s", err.Error())
			return nil, err
		}
		eths = eth
	} else {
		eth, err := NewEthereumService(config.URL.String())

		if err != nil {
			l.Infof("failed to create ethereum client: %s", err.Error())
			return nil, err
		}
		eths = eth
	}

	head, err := eths.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("failed to get block number: %s", err.Error())
		return nil, err
	}
	config.End = head
	// config.End = int64(1_000_000)

	l.Infof("crawling range %d - %d", config.Start, config.End)
	l.Infof("current head: %d", head)

	awsConfig, err := LoadDefaultAWSConfig()

	if err != nil {
		l.Infof("failed to load aws default config: %s", err.Error())
		return nil, err
	}

	glue, err := NewGlueService(awsConfig)

	if err != nil {
		l.Infof("failed to create glue service: %s", err.Error())
		return nil, err
	}

	err = glue.Introspect(config.Env)

	if err != nil {
		l.Infof("failed to introspect glue tables")
		return nil, err
	}

	s3c, err := NewS3Service(awsConfig)

	if err != nil {
		l.Infof("FailedToCreateS3Client: %s", err.Error())
		return nil, err
	}

	// resourceVersion, err := GetResourceVersion()

	// if err != nil {
	// 	l.Infof("FailedToGetResourceVersion: %s", err.Error())
	// 	return nil, err
	// }

	return &EthereumCrawler{
		Logger:          logger,
		EthereumService: eths,
		Glue:            glue,
		S3:              s3c,
		Wg:              &sync.WaitGroup{},
		Start:           time.Now(),
		Sema:            make(chan struct{}, ConcurrencyLimit),
		Head:            head,
		Version:         1,
		Config:          &config,
	}, nil
}

func (c *EthereumCrawler) Crawl() error {
	defer c.Wg.Wait()
	l := c.Logger.Sugar()

	l.Infof("process id: %d", os.Getpid())
	l.Infof("using rpc url: %s", c.Config.URL.String())
	l.Infof("current head: %d", c.Head)
	l.Infof("batch size: %d", c.Config.BatchSize)

	if c.Fork {
		l.Infof("getting casimir contract historical data")

		_, err := c.GetHistoricalContracts()

		if err != nil {
			return err
		}

		return nil
	}

	err := PingEthereumNode(c.Config.URL.String())

	if err != nil {
		return err
	}

	c.Head = 1_000_000

	for i := c.Head; i > 0; i -= c.Config.BatchSize {
		end := i - c.Config.BatchSize + 1

		c.Wg.Add(1)
		go func(start, end uint64) {
			defer func() {
				<-c.Sema
				c.Wg.Done()
				l.Infof("completed batch=%d-%d", start, end)
			}()

			c.Sema <- struct{}{}

			err := c.ProcessBatch(start, end)

			if err != nil {
				l.Info(err.Error())
			}
		}(end, i)
	}
	return nil
}

func (c *EthereumCrawler) Close() {
	l := c.Logger.Sugar()
	defer l.Sync()

	c.Client.Close()
	close(c.Sema)

	c.Elapsed = time.Since(c.Start)

	l.Info("closed all connections, shutting down...")
	l.Infof("time elapsed: %s", c.Elapsed)
}

func (c *EthereumCrawler) ProcessBatch(start, end uint64) error {
	l := c.Logger.Sugar()
	l.Infof("started batch=%d-%d", start, end)

	for i := start; i <= end; i++ {
		err := c.ProcessBlock(i)

		if err != nil {
			l.Info(err.Error())
			continue
		}
	}

	return nil
}

func (c *EthereumCrawler) ProcessBlock(b uint64) error {
	result, err := c.GetBlockEvents(b)

	if err != nil {
		return err
	}

	err = c.UploadBlock(result)

	if err != nil {
		return err
	}

	return nil
}

func (c *EthereumCrawler) UploadBlock(result *BlockEventsResult) error {
	l := c.Logger.Sugar()

	if len(result.Events) == 0 {
		l.Errorf("no events found for block=%d", result.EventsPartitionKey.Block)
		return errors.New("no events found, there shoudl be at least one block event")
	}

	encodedEvents, err := NDJSON[Event](result.Events)

	if err != nil {
		return err
	}

	ext := "ndjson"

	eventPartition := fmt.Sprintf("%s.%s", result.EventsPartitionKey.String(), ext)

	err = c.S3.UploadBytes(c.Glue.EventMeta.Bucket, eventPartition, bytes.NewBuffer(encodedEvents.Bytes()))

	if err != nil {
		return err
	}

	l.Infof("uploaded block=%d events to partition=%s", result.EventsPartitionKey.Block, eventPartition)

	if len(result.Action) > 0 {
		act, err := NDJSON[Action](result.Action)

		if err != nil {
			return err
		}

		actionPartition := fmt.Sprintf("%s.%s", result.ActionPartitionKey.String(), ext)

		err = c.S3.UploadBytes(c.Glue.ActionMeta.Bucket, actionPartition, bytes.NewBuffer(act.Bytes()))

		if err != nil {
			return err
		}

		l.Infof("uploaded block %d actions to %s", result.ActionPartitionKey.Block, actionPartition)
	}

	return nil
}

func (c *EthereumCrawler) GetHistoricalContracts() (*BlockEventsResult, error) {
	var result *BlockEventsResult

	contractAddr := common.HexToAddress("0xaaf5751d370d2fd5f1d5642c2f88bbfa67a29301")

	manager, err := NewMain(contractAddr, c.Client)

	if err != nil {
		return nil, err
	}

	opt := &bind.CallOpts{}

	mine := common.HexToAddress("0x84725c8f954f18709aDcA150a0635D2fBE94fDfF")

	userStaked, err := manager.GetUserStake(opt, mine)

	if err != nil {
		return nil, err
	}

	fmt.Println("----")
	fmt.Println(userStaked)
	fmt.Println("----")

	return result, nil
}

func (c *EthereumCrawler) GetBlockEvents(b uint64) (*BlockEventsResult, error) {
	l := c.Logger.Sugar()
	result := &BlockEventsResult{}

	block, err := c.Client.BlockByNumber(context.Background(), big.NewInt(int64(b)))

	if err != nil {
		return nil, fmt.Errorf("failed to get block=%d: %s", b, err.Error())
	}

	fmt.Println(block.Hash())

	blockTime := int64(block.Time())

	tt := time.Unix(blockTime, 0)

	ttyear := fmt.Sprintf("%04d", tt.Year())
	ttmonth := fmt.Sprintf("%02d", tt.Month())

	blockEvent := &Event{
		Chain:      Ethereum,
		Network:    c.Config.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     b,
		Block:      block.Hash().Hex(),
		ReceivedAt: block.Time(),
	}

	result.EventsPartitionKey = Partition{
		Chain:   Ethereum,
		Network: c.Config.Network,
		Year:    ttyear,
		Month:   ttmonth,
		Block:   b,
	}

	result.Events = append(result.Events, *blockEvent)

	if block.Transactions().Len() == 0 {
		return result, nil
	}

	for _, tx := range block.Transactions() {
		txEvent := Event{
			Chain:       Ethereum,
			Network:     c.Config.Network,
			Provider:    Casimir,
			Block:       block.Hash().Hex(),
			Type:        Transaction,
			Height:      b,
			Transaction: tx.Hash().Hex(),
			ReceivedAt:  blockEvent.ReceivedAt,
			GasFee:      fmt.Sprintf("%f", GasFeeInETH(tx.GasPrice(), tx.Gas())),
		}

		if tx.Value() != nil {
			txEvent.Amount = tx.Value().String()
		}

		sender, err := c.Client.TransactionSender(context.Background(), tx, block.Hash(), uint(0))

		if err != nil {
			return nil, err
		}

		txEvent.Sender = sender.Hex()
		senderBalance, err := c.Client.BalanceAt(context.Background(), sender, block.Number())

		if err != nil {
			return nil, err
		}

		txEvent.SenderBalance = senderBalance.String()

		if tx.To() != nil {
			txEvent.Recipient = tx.To().Hex()
			recipeintBalance, err := c.Client.BalanceAt(context.Background(), *tx.To(), block.Number())

			if err != nil {
				return nil, err
			}

			txEvent.RecipientBalance = recipeintBalance.String()
		}

		result.Events = append(result.Events, txEvent)

		senderAction := Action{
			Chain:      Ethereum,
			Network:    c.Config.Network,
			Type:       Wallet,
			Action:     Sent,
			Address:    txEvent.Sender,
			Amount:     txEvent.Amount,
			Balance:    txEvent.SenderBalance,
			Gas:        fmt.Sprintf("%f", GasFeeInETH(tx.GasPrice(), tx.Gas())),
			Hash:       tx.Hash().Hex(),
			ReceivedAt: blockEvent.ReceivedAt,
		}

		recipientAction := Action{
			Chain:      Ethereum,
			Network:    c.Config.Network,
			Type:       Wallet,
			Action:     Received,
			Address:    txEvent.Recipient,
			Amount:     txEvent.Amount,
			Balance:    txEvent.RecipientBalance,
			Gas:        fmt.Sprintf("%f", GasFeeInETH(tx.GasPrice(), tx.Gas())),
			Hash:       tx.Hash().Hex(),
			ReceivedAt: blockEvent.ReceivedAt,
		}

		result.ActionPartitionKey = result.EventsPartitionKey
		result.Action = append(result.Action, senderAction, recipientAction)
	}

	if (len(result.Events)-1)*2 != len(result.Action) {
		l.Errorf("block=%d events=%d actions=%d", b, len(result.Events), len(result.Action))
	}

	return result, nil
}

func GasFeeInETH(gasPrice *big.Int, gasLimit uint64) float64 {
	gasPriceFloat64 := new(big.Float).SetInt(gasPrice)
	gasLimitInt64 := int64(gasLimit)

	gasFee := new(big.Float).Mul(gasPriceFloat64, big.NewFloat(float64(gasLimitInt64)))
	gasFeeFloat64, _ := gasFee.Float64()

	return gasFeeFloat64 / 1e18
}
