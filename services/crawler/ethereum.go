package main

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

type ChainType string
type NetworkType string
type ProviderType string
type EventType string

const (
	Ethereum ChainType = "ethereum"

	EtheruemMainnet NetworkType = "mainnet"
	EtheruemGoerli  NetworkType = "goerli"

	Casimir ProviderType = "casimir"

	Block       EventType = "block"
	Transaction EventType = "transaction"
	Contract    EventType = "contract"
)

type EthereumClient struct {
	Client   *ethclient.Client
	Network  NetworkType
	Provider ProviderType
	Url      url.URL
}

func NewEthereumClient(raw string) (*EthereumClient, error) {
	if raw == "" {
		return nil, errors.New("empty url")
	}

	url, err := url.Parse(raw)

	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(3*time.Second))

	defer cancel()

	client, err := ethclient.DialContext(ctx, url.String())

	if err != nil {
		return nil, err
	}

	defer cancel()

	var net NetworkType

	id, err := client.NetworkID(ctx)

	if err != nil {
		return nil, err
	}

	switch id.Int64() {
	case 1:
		net = EtheruemMainnet
	case 5:
		net = EtheruemGoerli
	default:
		return nil, fmt.Errorf("unsupported network id: %d", id.Int64())
	}

	return &EthereumClient{
		Client:   client,
		Network:  net,
		Provider: Casimir,
		Url:      *url,
	}, nil
}

func NewLocalEthereumClient() (*EthereumClient, error) {
	url := url.URL{
		Scheme: "http",
		Host:   "localhost:8545",
	}

	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(3*time.Second))

	defer cancel()

	client, err := ethclient.DialContext(ctx, url.String())

	if err != nil {
		return nil, err
	}

	defer cancel()

	var net NetworkType

	id, err := client.NetworkID(ctx)

	if err != nil {
		return nil, err
	}

	switch id.Int64() {
	case 1:
		net = EtheruemMainnet
	case 5:
		net = EtheruemGoerli
	default:
		return nil, fmt.Errorf("unsupported network id: %d", id.Int64())
	}

	return &EthereumClient{
		Client:   client,
		Network:  net,
		Provider: Casimir,
		Url:      url,
	}, nil
}

func (c ChainType) String() string {
	switch c {
	case Ethereum:
		return "ethereum"
	default:
		return ""
	}
}

func (c NetworkType) String() string {
	switch c {
	case EtheruemMainnet:
		return "mainnet"
	case EtheruemGoerli:
		return "goerli"
	default:
		return ""
	}
}
