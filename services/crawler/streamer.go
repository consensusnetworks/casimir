package main

import (
	"context"
	"errors"
	"fmt"
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
	Mutex   *sync.Mutex
	Begin   time.Time
	Elapsed time.Duration
	Glue    *GlueClient
	S3      *S3Client
	Head    uint64
	// the ever increasing curren block number of the chain
	CurrentHead    uint64
	EventsConsumed int
	Version        int
	Progress       *progressbar.ProgressBar
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

	return &EthereumStreamer{
		EthereumClient: *client,
		Logger:         NewStdoutLogger(),
		Mutex:          &sync.Mutex{},
		Head:           head,
		Begin:          time.Now(),
	}, nil
}

// SubscribeToHead returns a channel for consumers to read the head
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
			s.Mutex.Lock()
			s.CurrentHead = h.Number.Uint64()
			l.Info(fmt.Sprintf("currentHead=%d\n", s.CurrentHead))
			s.Mutex.Unlock()

			_, err := s.ProcessBlock()

			if err != nil {
				l.Error(err.Error())
				return err
			}

		}
	}
}

func (s *EthereumStreamer) ProcessBlock() ([]*Event, error) {
	l := s.Logger

	l.Info("processingBlock=%d\n", s.CurrentHead)

	ctx := context.Background()

	block, err := s.EthereumClient.Client.BlockByNumber(ctx, new(big.Int).SetUint64(s.CurrentHead))

	if err != nil {
		return nil, err
	}

	var events []*Event

	blockEvent, err := s.BlockEvent(block)

	if err != nil {
		return nil, err
	}

	events = append(events, blockEvent)

	// for _, tx := range block.Transactions() {
	// 	txEvent, err := s.TransactionEvent(tx)

	// 	if err != nil {
	// 		return nil, err
	// 	}

	// }
	return events, nil
}

func (c *EthereumStreamer) BlockEvent(b *types.Block) (*Event, error) {
	event := Event{
		Chain:    Ethereum,
		Network:  c.Network,
		Provider: Casimir,
		Type:     Block,
		Height:   int64(b.Number().Uint64()),
	}

	if b.Hash().Hex() != "" {
		event.Block = b.Hash().Hex()
	}

	if b.Time() != 0 {
		event.ReceivedAt = time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999")
	}

	return &event, nil
}

func (c *EthereumStreamer) TransactionEvent(b *types.Block, tx *types.Receipt) ([]*Event, error) {
	var events []*Event

	for index, tx := range b.Transactions() {
		txEvent := Event{
			Chain:    Ethereum,
			Network:  c.Network,
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
