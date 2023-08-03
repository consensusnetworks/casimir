package main

import (
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	err := LoadEnv()

	if err != nil {
		panic(err)
	}

	os.Exit(m.Run())
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
