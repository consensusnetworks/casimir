package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
)

type State int

const (
	Ready State = iota + 1
	Running
	Stopped
)

type EthereumCrawler struct {
	EthereumService   *EthereumService
	ContractService   *ContractService
	Glue              *GlueService
	S3                *S3Service
	Logger            *Logger
	Config            Config
	Wg                sync.WaitGroup
	Mu                sync.Mutex
	Sema              chan struct{}
	Unprocessed       []uint64  // blocks that failed to process
	Start             time.Time // the time when the crawler was started
	Version           int
	Env               Env
	Elapsed           time.Duration
	CrawlState        State
	StreamState       State
	crawlerStartBlock uint64
}

func NewEthereumCrawler(config Config) (*EthereumCrawler, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, fmt.Errorf("failed to create logger: %s", err.Error())
	}

	l := logger.Sugar()

	eths, err := NewEthereumService(config.URL.String())

	if err != nil {
		return nil, fmt.Errorf("failed to create ethereum service: %s", err.Error())
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

	// cs, err := NewContractService(eths)

	// if err != nil {
	// 	return nil, err
	// }

	// l.Info("created contract service")

	return &EthereumCrawler{
		Logger:          logger,
		EthereumService: eths,
		Glue:            glue,
		S3:              s3v,
		Wg:              sync.WaitGroup{},
		Start:           time.Now(),
		Sema:            make(chan struct{}, config.ConcurrencyLimit),
		Version:         rv,
		Config:          config,
		Env:             config.Env,
		CrawlState:      Ready,
		StreamState:     Ready,
		// ContractService: cs,
	}, nil
}

func (c *EthereumCrawler) Run() error {
	l := c.Logger.Sugar()

	defer c.Close()

	c.Wg.Add(2)

	go func() {
		defer c.Wg.Done()
		err := c.Crawl()

		if err != nil {
			l.Errorf("failed to crawl: %s", err.Error())
		}

		c.StreamState = Stopped
	}()

	go func() {
		defer c.Wg.Done()
		err := c.Stream()

		if err != nil {
			l.Errorf("failed to stream: %s", err.Error())
		}
		c.StreamState = Stopped
	}()

	return nil
}

func (c *EthereumCrawler) Crawl() error {
	l := c.Logger.Sugar()

	head := c.EthereumService.Head.Number.Uint64()

	if c.CrawlState != Ready {
		return errors.New("crawler not ready")
	}

	l.Infof("crawling %s from block %d to %d", c.Config.Network, c.crawlerStartBlock, head)

	for i := uint64(0); i <= head; i += uint64(c.Config.BatchSize) {
		end := i + uint64(c.Config.BatchSize) - 1
		if end > head {
			end = head
		}

		c.Wg.Add(1)
		go c.ProcessBatch(i, end)
	}

	return nil
}

func (c *EthereumCrawler) Stream() error {
	l := c.Logger.Sugar()

	wsurl := strings.Replace(c.EthereumService.URL.String(), "https", "wss", 1)

	_, err := NewEthereumService(wsurl)

	if err != nil {
		return err
	}

	current := c.EthereumService.Head.Number.Int64()

	l.Infof("streaming %s starting from block %d", c.Config.Network, current)

	header := make(chan *types.Header)

	sub, err := c.EthereumService.Client.SubscribeNewHead(context.Background(), header)

	if err != nil {
		return err
	}

	for {
		select {
		case err := <-sub.Err():
			return err
		case h := <-header:
			block, err := c.EthereumService.Block(h.Number.Uint64())

			if err != nil {
				return err
			}

			err = c.ProcessBlock(block.Number().Uint64())

			if err != nil {
				return err
			}
		}
	}
}

