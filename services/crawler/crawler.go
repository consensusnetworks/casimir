package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
)

type EthereumCrawler struct {
	Logger          *Logger
	EthereumService *EthereumService
	ContractService *ContractService
	Config          *Config
	Glue            *GlueService
	S3              *S3Service
	Wg              *sync.WaitGroup
	Mu              *sync.Mutex
	Sema            chan struct{}
	Version         int
	Env             Env
	Start           time.Time
	Elapsed         time.Duration
	StartBlock      uint64
	Unprocessed     []uint64
}

func NewEthereumCrawler(config *Config) (*EthereumCrawler, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, errors.New("failed to create logger")
	}

	l := logger.Sugar()

	eths, err := NewEthereumService(config.URL.String())

	if err != nil {
		l.Infof("failed to create ethereum service: %s", err.Error())
		return nil, err
	}

	l.Info("created ethereum service")

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

	l.Info("created glue service")

	err = glue.Introspect(config.Env)

	if err != nil {
		l.Infof("failed to introspect glue tables")
		return nil, err
	}

	l.Info("successfully introspected glue tables")

	s3v, err := NewS3Service(awsConfig)

	if err != nil {
		l.Infof("failed to create s3 client: %s", err.Error())
		return nil, err
	}

	l.Info("created s3 service")

	rv, err := GetResourceVersion()

	if err != nil {
		l.Infof("FailedToGetResourceVersion: %s", err.Error())
		return nil, err
	}

	cs, err := NewContractService(eths)

	if err != nil {
		return nil, err
	}

	l.Info("created contract service")

	return &EthereumCrawler{
		Logger:          logger,
		EthereumService: eths,
		ContractService: cs,
		Glue:            glue,
		S3:              s3v,
		Wg:              &sync.WaitGroup{},
		Start:           time.Now(),
		Sema:            make(chan struct{}, config.ConcurrencyLimit),
		Version:         rv,
		Config:          config,
		// TODO: source this from env var
		StartBlock: 9564114,
	}, nil
}

func (c *EthereumCrawler) Crawl() error {
	defer c.Wg.Wait()

	l := c.Logger.Sugar()

	l.Info(c.Config)

	head := uint64(c.EthereumService.Head.Number.Int64())

	for i := uint64(0); i <= head; i += uint64(c.Config.BatchSize) {
		end := i + uint64(c.Config.BatchSize) - 1
		if end > head {
			end = head
		}

		c.Wg.Add(1)
		go func(start, end uint64) {
			defer func() {
				c.Wg.Done()
				<-c.Sema
			}()

			c.Sema <- struct{}{}

			err := c.ProcessBatch(start, end)
			if err != nil {
				l.Error(err)
			}
		}(i, end)
	}

	return nil
}

func (c *EthereumCrawler) ProcessBatch(start, end uint64) error {
	l := c.Logger.Sugar()
	l.Infof("processing batch=%d-%d", start, end)

	defer l.Infof("completed batch=%d-%d", start, end)

	for i := start; i <= end; i++ {
		err := c.ProcessBlock(i)

		if err != nil {
			c.Unprocessed = append(c.Unprocessed, i)

			l.Info(err.Error())
			continue
		}
	}

	return nil
}

func (c *EthereumCrawler) ProcessBlock(b uint64) error {
	txs, err := c.GetBlockEvents(b)

	if err != nil {
		return err
	}

	err = c.UploadBlockEvents(txs)

	if err != nil {
		return err
	}

	return nil
}

func (c *EthereumCrawler) GetBlockEvents(b uint64) (*BlockEvents, error) {
	l := c.Logger.Sugar()
	events := &BlockEvents{}

	block, err := c.EthereumService.Block(b)

	if err != nil {
		return nil, err
	}

	blocktime := int64(block.Time())
	tt := time.Unix(blocktime, 0)
	ttyear := fmt.Sprintf("%04d", tt.Year())
	ttmonth := fmt.Sprintf("%02d", tt.Month())

	events.TxEventsPK = Partition{
		Chain:   Ethereum,
		Network: c.Config.Network,
		Year:    ttyear,
		Month:   ttmonth,
		Block:   b,
	}

	blockEvent := c.NewBlockEvent(block)

	events.TxEvents = append(events.TxEvents, blockEvent)

	if block.Transactions().Len() == 0 {
		return events, nil
	}

	for _, tx := range block.Transactions() {
		txEvent, err := c.NewTxEvent(block, tx)

		if err != nil {
			return nil, err
		}

		events.TxEvents = append(events.TxEvents, txEvent)

		actions, err := c.NewActionEvents(txEvent)

		if err != nil {
			return nil, err
		}

		events.ActionsPK = events.TxEventsPK
		events.Actions = append(events.Actions, actions...)
	}

	if (len(events.TxEvents)-1)*2 != len(events.Actions) {
		l.Errorf("events mismatch: block=%d events=%d actions=%d", b, len(events.TxEvents), len(events.Actions))
		return nil, errors.New("check the nnumber of")
	}
	return events, nil
}

