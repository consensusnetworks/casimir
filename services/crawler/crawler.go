package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"
	"sync"
	"time"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

type State int

const (
	Ready State = iota + 1
	Running
	Stopped
)

type ContractService struct {
	Caller         *Main // includes the tx and filterer
	CasimirManager common.Address
	ABI            abi.ABI
	StartBlock     uint64 // the block when the contract was deployed
	Timeout        time.Duration
}

type EthereumCrawler struct {
	CrawlSvc    *EthereumService
	StreamSvc   *EthereumService
	ContractSvc *ContractService
	GlueSvc     *GlueService
	S3Svc       *S3Service
	Logger      *Logger
	StreamQueue *StreamQueue
	Config      Config
	Wg          sync.WaitGroup
	Mu          sync.Mutex
	Sema        chan struct{}
	Unprocessed []uint64
	Start       time.Time
	Version     int
	Env         Env
	Elapsed     time.Duration
}

type StreamQueue struct {
	mu     sync.Mutex
	queue  []uint64
	cond   *sync.Cond
	closed bool
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

	l.Info("introspected glue tables")

	s3v, err := NewS3Service(awsConfig)

	if err != nil {
		l.Infof("failed to create s3 client: %s", err.Error())
		return nil, err
	}

	l.Info("created s3 service")

	rv, err := GetResourceVersion()

	if err != nil {
		l.Infof("failed to get resource version: %s", err.Error())
		return nil, err
	}

	crawler := &EthereumCrawler{
		Logger:   logger,
		CrawlSvc: eths,
		GlueSvc:  glue,
		S3Svc:    s3v,
		Wg:       sync.WaitGroup{},
		Start:    time.Now(),
		Sema:     make(chan struct{}, config.Concurrency),
		Version:  rv,
		Config:   config,
		Env:      config.Env,
	}

	crawler.CrawlSvc.State = Ready

	if config.Stream {
		streamsvc, err := NewEthereumService("wss://eth-goerli.g.alchemy.com/v2/xIW7WYw3IdVvHrfNejq29qsA0Bmdgmy2")

		if err != nil {
			return nil, err
		}

		if streamsvc.Network != crawler.CrawlSvc.Network {
			return nil, errors.New("stream network must match crawl network")
		}

		crawler.StreamSvc = streamsvc
		crawler.StreamSvc.State = Ready
		crawler.StreamQueue = NewStreamQueue()

	}

	// if config.Contract {
	// 	wsvc, err := NewContractService(eths.Client)

	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	crawler.ContractSvc = wsvc

	// 	l.Info("created contract service")
	// }

	return crawler, nil
}

func (c *EthereumCrawler) Run() error {
	l := c.Logger.Sugar()

	defer c.Close()

	l.Infow("running crawler with config", "config", c.Config)

	c.Wg.Add(1)
	go func() {
		defer func() {
			c.Wg.Done()
			c.CrawlSvc.State = Stopped
		}()
		err := c.Crawl()

		if err != nil {
			l.Errorf("failed to crawl: %s", err.Error())
		}
	}()

	if c.Config.Stream {
		c.Wg.Add(1)
		go func() {
			defer func() {
				c.Wg.Done()
				c.StreamSvc.State = Stopped
			}()
			err := c.Stream()

			if err != nil {
				l.Errorf("failed to stream: %s", err.Error())
			}
			c.StreamSvc.State = Stopped
		}()
	}

	return nil
}

func (c *EthereumCrawler) Crawl() error {
	l := c.Logger.Sugar()

	// head := c.CrawlSvc.Head.Number.Uint64()
	head := uint64(20)

	if c.CrawlSvc.State != Ready {
		return errors.New("crawler not ready")
	}

	l.Infof("crawling %s starting from block %d", c.Config.Network, head)

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

	l.Infof("creating websocket connection to %s", c.StreamSvc.URL.String())

	headers := make(chan *types.Header)

	sub, err := c.StreamSvc.Client.SubscribeNewHead(context.Background(), headers)

	if err != nil {
		log.Fatal(err)
	}

	defer sub.Unsubscribe()

	for {
		select {
		case err := <-sub.Err():
			log.Fatal(err)
		case header := <-headers:
			c.StreamQueue.Push(header.Number.Uint64())
			l.Infof("new block from stream: %d", header.Number.Uint64())
			l.Infof("enqueued block=%d (queue size=%d)", header.Number.Uint64(), len(c.StreamQueue.queue))
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
	c.CrawlSvc.Client.Close()

	if c.Config.Stream {
		c.StreamSvc.Client.Close()
		c.StreamQueue.Close()
	}

	c.Elapsed = time.Since(c.Start)

	l.Infof("time elapse: %s, closed all connections, shutting down...", c.Elapsed)
	l.Sync()
}

func NewStreamQueue() *StreamQueue {
	mu := sync.Mutex{}
	cond := sync.NewCond(&mu)

	return &StreamQueue{
		mu:     mu,
		cond:   cond,
		closed: false,
	}
}

func (q *StreamQueue) Push(b uint64) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if q.closed {
		return
	}

	q.queue = append(q.queue, b)
	q.cond.Signal()
}

func (q *StreamQueue) Pop() uint64 {
	q.mu.Lock()
	defer q.mu.Unlock()

	for len(q.queue) == 0 {
		q.cond.Wait()
	}

	b := q.queue[0]
	q.queue = q.queue[1:]
	return b
}

func (q *StreamQueue) Close() {
	q.mu.Lock()
	defer q.mu.Unlock()

	q.closed = true
	q.cond.Broadcast()
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
			l.Errorf("adding block=%d to unprocessed queue", i)
			continue
		}
	}

	return nil
}

