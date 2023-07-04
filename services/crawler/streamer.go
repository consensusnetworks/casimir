package main

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"net"
	"net/url"
	"os"
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
}

func NewEthereumStreamer() (*EthereumStreamer, error) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		return nil, err
	}

	glue, err := NewGlueClient(config)

	if err != nil {
		return nil, err
	}

	s3, err := NewS3Client(config)

	if err != nil {
		return nil, err
	}

	streamer := &EthereumStreamer{
		Glue:    glue,
		S3:      s3,
		Mutex:   &sync.Mutex{},
		Begin:   time.Now(),
		Elapsed: 0,
	}

	raw := os.Getenv(ETHERUEM_RPC_URL)

	if raw == "" {
		return nil, errors.New("ETHERUEM_RPC_URL is not set")
	}

	urlParsed, err := url.Parse(raw)

	if err != nil {
		return nil, err
	}

	if urlParsed.Scheme == "https" {
		urlParsed.Scheme = "wss"
	}

	if urlParsed.Scheme == "http" {
		urlParsed.Scheme = "ws"
	}

	if err != nil {
		return nil, err
	}

	if urlParsed.Host == "localhost" {

		port := "8545"

		address := fmt.Sprintf("localhost:%s", port)

		conn, err := net.Dial("tcp", address)

		if err != nil {
			return nil, fmt.Errorf("failed to connect to the local hardhat network: %s", err)
		}

		defer conn.Close()

		client, err := NewLocalEthereumClient()

		if err != nil {
			return nil, err
		}
		streamer.EthereumClient = client

		return streamer, nil
	}

	client, err := NewEthereumClient(urlParsed.String())

	if err != nil {
		return nil, err
	}

	streamer.EthereumClient = client

	return streamer, nil
}

func (s *EthereumStreamer) Introspect() error {

	head, err := s.Client.HeaderByNumber(context.Background(), nil)

	if err != nil {
		return err
	}

	s.Head = head.Number.Uint64()

	if s.EthereumClient.Url.Host == "localhost" {
		contractAddress := os.Getenv("CONTRACT_ADDRESS")

		if contractAddress == "" {
			return errors.New("CONTRACT_ADDRESS is not set")
		}

		s.ContractAddress = contractAddress

		buildPath := "contracts/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json"

		if _, err := os.Stat(buildPath); os.IsNotExist(err) {
			return fmt.Errorf("contract build file does not exist: %v", err)
		}

		abiJson, err := os.ReadFile(buildPath)

		if err != nil {
			return err
		}

		if len(abiJson) == 0 {
			return errors.New("abi json is empty")
		}

		s.ContractABI = abiJson
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
	l := s.Logger

	l.Info("starting streamer\n")

	ctx := context.Background()

	head := s.Subscribe(ctx)

	for {
		select {
		case <-ctx.Done():
			return nil
		case h := <-head:
			_, _, err := s.ProcessBlock(int(h.Number.Uint64()))

			if err != nil {
				l.Error(err.Error())
				return err
			}
		}
	}
}

func (s *EthereumStreamer) ProcessBlock(height int) ([]*Event, []*WalletEvent, error) {
	l := s.Logger.Sugar()

	var events []*Event
	var walletEvents []*WalletEvent

	block, err := s.Client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		return nil, nil, err
	}

	l.Infof("processing block=%d\n", block.Number().Int64())

	blockEvent, err := s.EventFromBlock(block)

	if err != nil {
		return nil, nil, err
	}

	events = append(events, blockEvent)

	if block.Transactions().Len() > 0 {
		for i, tx := range block.Transactions() {
			l.Info("processing tx %d of %d in block %d\n", i+1, block.Transactions().Len(), block.Number().Int64())

			receipt, err := s.Client.TransactionReceipt(context.Background(), tx.Hash())

			if err != nil {
				return nil, nil, err
			}

			txEvents, walletEvent, err := s.EventsFromTransaction(block, receipt)

			if err != nil {
				return nil, nil, err
			}

			events = append(events, txEvents...)
			walletEvents = append(walletEvents, walletEvent...)
		}
	}
	return events, walletEvents, nil
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

	if len(walletEvents) == 0 || len(walletEvents) != len(txEvents)*2 {
		l.Errorf("wallet events and tx events mismatch, wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
	}

	return txEvents, walletEvents, nil
}

func (s *EthereumStreamer) EventFromBlock(b *types.Block) (*Event, error) {
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
