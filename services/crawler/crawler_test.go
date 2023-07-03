package main

import (
	"context"
	"testing"
)

func TestNewEthereumCrawler(t *testing.T) {
	var err error
	crawler, err := NewEthereumCrawler()

	if err != nil {
		t.Error(err)
	}

	_, err = crawler.Client.BlockNumber(context.Background())

	if err != nil {
		t.Error(err)
	}
}

func TestEthereumCrawler_Introspect(t *testing.T) {
	crawler, err := NewEthereumCrawler()

	if err != nil {
		t.Error(err)
	}

	err = crawler.Introspect()

	if err != nil {
		t.Error(err)
	}

	if crawler.EventBucket == "" {
		t.Error("introspection returned no tables, expected events table")
	}

	if crawler.WalletBucket == "" {
		t.Error("introspection returned no tables, expected wallets table")
	}

	if crawler.StakingBucket == "" {
		t.Error("introspection returned no tables, expected staking action table")
	}
}
