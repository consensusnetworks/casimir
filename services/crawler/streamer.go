package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"go.uber.org/zap"
)

type EthereumStreamer struct {
	*EthereumClient
	Logger          *zap.Logger
	Mutex           *sync.Mutex
	Begin           time.Time
	Elapsed         time.Duration
	Glue            *GlueClient
	S3              *S3Client
	Exchange        Exchange
	Head            uint64
	ProcessingBlock uint64
	EventsConsumed  int
	Version         int
	ContractAddress string
	ContractABI     []byte
	EventBucket     string
	WalletBucket    string
	StakingBucket   string
	Local           bool
}

func NewEthereumStreamer(local bool) (*EthereumStreamer, error) {
	logger, err := zap.NewProduction()

	if err != nil {
		return nil, err
	}

	l := logger.Sugar()

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

	s3, err := NewS3Client(config)

	if err != nil {
		l.Infof("FailedToCreateS3Client: %s", err.Error())
		return nil, err
	}

	streamer := &EthereumStreamer{
		Glue:    glue,
		S3:      s3,
		Mutex:   &sync.Mutex{},
		Begin:   time.Now(),
		Elapsed: 0,
		Logger:  logger,
	}

	raw := os.Getenv("ETHEREUM_RPC_URL")

	if raw == "" {
		return nil, errors.New("EnvVariableNotFound: ETHEREUM_RPC_URL is not set")
	}

	urlParsed, err := url.Parse(raw)

	if err != nil {
		l.Infof("FailedToParseUrl: %s", err.Error())
		return nil, err
	}

	if urlParsed.Scheme == "https" {
		urlParsed.Scheme = "wss"
	}

	if urlParsed.Scheme == "http" {
		urlParsed.Scheme = "ws"
	}

	if urlParsed.Host == "localhost" || local {
		streamer.Local = true
		port := "8545"
		address := fmt.Sprintf("localhost:%s", port)
		conn, err := net.Dial("tcp", address)

		if err != nil {
			l.Infof("FailedToConnectToLocalNetwork: %s", err.Error())
			return nil, err
		}

		defer conn.Close()

		client, err := NewLocalEthereumClient()

		if err != nil {
			l.Infof("FailedToCreateLocalEthereumClient: %s", err.Error())
			return nil, err
		}
		streamer.EthereumClient = client

		return streamer, nil
	}

	client, err := NewEthereumClient(urlParsed.String())

	if err != nil {
		l.Infof("FailedToCreateEthereumClient: %s", err.Error())
		return nil, err
	}

	head, err := client.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("FailedToGetHead: %s", err.Error())
		return nil, err
	}

	streamer.Local = false
	streamer.Head = head
	streamer.EthereumClient = client

	return streamer, nil
}

func (s *EthereumStreamer) Introspect() error {
	l := s.Logger.Sugar()

	head, err := s.Client.HeaderByNumber(context.Background(), nil)

	if err != nil {
		l.Infof("FailedToGetHead: %s", err.Error())
		return err
	}

	s.Head = head.Number.Uint64()

	if s.Local {
		// contractAddress := os.Getenv("CONTRACT_ADDRESS")

		// if contractAddress == "" {
		// 	return errors.New("EnvVariableNotFound: CONTRACT_ADDRESS is not set")
		// }

		// s.ContractAddress = contractAddress

		buildPath := "contracts/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json"

		wd, err := os.Getwd()

		if err != nil {
			return err
		}

		last := strings.Split(wd, "/")[len(strings.Split(wd, "/"))-1]

		if last != "casimir" {
			buildPath = "../../" + buildPath
		}

		if _, err := os.Stat(buildPath); os.IsNotExist(err) {
			l.Infof("ContractBuildFileDoesNotExist: %s", err.Error())
			return err
		}

		abi, err := os.ReadFile(buildPath)

		if err != nil {
			l.Infof("FailedToReadContractBuildFile: %s", err.Error())
			return err
		}

		if len(abi) == 0 {
			return errors.New("ContractBuildFileIsEmpty")
		}

		s.ContractABI = abi
	}

	return nil
}

func (s *EthereumStreamer) Subscribe(ctx context.Context) <-chan *types.Header {
	l := s.Logger

	header := make(chan *types.Header)

	producer, err := s.Client.SubscribeNewHead(ctx, header)

	if err != nil {
		l.Error(err.Error())
		close(header)
		return header
	}

	go func() {
		defer close(header)
		defer producer.Unsubscribe()

		for {
			select {
			case <-ctx.Done():
				return
			case err := <-producer.Err():
				l.Error(err.Error())
				close(header)
				return
			}
		}
	}()
	return header
}

func (s *EthereumStreamer) Stream() error {
	l := s.Logger.Sugar()

	err := s.Introspect()

	if err != nil {
		l.Infof("FailedToIntrospect: %s", err.Error())
		return err
	}

	if s.EthereumClient.Url.Host == "localhost" {
		l.Infof("Using Local Ethereum Fork")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	head := s.Subscribe(ctx)

	workers := 100
	blockQueue := make(chan *types.Header, workers)

	var wg sync.WaitGroup

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for header := range blockQueue {
				tx, wallet, err := s.ProcessBlock(header.Number.Int64())

				if err != nil {
					l.Infof("FailedToProcessBlock: %s", err.Error())
					continue
				}

				err = s.SaveBlock(header.Number.Int64(), tx, wallet)

				if err != nil {
					l.Infof("FailedToSaveBlock: %s", err.Error())
					continue
				}
			}
		}()
	}

	for {
		select {
		case <-ctx.Done():
			close(blockQueue)
			wg.Wait()
			return ctx.Err()
		case h := <-head:
			select {
			case blockQueue <- h:
			default:
				// queue is full
				l.Errorf("BlockQueueFull: increase the number of workers")
			}
		}
	}
}

