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
	Bitcoin  ChainType = "bitcoin"
	Iotex    ChainType = "iotex"

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

func NewEthereumClient(Provider ProviderType, url url.URL) (*EthereumClient, error) {
	if url.String() == "" {
		return nil, errors.New("etheruem rpc url is empty")
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
	case Bitcoin:
		return "bitcoin"
	case Iotex:
		return "iotex"
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
