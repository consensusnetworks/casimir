package main

import (
	"context"
	"errors"
	"math/big"
	"net/url"
	"os"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/schollz/progressbar"
)

type EthereumStreamer struct {
	EthereumClient
	Logger
	Mutex    *sync.Mutex
	Begin    time.Time
	Elapsed  time.Duration
	Glue     *GlueClient
	S3       *S3Client
	Exchange Exchange
	Head     uint64
	// the ever increasing curren block number of the chain
	ProcessingBlock uint64
	EventsConsumed  int
	Version         int
	Progress        *progressbar.ProgressBar
}

func NewEthereumStreamer() (*EthereumStreamer, error) {
	err := LoadEnv()

	if err != nil {
		return nil, err
	}

	raw := os.Getenv("ETHEREUM_WS")

	if raw == "" {
		return nil, errors.New("ETHERUEM_WS env variable is not set")
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

	if err != nil {
		return nil, err
	}

	key := os.Getenv("CRYPTOCOMPARE_API_KEY")

	exchange, err := NewCryptoCompareExchange(key)

	if err != nil {
		return nil, err
	}

	return &EthereumStreamer{
		EthereumClient: *client,
		Logger:         NewStdoutLogger(),
		Mutex:          &sync.Mutex{},
		Head:           head,
		Exchange:       exchange,
		Begin:          time.Now(),
	}, nil
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
	l := s.Logger

	var events []*Event
	var walletEvents []*WalletEvent

	block, err := s.Client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		return nil, nil, err
	}

	l.Info("processing block=%d\n", block.Number().Int64())

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

	l := s.Logger

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
		l.Error("wallet events and tx events mismatch, wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
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