func (c *EthereumCrawler) ProcessBlock(b uint64) error {
	txs, err := c.BlockEvents(b)

	if err != nil {
		return err
	}

	err = c.Upload(txs)

	if err != nil {
		return err
	}

	return nil
}

func (c *EthereumCrawler) BlockEvents(b uint64) (*BlockEvents, error) {
	events := &BlockEvents{}

	block, err := c.CrawlSvc.Block(b)

	if err != nil {
		log.Fatalf("debug11: %s", err.Error())
		return nil, err
	}

	blocktime := int64(block.Time())
	tt := time.Unix(blocktime, 0)
	ttyear := fmt.Sprintf("%04d", tt.Year())
	ttmonth := fmt.Sprintf("%02d", tt.Month())

	events.EventsPartition = Partition{
		Chain:   Ethereum,
		Network: c.Config.Network,
		Year:    ttyear,
		Month:   ttmonth,
		Block:   b,
	}

	blockEvent := c.EventFromBlock(block)

	events.TxEvents = append(events.TxEvents, blockEvent)

	if block.Transactions().Len() == 0 {
		return events, nil
	}

	for _, tx := range block.Transactions() {
		txEvent, err := c.EventFromTransaction(block, tx)

		if err != nil {
			log.Fatal("debug222")
			return nil, err
		}

		events.TxEvents = append(events.TxEvents, txEvent)
		actions, err := c.NewActionEvents(txEvent)

		if err != nil {
			return nil, err
		}

		events.ActionsPartition = events.EventsPartition
		events.Actions = append(events.Actions, actions...)
	}

	l := c.Logger.Sugar()

	if (len(events.TxEvents)-1)*2 != len(events.Actions) {
		l.Errorf("events mismatch: block=%d events=%d actions=%d", b, len(events.TxEvents), len(events.Actions))
		return nil, errors.New("events mismatch: there should be twice as many actions as events")
	}

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

func (c *EthereumCrawler) EventFromBlock(b *types.Block) *EthereumEvent {
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

func (c *EthereumCrawler) EventFromTransaction(b *types.Block, tx *types.Transaction) (*EthereumEvent, error) {
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

	sender, err := c.CrawlSvc.Client.TransactionSender(ctx, tx, b.Hash(), uint(0))

	if err != nil {
		return nil, err
	}

	txEvent.Sender = sender.Hex()
	senderBalance, err := c.CrawlSvc.Client.BalanceAt(ctx, sender, b.Number())

	if err != nil {
		return nil, err
	}

	txEvent.SenderBalance = senderBalance.String()

	if tx.To() != nil {
		txEvent.Recipient = tx.To().Hex()
		recipeintBalance, err := c.CrawlSvc.Client.BalanceAt(ctx, *tx.To(), b.Number())

		if err != nil {
			return nil, err
		}

		txEvent.RecipientBalance = recipeintBalance.String()
	}

	return &txEvent, nil
}

func (c *EthereumCrawler) EventFromLog(log types.Log) (*EthereumEvent, error) {
	return nil, nil
}

func (c *EthereumCrawler) Upload(result *BlockEvents) error {
	l := c.Logger.Sugar()

	if len(result.TxEvents) == 0 {
		l.Errorf("no events found for block=%d", result.EventsPartition.Block)
		return errors.New("no events found, there shoudl be at least one block event")
	}

	encodedEvents, err := NDJSON[EthereumEvent](result.TxEvents)

	if err != nil {
		return err
	}

	eventPartition := fmt.Sprintf("%s.ndjson", result.EventsPartition.Marshal())

	err = c.S3Svc.Put(c.GlueSvc.EventMetadata.Bucket, eventPartition, bytes.NewBuffer(encodedEvents.Bytes()))

	if err != nil {
		return err
	}

	// l.Infof("uploaded block=%d events to partition=%s", result.TxEventsPK.Block, eventPartition)

	if len(result.Actions) > 0 {
		act, err := NDJSON[Action](result.Actions)

		if err != nil {
			return err
		}

		actionPartition := fmt.Sprintf("%s.ndjson", result.ActionsPartition.Marshal())

		err = c.S3Svc.Put(c.GlueSvc.ActionMeta.Bucket, actionPartition, bytes.NewBuffer(act.Bytes()))

		if err != nil {
			return err
		}
		// l.Infof("uploaded block=%d actions events to partition=%s", result.ActionsPK.Block, actionPartition)
	}

	return nil
}

func NewContractService(client *ethclient.Client) (*ContractService, error) {
	abi, err := abi.JSON(strings.NewReader(MainMetaData.ABI))

	if err != nil {
		return nil, err
	}

	// local
	casimirManager := common.HexToAddress("0xfCd243D10C7E578a01FC8b7E0cFA64bC6d98c254")

	caller, err := NewMain(casimirManager, client)

	if err != nil {
		return nil, err
	}

	cs := ContractService{
		CasimirManager: casimirManager,
		StartBlock:     uint64(9602550),
		ABI:            abi,
		Caller:         caller,
		Timeout:        3 * time.Second,
	}

	if !cs.Deployed() {
		return nil, fmt.Errorf("it seems like the contract code is not deployed at %s", casimirManager.Hex())
	}

	return &cs, nil
}

func (cs *ContractService) Deployed() bool {
	_, err := cs.Caller.LatestActiveBalance(&bind.CallOpts{})
	return err == nil
}

func (cs *ContractService) GetUserStake(addr common.Address) (*big.Int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), cs.Timeout)

	defer cancel()

	opts := &bind.CallOpts{
		Context: ctx,
	}

	total, err := cs.Caller.GetUserStake(opts, addr)

	if err != nil {
		return nil, err
	}

	return total, nil
}

