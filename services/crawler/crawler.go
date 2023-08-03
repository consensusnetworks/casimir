package main

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"os"
	"sync"
	"time"
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
	Head     int64
	Version  int
	Env      Environment
	Start    time.Time
	Elapsed  time.Duration
	ForkedAt int64
}

func NewEthereumCrawler(config Config) (*EthereumCrawler, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, errors.New("failed to create logger")
	}

	l := logger.Sugar()

	eth, err := NewEthereumService(config.URL.String())

	if err != nil {
		l.Infof("failed to create ethereum client: %s", err.Error())
		return nil, err
	}

	head, err := eth.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("failed to get block number: %s", err.Error())
		return nil, err
	}

	// config.End = int64(head)
	config.End = int64(1_000_000)

	l.Infof("crawling from %d to %d", config.Start, config.End)
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
		EthereumService: eth,
		Glue:            glue,
		S3:              s3c,
		Wg:              &sync.WaitGroup{},
		Start:           time.Now(),
		Sema:            make(chan struct{}, ConcurrencyLimit),
		Head:            int64(head),
		Version:         1,
		Config:          &config,
	}, nil
}

func (c *EthereumCrawler) Crawl() error {
	defer c.Wg.Wait()

	l := c.Logger.Sugar()

	l.Infof("process id: %d", os.Getpid())
	l.Infof("crawling from %s", c.Config.URL.String())
	l.Infof("current head: %d", c.Head)
	l.Infof("batch size: %d", c.Config.BatchSize)

	for i := c.Head; i >= 0; i -= c.Config.BatchSize {
		end := i - c.Config.BatchSize + 1

		if end < 0 {
			end = 0
		}

		c.Wg.Add(1)
		go func(start, end int64) {
			defer func() {
				<-c.Sema
				c.Wg.Done()
				l.Infof("completed batch=%d-%d", start, end)
			}()

			c.Sema <- struct{}{}

			err := c.ProcessBatch(start, end)
			if err != nil {
				l.Infof("failed to process batch=%d-%d: %s", start, end, err.Error())
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

func (c *EthereumCrawler) ProcessBatch(start, end int64) error {
	l := c.Logger.Sugar()
	l.Infof("started batch=%d-%d", start, end)

	for i := start; i <= end; i++ {
		err := c.ProcessBlock(i)

		if err != nil {
			l.Infof("failed to process block=%d: %s", i, err.Error())
			continue
		}
	}

	return nil
}

func (c *EthereumCrawler) ProcessBlock(b int64) error {
	// l := c.Logger.Sugar()

	result, err := c.GetBlockEvents(uint64(b))

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

	// err = c.S3.UploadBytes(c.Glue.EventMeta.Bucket, key, bytes.NewBuffer(encodedEvents.Bytes()))

	// if err != nil {
	// 	return err
	// }

	l.Infof("uploaded block=%d to partition=%s", result.EventsPartitionKey.Block, key)

	// if len(result.Action) > 0 {
	// 	act, err := NDJSON[Action](result.Action)

	// 	if err != nil {
	// 		return err
	// 	}

	// 	err = c.S3.UploadBytes(c.Glue.EventMeta.Bucket, fmt.Sprintf("%s.ndjson", result.ActionPartitionKey.String()), bytes.NewBuffer(act.Bytes()))

	// 	if err != nil {
	// 		return err
	// 	}
	// 	l.Infof("uploaded block %d to %s", result.Height, result.ActionPartitionKey.String())
	// }

	return nil
}

func (c *EthereumCrawler) GetBlockEvents(b uint64) (*BlockEventsResult, error) {
	result := &BlockEventsResult{}

	block, err := c.Client.BlockByNumber(context.Background(), big.NewInt(int64(b)))

	if err != nil {
		return nil, err
	}

	blockTime := int64(block.Time())

	tt := time.Unix(blockTime, 0)

	ttyear := fmt.Sprintf("%04d", tt.Year())
	ttmonth := fmt.Sprintf("%02d", tt.Month())

	blockEvent := &Event{
		Chain:      Ethereum,
		Network:    c.Config.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b),
		Block:      block.Hash().Hex(),
		ReceivedAt: int(blockTime),
	}

	partition := Partition{
		Chain:   Ethereum,
		Network: c.Config.Network,
		Year:    ttyear,
		Month:   ttmonth,
		Block:   b,
	}

	result.EventsPartitionKey = partition

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
			Height:      int64(b),
			Transaction: tx.Hash().Hex(),
			ReceivedAt:  int(blockTime),
			GasFee:      new(big.Int).Mul(tx.GasPrice(), big.NewInt(int64(tx.Gas()))).Int64(),
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
			Chain:   Ethereum,
			Network: c.Config.Network,
			Type:    Wallet,
			Action:  Sent,
			Address: txEvent.Sender,
			Amount:  txEvent.Amount,
			Balance: txEvent.SenderBalance,
			Gas:     tx.Gas(),
			Hash:    tx.Hash().Hex(),
			// ReceivedAt: txEvent.ReceivedAt,
		}

		recipientAction := Action{
			Chain:   Ethereum,
			Network: c.Config.Network,
			Type:    Wallet,
			Action:  Received,
			Address: txEvent.Recipient,
			Amount:  txEvent.Amount,
			Balance: txEvent.RecipientBalance,
			Gas:     tx.Gas(),
			Hash:    tx.Hash().Hex(),
			// ReceivedAt: txEvent.ReceivedAt,
		}

		result.ActionPartitionKey = partition
		result.Action = append(result.Action, senderAction, recipientAction)
	}

	return result, nil
}
