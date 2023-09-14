package main

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

type Chain string
type Network string
type Provider string

const (
	Ethereum Chain = "ethereum"

	Casimir Provider = "casimir"

	EthereumMainnet Network = "mainnet"
	EthereumHardhat Network = "hardhat"
	EthereumGoerli  Network = "goerli"
)

type EthereumService struct {
	URL      *url.URL
	Client   *ethclient.Client
	Network  Network
	Provider Provider
	Head     *types.Header
}

func NewEthereumService(raw string) (*EthereumService, error) {
	if raw == "" {
		return nil, errors.New("url cannot be empty")
	}

	parsed, err := url.Parse(raw)

	if err != nil {
		return nil, err
	}

	if parsed.String() == "" {
		return nil, errors.New("etheruem rpc url is empty")
	}

	ctx := context.TODO()

	client, err := ethclient.DialContext(ctx, parsed.String())

	if err != nil {
		return nil, err
	}

	header, err := client.HeaderByNumber(context.Background(), nil)

	if err != nil {
		return nil, err
	}

	var net Network

	id, err := client.NetworkID(ctx)

	if err != nil {
		return nil, err
	}

	switch id.Int64() {
	case 1:
		net = EthereumMainnet
	case 5:
		net = EthereumGoerli
	default:
		return nil, fmt.Errorf("unsupported network id: %d", id.Int64())
	}

	return &EthereumService{
		Client:   client,
		Network:  net,
		Provider: Casimir,
		URL:      parsed,
		Head:     header,
	}, nil
}

func NewEthereumServiceWithTimeout(raw string, timeout time.Duration) (*EthereumService, error) {
	if raw == "" {
		return nil, errors.New("url cannot be empty")
	}

	parsed, err := url.Parse(raw)

	if err != nil {
		return nil, err
	}

	if parsed.String() == "" {
		return nil, errors.New("etheruem rpc url is empty")
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)

	defer cancel()

	client, err := ethclient.DialContext(ctx, parsed.String())

	if err != nil {
		return nil, err
	}

	header, err := client.HeaderByNumber(ctx, nil)

	if err != nil {
		return nil, err
	}

	var net Network

	id, err := client.NetworkID(ctx)

	if err != nil {
		return nil, err
	}

	switch id.Int64() {
	case 1:
		net = EthereumMainnet
	case 5:
		net = EthereumGoerli
	default:
		return nil, fmt.Errorf("unsupported network id: %d", id.Int64())
	}

	return &EthereumService{
		Client:   client,
		Network:  net,
		Provider: Casimir,
		URL:      parsed,
		Head:     header,
	}, nil
}

func (e *EthereumService) GetBlockByNumber(b uint64) (*types.Block, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)

	defer cancel()

	block, err := e.Client.BlockByNumber(ctx, big.NewInt(int64(b)))

	if err != nil {
		return nil, fmt.Errorf("failed to get block=%d: %s", b, err.Error())
	}

	return block, nil
}

func (e *EthereumService) Block(b uint64) (*types.Block, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)

	defer cancel()

	block, err := e.Client.BlockByNumber(ctx, big.NewInt(int64(b)))

	if err != nil {
		return nil, err
	}

	return block, nil
}

func GasFeeInETH(gasPrice *big.Int, gasLimit uint64) float64 {
	gasPriceFloat64 := new(big.Float).SetInt(gasPrice)
	gasLimitInt64 := int64(gasLimit)

	gasFee := new(big.Float).Mul(gasPriceFloat64, big.NewFloat(float64(gasLimitInt64)))
	gasFeeFloat64, _ := gasFee.Float64()

	return gasFeeFloat64 / 1e18
}

func WeiToETH(wei *big.Int) float64 {
	weiEth := big.NewInt(1e18)
	eth := new(big.Float).Quo(new(big.Float).SetInt(wei), new(big.Float).SetInt(weiEth))
	float, _ := eth.Float64()
	return float
}

// func (e *EthereumService) Transactions(b uint64) ([]*types.Transaction, error) {
// 	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)

// 	defer cancel()

// 	// get the block transactions
// 	block, err := e.Client.BlockByNumber(ctx, big.NewInt(int64(b)))

// 	if err != nil {
// 		return nil, err
// 	}

// 	return block.Transactions(), nil
// }