func (c *EthereumCrawler) Close() {
	l := c.Logger.Sugar()

	if len(c.Unprocessed) > 0 {
		l.Infof("unprocessed blocks: %d", len(c.Unprocessed))

		for _, b := range c.Unprocessed {
			err := c.ProcessBlock(b)

			if err != nil {
				// TODO: log this to s3 for another process retry
				l.Errorf("failed to process block=%d: %s", b, err.Error())
				continue
			}
		}
	}

	c.Wg.Wait()
	close(c.Sema)
	c.EthereumService.Client.Close()

	c.Elapsed = time.Since(c.Start)

	l.Infof("time elapse: %s, closed all connections, shutting down...", c.Elapsed)
	l.Sync()
}

func (c *EthereumCrawler) ProcessBatch(start, end uint64) error {
	l := c.Logger.Sugar()

	defer func() {
		c.Wg.Done()
		<-c.Sema
		l.Infof("completed batch=%d-%d", start, end)
	}()

	c.Sema <- struct{}{}

	l.Infof("processing batch=%d-%d", start, end)

	for i := start; i <= end; i++ {
		err := c.ProcessBlock(i)

		if err != nil {
			c.Unprocessed = append(c.Unprocessed, i)
			l.Errorf("failed to process block=%d: %s", i, err.Error())
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
		// actions, err := c.NewActionEvents(txEvent)

		// if err != nil {
		// 	return nil, err
		// }

		// events.ActionsPK = events.TxEventsPK
		// events.Actions = append(events.Actions, actions...)
	}

	// if (len(events.TxEvents)-1)*2 != len(events.Actions) {
	// 	l.Errorf("events mismatch: block=%d events=%d actions=%d", b, len(events.TxEvents), len(events.Actions))
	// 	return nil, errors.New("check the nnumber of")
	// }
	return events, nil
}

func (c *EthereumCrawler) NewActionEvents(txEvent *EthereumEvent) ([]*Action, error) {
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

func (c *EthereumCrawler) NewBlockEvent(b *types.Block) *EthereumEvent {
	return &EthereumEvent{
		Chain:      Ethereum,
		Network:    c.Config.Network,
		Provider:   Casimir,
		EventType:  Block,
		Height:     b.Number().Uint64(),
		Block:      b.Hash().Hex(),
		ReceivedAt: b.Time(),
	}
}

func (c *EthereumCrawler) NewTxEvent(b *types.Block, tx *types.Transaction) (*EthereumEvent, error) {
	txEvent := EthereumEvent{
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

func (c *EthereumCrawler) UploadBlockEvents(result *BlockEvents) error {
	l := c.Logger.Sugar()

	if len(result.TxEvents) == 0 {
		l.Errorf("no events found for block=%d", result.TxEventsPK.Block)
		return errors.New("no events found, there shoudl be at least one block event")
	}

	encodedEvents, err := NDJSON[EthereumEvent](result.TxEvents)

	if err != nil {
		return err
	}

	eventPartition := fmt.Sprintf("%s.ndjson", result.TxEventsPK.Marshal())

	err = c.S3.Upload(c.Glue.EventMetadata.Bucket, eventPartition, bytes.NewBuffer(encodedEvents.Bytes()))

	if err != nil {
		return err
	}

	// l.Infof("uploaded block=%d to partition=%s", result.TxEventsPK.Block, eventPartition)

	// if len(result.Actions) > 0 {
	// 	act, err := NDJSON[Action](result.Actions)

	// 	if err != nil {
	// 		return err
	// 	}

	// 	actionPartition := fmt.Sprintf("%s.%s", result.ActionsPK.String(), ext)

	// 	err = c.S3.Upload(c.Glue.ActionMeta.Bucket, actionPartition, bytes.NewBuffer(act.Bytes()))

	// 	if err != nil {
	// 		return err
	// 	}
	// 	// l.Infof("uploaded block %d actions to %s", result.ActionsPK.Block, actionPartition)
	// }

	return nil
}

func (s State) String() string {
	return [...]string{"ready", "running", "stopped"}[s-1]
}
