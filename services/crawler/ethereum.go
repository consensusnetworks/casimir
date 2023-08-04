package main

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

type NetworkType string
type ProviderType string
type ChainType string

const (
	Casimir ProviderType = "casimir"

	EthereumMainnet NetworkType = "mainnet"
	EthereumGoerli  NetworkType = "goerli"
	EthereumHardhat NetworkType = "hardhat"

	Ethereum ChainType = "ethereum"
)

type EthereumService struct {
	Client   *ethclient.Client
	Network  NetworkType
	Provider ProviderType
	Url      url.URL
}

func NewEthereumService(raw string) (*EthereumService, error) {
	if raw == "" {
		return nil, errors.New("EmptyEthereumUrl: Ethereum url cannot be empty")
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
		net = EthereumMainnet
	case 5:
		if url.Host == "nodes.casimir.co" {
			urlPath := strings.Split(url.Path, "/")
			tt := urlPath[len(urlPath)-1]
			if tt == "hardhat" {
				net = EthereumHardhat
				break
			}
			net = EthereumGoerli
		}
		net = EthereumGoerli
	default:
		return nil, fmt.Errorf("unsupported network id: %d", id.Int64())
	}

	return &EthereumService{
		Client:   client,
		Network:  net,
		Provider: Casimir,
		Url:      *url,
	}, nil
}

func PingEthereumNode(url string) error {
	client, err := ethclient.Dial(url)

	if err != nil {
		return err
	}

	_, err = client.NetworkID(context.Background())

	if err != nil {
		return err
	}

	header, err := client.HeaderByNumber(context.Background(), nil)

	if err != nil {
		return err
	}

	if header == nil || header.Number.Int64() == 0 {
		return errors.New("empty header")
	}

	return err
}
