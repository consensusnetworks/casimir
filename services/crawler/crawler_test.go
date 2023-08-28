package main

import (
	"net/url"
	"testing"
)

func TestGetHistoricalContracts(t *testing.T) {
	_, err := LoadEnv()

	if err != nil {
		t.Error(err)
	}

	// ethURL := os.Getenv("ETHEREUM_RPC_URL")

	url, err := url.Parse("https://nodes.casimir.co/eth/hardhat")

	if err != nil {
		t.Error(err)
	}

	config := Config{
		Env:              Dev,
		URL:              url,
		Start:            0,
		BatchSize:        250_000,
		ConcurrencyLimit: 10,
	}

	crawler, err := NewEthereumCrawler(config)

	if err != nil {
		t.Error(err)
	}

	_, err = crawler.GetHistoricalContracts()

	if err != nil {
		t.Error(err)
	}

}

// func TestNewEthereumCrawler(t *testing.T) {
// 	var err error
// 	crawler, err := NewEthereumCrawler(Config{Env: Dev})

// 	if err != nil {
// 		t.Error(err)
// 	}

// 	_, err = crawler.Client.BlockNumber(context.Background())

// 	if err != nil {
// 		t.Error(err)
// 	}

// 	if crawler.Config.Version == 0 {
// 		t.Errorf("expected at least version 1, but got %s", crawler.Config.Version)
// 	}
// }
