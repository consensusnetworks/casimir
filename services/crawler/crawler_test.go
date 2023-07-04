package main

import (
	"bufio"
	"context"
	"encoding/json"
	"os"
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

func TestRetryFailedBlocks(t *testing.T) {
	fileLogger, err := NewLogger(true)

	if err != nil {
		t.Error(err)
	}

	for i := 0; i < 10; i++ {
		if i%2 == 0 {
			fileLogger.Error("error message from test")
		} else {
			fileLogger.Warn("warn message from test")
		}
	}

	var entries []LogEntry

	f, err := os.Open(LogFile)

	if err != nil {
		t.Error(err)
	}

	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		var entry LogEntry

		bytes := scanner.Bytes()

		if len(bytes) == 0 {
			continue
		}

		err := json.Unmarshal(bytes, &entry)

		if err != nil {
			t.Error(err)
		}

		entries = append(entries, entry)
	}

	if len(entries) != 10 {
		t.Errorf("expected 10 log entries, got %d", len(entries))
	}

	err = os.Remove(LogFile)

	if err != nil {
		t.Error(err)
	}
}