func (s *EthereumStreamer) SaveBlock(block int64, tx *[]Event, wallet *[]WalletEvent) error {
	l := s.Logger.Sugar()

	if len(*tx) != 0 {
		err := s.SaveTxEvents(block, tx)

		if err != nil {
			l.Infof("FailedToSaveTxEvents: " + err.Error())
			return err
		}
	}

	if len(*wallet) != 0 {
		err := s.SaveWalletEvents(block, wallet)

		if err != nil {
			l.Infof("FailedToSaveWalletEvents: %s", err.Error())
			return err
		}

	}

	l.Infof("SavedBlock: %d", block)
	return nil
}

func (s *EthereumStreamer) SaveTxEvents(block int64, tx *[]Event) error {
	l := s.Logger.Sugar()
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

	if s.EventBucket[len(s.EventBucket)-1] == '/' {
		s.EventBucket = s.EventBucket[:len(s.EventBucket)-1]
	}

	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), s.Network.String(), block)

	err := s.S3.UploadBytes(s.EventBucket, dest, &txEvents)

	if err != nil {
		l.Infof("FailedToUpload: %s", err.Error())
		return err
	}

	return nil
}

func (s *EthereumStreamer) SaveWalletEvents(block int64, wallet *[]WalletEvent) error {
	l := s.Logger.Sugar()

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

	if s.WalletBucket[len(s.WalletBucket)-1] == '/' {
		s.WalletBucket = s.WalletBucket[:len(s.WalletBucket)-1]
	}

	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), s.Network.String(), block)

	err := s.S3.UploadBytes(s.WalletBucket, dest, &walletEvents)

	if err != nil {
		l.Infof("FailedToUpload: %s", err.Error())
		return err
	}

	return nil
}

func (c *EthereumStreamer) ProcessBlock(height int64) (*[]Event, *[]WalletEvent, error) {
	l := c.Logger.Sugar()

	tx, wallet, err := c.BlockEvents(height)

	if err != nil {
		l.Infof("FailedToGetBlockEvents: block=%d error=%s", height, err.Error())
		return nil, nil, err
	}

	return tx, wallet, nil
}

// BlockEvents returns all events for a given block
func (s *EthereumStreamer) BlockEvents(height int64) (*[]Event, *[]WalletEvent, error) {
	l := s.Logger.Sugar()

	var txEvents []Event
	var walletEvents []WalletEvent

	b, err := s.Client.BlockByNumber(context.Background(), big.NewInt(height))

	if err != nil {
		l.Infof("FailedToGetBlock: %s", err.Error())
		return nil, nil, err
	}

	blockEvent := Event{
		Chain:      Ethereum,
		Network:    s.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b.Number().Uint64()),
		Block:      b.Hash().Hex(),
		ReceivedAt: time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
	}

	txEvents = append(txEvents, blockEvent)

	for index, tx := range b.Transactions() {
		receipt, err := s.Client.TransactionReceipt(context.Background(), tx.Hash())

		if err != nil {
			l.Infof("FailedToGetTransactionReceipt: %s", err.Error())
			return nil, nil, err
		}

		// l.Infof("ProcessingTransaction: Transaction %d of %d", index+1, len(b.Transactions()))

		txEvent := Event{
			Chain:       Ethereum,
			Network:     s.Network,
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
			recipeintBalance, err := s.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

			if err != nil {
				l.Infof("FailedToGetBalanceAt: %s", err.Error())
				return nil, nil, err
			}

			txEvent.RecipientBalance = recipeintBalance.String()
		}

		sender, err := s.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

		if err != nil {
			l.Infof("FailedToGetTransactionSender: %s", err.Error())
			return nil, nil, err
		}

		if sender.Hex() != "" {
			txEvent.Sender = sender.Hex()

			senderBalance, err := s.Client.BalanceAt(context.Background(), sender, b.Number())

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

		if !s.Local {
			continue
		}
		// TODO: handle contract events (staking action)
	}

	// don't stop processing we will retry later (-1 because the txEvent includes the block event)
	if len(txEvents) != 0 && len(walletEvents) != 0 && len(walletEvents) != (len(txEvents)-1)*2 {
		l.Errorf("TxWalletEventsMismatch: wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
	}

	return &txEvents, &walletEvents, nil
}

func (s *EthereumStreamer) EventsFromTransaction(b *types.Block, receipt *types.Receipt) ([]*Event, []*WalletEvent, error) {
	var txEvents []*Event
	var walletEvents []*WalletEvent

	l := s.Logger.Sugar()

	for index, tx := range b.Transactions() {
		txEvent := Event{
			Chain:       Ethereum,
			Network:     s.Network,
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
			recipeintBalance, err := s.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

			if err != nil {
				return nil, nil, err
			}

			txEvent.RecipientBalance = recipeintBalance.String()
		}

		sender, err := s.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

		if err != nil {
			return nil, nil, err
		}

		if sender.Hex() != "" {
			txEvent.Sender = sender.Hex()

			senderBalance, err := s.Client.BalanceAt(context.Background(), sender, b.Number())

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

	// don't stop processing we will retry later (-1 because the txEvent includes the block event)
	if len(txEvents) != 0 && len(walletEvents) != 0 && len(walletEvents) != (len(txEvents)-1)*2 {
		l.Errorf("TxWalletEventsMismatch: wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
	}

	return txEvents, walletEvents, nil
}

func (s *EthereumStreamer) BlockEvent(b *types.Block) (*Event, error) {
	event := Event{
		Chain:      Ethereum,
		Network:    s.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b.Number().Uint64()),
		Block:      b.Hash().Hex(),
		ReceivedAt: time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
	}
	return &event, nil
}