func (c *EthereumCrawler) NewActionEvents(txEvent *TxEvent) ([]*Action, error) {
	sender := &Action{
		Chain:      Ethereum,
		Network:    c.Config.Network,
		Type:       Wallet,
		Action:     Sent,
		Address:    txEvent.Sender,
		Amount:     txEvent.Amount,
		Balance:    txEvent.SenderBalance,
		Gas:        txEvent.GasFee,
		Hash:       txEvent.Transaction,
		ReceivedAt: txEvent.ReceivedAt,
	}

	recipient := &Action{
		Chain:      Ethereum,
		Network:    c.Config.Network,
		Type:       Wallet,
		Action:     Received,
		Address:    txEvent.Recipient,
		Amount:     txEvent.Amount,
		Balance:    txEvent.RecipientBalance,
		Gas:        txEvent.GasFee,
		Hash:       txEvent.Transaction,
		ReceivedAt: txEvent.ReceivedAt,
	}

	return []*Action{sender, recipient}, nil
}

func (c *EthereumCrawler) NewBlockEvent(b *types.Block) *TxEvent {
	return &TxEvent{
		Chain:      Ethereum,
		Network:    c.Config.Network,
		Provider:   Casimir,
		EventType:  Block,
		Height:     b.Number().Uint64(),
		Block:      b.Hash().Hex(),
		ReceivedAt: b.Time(),
	}
}

func (c *EthereumCrawler) NewTxEvent(b *types.Block, tx *types.Transaction) (*TxEvent, error) {
	txEvent := TxEvent{
		Chain:       Ethereum,
		Network:     c.Config.Network,
		Provider:    Casimir,
		Block:       b.Hash().Hex(),
		EventType:   Transaction,
		Height:      b.Number().Uint64(),
		Transaction: tx.Hash().Hex(),
		ReceivedAt:  b.Time(),
		GasFee:      fmt.Sprintf("%f", GasFeeInETH(tx.GasPrice(), tx.Gas())),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)

	defer cancel()

	if tx.Value() != nil {
		txEvent.Amount = tx.Value().String()
	}

	sender, err := c.EthereumService.Client.TransactionSender(ctx, tx, b.Hash(), uint(0))

	if err != nil {
		return nil, err
	}

	txEvent.Sender = sender.Hex()
	senderBalance, err := c.EthereumService.Client.BalanceAt(ctx, sender, b.Number())

	if err != nil {
		return nil, err
	}

	txEvent.SenderBalance = senderBalance.String()

	if tx.To() != nil {
		txEvent.Recipient = tx.To().Hex()
		recipeintBalance, err := c.EthereumService.Client.BalanceAt(ctx, *tx.To(), b.Number())

		if err != nil {
			return nil, err
		}

		txEvent.RecipientBalance = recipeintBalance.String()
	}

	return &txEvent, nil
}

func (c *EthereumCrawler) Close() {
	l := c.Logger.Sugar()
	defer l.Sync()

	c.EthereumService.Client.Close()
	close(c.Sema)

	c.Elapsed = time.Since(c.Start)

	l.Info("closed all connections, shutting down...")
	l.Infof("time elapsed: %s", c.Elapsed)
}

func (c *EthereumCrawler) UploadBlockEvents(result *BlockEvents) error {
	l := c.Logger.Sugar()

	if len(result.TxEvents) == 0 {
		l.Errorf("no events found for block=%d", result.TxEventsPK.Block)
		return errors.New("no events found, there shoudl be at least one block event")
	}

	encodedEvents, err := NDJSON[TxEvent](result.TxEvents)

	if err != nil {
		return err
	}

	ext := "ndjson"

	eventPartition := fmt.Sprintf("%s.%s", result.TxEventsPK.String(), ext)

	err = c.S3.UploadBytes(c.Glue.EventMeta.Bucket, eventPartition, bytes.NewBuffer(encodedEvents.Bytes()))

	if err != nil {
		return err
	}

	// l.Infof("uploaded block=%d events to partition=%s", result.TxEventsPK.Block, eventPartition)

	if len(result.Actions) > 0 {
		act, err := NDJSON[Action](result.Actions)

		if err != nil {
			return err
		}

		actionPartition := fmt.Sprintf("%s.%s", result.ActionsPK.String(), ext)

		err = c.S3.UploadBytes(c.Glue.ActionMeta.Bucket, actionPartition, bytes.NewBuffer(act.Bytes()))

		if err != nil {
			return err
		}
		// l.Infof("uploaded block %d actions to %s", result.ActionsPK.Block, actionPartition)
	}

	return nil
}

func GasFeeInETH(gasPrice *big.Int, gasLimit uint64) float64 {
	gasPriceFloat64 := new(big.Float).SetInt(gasPrice)
	gasLimitInt64 := int64(gasLimit)

	gasFee := new(big.Float).Mul(gasPriceFloat64, big.NewFloat(float64(gasLimitInt64)))
	gasFeeFloat64, _ := gasFee.Float64()

	return gasFeeFloat64 / 1e18
}

func WeiToETH(wei *big.Int) float64 {
	weiEth := big.NewInt(1e18)
	eth := new(big.Float).Quo(new(big.Float).SetInt(wei), new(big.Float).SetInt(weiEth))
	float, _ := eth.Float64()
	return float
}