func (c *EthereumCrawler) FilterLogs() ([]types.Log, error) {
	filter := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(c.ContractSvc.StartBlock)),
		Addresses: []common.Address{c.ContractSvc.CasimirManager},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	logs, err := c.CrawlSvc.Client.FilterLogs(ctx, filter)

	if err != nil {
		return nil, err
	}

	return logs, nil
}

// to find all the parse methods in the manager use: grep -E '^\s*func.*Parse.*{' ./casimir_manager.go
func (cs ContractService) ParseLog(l types.Log) (interface{}, error) {
	event, err := cs.ABI.EventByID(l.Topics[0])

	if err != nil {
		return nil, err
	}

	switch event.Name {
	case "CompletedExitReportsRequested":
		l, err := cs.Caller.ParseCompletedExitReportsRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil

	case "DepositActivated":
		l, err := cs.Caller.ParseDepositActivated(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "DepositInitiated":
		l, err := cs.Caller.ParseDepositInitiated(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "DepositRequested":
		l, err := cs.Caller.ParseDepositRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ExitCompleted":
		l, err := cs.Caller.ParseExitCompleted(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ExitRequested":
		l, err := cs.Caller.ParseExitRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ForcedExitReportsRequested":
		l, err := cs.Caller.ParseForcedExitReportsRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "OwnershipTransferred":
		l, err := cs.Caller.ParseOwnershipTransferred(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ReshareCompleted":
		l, err := cs.Caller.ParseReshareCompleted(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ResharesRequested":
		l, err := cs.Caller.ParseResharesRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "RewardsDeposited":
		l, err := cs.Caller.ParseRewardsDeposited(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "SlashedExitReportsRequested":
		l, err := cs.Caller.ParseSlashedExitReportsRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "StakeDeposited":
		l, err := cs.Caller.ParseStakeDeposited(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "StakeRebalanced":
		l, err := cs.Caller.ParseStakeRebalanced(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "TipsDeposited":
		l, err := cs.Caller.ParseTipsDeposited(l)

		if err != nil {
			return nil, err
		}
		return l, nil
	case "WithdrawalInitiated":
		l, err := cs.Caller.ParseWithdrawalInitiated(l)

		if err != nil {
			return nil, err
		}
		return l, nil
	case "WithdrawalRequested":
		l, err := cs.Caller.ParseWithdrawalRequested(l)

		if err != nil {
			return nil, err
		}
		return l, nil
	default:
		return nil, fmt.Errorf("unknown event: %s", event.Name)
	}
}
