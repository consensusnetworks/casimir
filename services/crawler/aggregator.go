package main

import (
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/ethclient"
)

type ChainAggregator struct {
	BaseConfig
	EthClient *ethclient.Client
	S3Client  *s3.S3
}

type BalanceSnapshot struct {
	Date    string `json:"date"`
	Balance string `json:"balance"`
}

type Account struct {
	Address         string `json:"address"`
	Balance         string `json:"balance"`
	BalanceSnapshot string `json:"balance_snapshot"`
}

type User struct {
	Address string    `json:"address"`
	Account []Account `json:"accounts"`
}

func NewAggregator(config BaseConfig) (*ChainAggregator, error) {
	agg := &ChainAggregator{}

	client, err := NewEthereumClient(config.Url)

	if err != nil {
		return nil, err
	}

	agg.EthClient = client
	return agg, nil
}

func (ca *ChainAggregator) Aggregate() error {
	return nil
}

func (ca *ChainAggregator) Save(dest string, data []byte) error {
	return nil
}
