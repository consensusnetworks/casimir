package main

import (
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	setup()
	code := m.Run()
	os.Exit(code)
}

func setup() {
	err := LoadEnv()

	if err != nil {
		panic(err)
	}
}

func TestLoadEnv(t *testing.T) {
	err := LoadEnv()

	if err != nil {
		t.Errorf("error loading env: %v", err)
	}

	if os.Getenv("EVENT_BUCKET") == "" {
		t.Errorf("enviroment variable EVENT_BUCKET is not set")
	}

	if os.Getenv("AWS_ACCESS_KEY") == "" {
		t.Errorf("enviroment variable AWS_ACCESS_KEY is not set")
	}

	if os.Getenv("AWS_SECRET_KEY") == "" {
		t.Errorf("enviroment variable AWS_SECRET_KEY is not set")
	}

	if os.Getenv("AWS_REGION") == "" {
		t.Errorf("enviroment variable AWS_REGION is not set")
	}

	if os.Getenv("EVENT_BUCKET") == "" {
		t.Errorf("enviroment variable EVENT_BUCKET is not set")
	}

	if os.Getenv("CONSENSUS_RPC_URL") == "" {
		t.Errorf("enviroment variable CONSENSUS_RPC_URL is not set")
	}

	if os.Getenv("CONSENSUS_WS_URL") == "" {
		t.Errorf("enviroment variable CONSENSUS_WS_URL is not set")
	}
}

func TestNewEthereumCrawler(t *testing.T) {
	config := &BaseConfig{
		Chain:    Ethereum,
		Network:  Mainnet,
		Provider: Consensus,
		Url:      os.Getenv("CONSENSUS_RPC_URL"),
	}

	crawler, err := NewEthereumCrawler(config)

	if err != nil {
		t.Errorf("error creating crawler: %v", err)
	}

	if crawler == nil || crawler.EthClient == nil {
		t.Errorf("ethclient is nil")
	}
}

func TestBatchIntervals(t *testing.T) {
	start := int64(0)
	end := int64(15000000)

	parts := int64(20)

	batches := BatchIntervals(start, end, parts)

	if len(batches) != 20 {
		t.Errorf("expected 20 batches, got %d", len(batches))
	}

	if batches[0][0] != 0 {
		t.Errorf("expected 0, got %d", batches[0][0])
	}
}
