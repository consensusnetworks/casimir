package main

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/schollz/progressbar"
)

type EthereumStreamer struct {
	EtheruemClient
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

func NewEtheruemStreamer() (*EthereumStreamer, error) {
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

	config, err := LoadDefaultAWSConfig()

	if err != nil {
		return nil, err
	}

	glue, err := NewGlueClient(config)

	if err != nil {
		return nil, err
	}

	s3c, err := NewS3Client()

	if err != nil {
		return nil, err
	}

	return &EthereumStreamer{
		EtheruemClient: *client,
		Logger:         NewStdoutLogger(),
		Mutex:          &sync.Mutex{},
		Glue:           glue,
		S3:             s3c,
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
			l.Info(fmt.Sprintf("head: %d\n", h.Number.Int64()))
		}
	}
}
