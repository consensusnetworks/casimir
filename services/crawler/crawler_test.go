package main

import (
	"context"
	"testing"
)

func TestNewEtheruemCrawler(t *testing.T) {
	var err error
	crawler, err := NewCrawler()

	if err != nil {
		t.Error(err)
	}

	_, err = crawler.Client.BlockNumber(context.Background())

	if err != nil {
		t.Error(err)
	}
}

func TestEtheruemCrawler_Introspect(t *testing.T) {
	crawler, err := NewCrawler()

	if err != nil {
		t.Error(err)
	}

	err = crawler.Introspect()

	if err != nil {
		t.Error(err)
	}
}
