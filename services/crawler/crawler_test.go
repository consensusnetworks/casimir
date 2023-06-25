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

	tt, err := crawler.Introspect()

	if err != nil {
		t.Error(err)
	}

	if len(tt) == 0 {
		t.Error("introspection returned no tables, expected at least 3")
	}
}
