package main

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

type ChainType int
type NetworkType int
type ProviderType int
type EventType int

const (
	Ethereum ChainType = iota
	Bitcoin
	Iotex

	EtheruemMainnet NetworkType = iota
	EtheruemGoerli

	Casimir ProviderType = iota
	Alchemy

	Block EventType = iota
	Transaction
	Log
	Contract
)

type EtheruemClient struct {
	Client   *ethclient.Client
	Netowrk  NetworkType
	Provider ProviderType
	Url      url.URL
}

func NewEthereumClient(Provider ProviderType, url url.URL) (*EtheruemClient, error) {
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

	return &EtheruemClient{
		Client:   client,
		Netowrk:  net,
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

func (c ProviderType) String() string {
	switch c {
	case Casimir:
		return "casimir"
	case Alchemy:
		return "alchemy"
	default:
		return ""
	}
}

func (c EventType) String() string {
	switch c {
	case Block:
		return "block"
	case Transaction:
		return "transaction"
	case Log:
		return "log"
	case Contract:
		return "contract"
	default:
		return ""
	}
}
