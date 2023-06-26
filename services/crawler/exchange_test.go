package main

import (
	"os"
	"testing"
)

func TestCurrentPrice(t *testing.T) {

	var err error

	err = LoadEnv()

	if err != nil {
		t.Error(err)
	}

	key := os.Getenv("CRYPTOCOMPARE_API_KEY")

	exchange, err := NewCryptoCompareExchange(key)

	if err != nil {
		t.Error(err)
	}

	_, err = exchange.CurrentPrice(Ethereum, USD)

	if err != nil {
		t.Error(err)
	}
}
