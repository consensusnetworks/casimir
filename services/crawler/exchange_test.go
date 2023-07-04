package main

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"testing"
)

func TestCurrentPrice(t *testing.T) {
	err := LoadEnv()

	if err != nil {
		t.Error(err)
	}

	key := os.Getenv("CRYPTOCOMPARE_API_KEY")

	exchange, err := NewCryptoCompareExchange(key)

	if err != nil {
		t.Error(err)
	}

	price, err := exchange.CurrentPrice(Ethereum, USD)

	if err != nil {
		t.Error(err)
	}

	fmt.Println(price)
}

func TestHistoricalPrice(t *testing.T) {
	err := LoadEnv()

	if err != nil {
		t.Error(err)
	}

	url := os.Getenv("ETHEREUM_RPC_URL")

	if url == "" {
		t.Fatal("ETHEREUM_RPC_URL is not set")
	}

	client, err := NewEthereumClient(url)

	if err != nil {
		t.Fatal(err)
	}

	block, err := client.Client.BlockByNumber(context.Background(), big.NewInt(10000000))

	if err != nil {
		t.Error(err)
	}

	fmt.Println(block.Number().String())

	// if err != nil {
	// 	t.Error(err)
	// }

	// key := os.Getenv("CRYPTOCOMPARE_API_KEY")

	// exchange, err := NewCryptoCompareExchange(key)

	// if err != nil {
	// 	t.Error(err)
	// }

	// price, err := exchange.HistoricalPrice(Ethereum, USD, block.ReceivedAt)

	// if err != nil {
	// 	t.Error(err)
	// }

	// fmt.Println(price)
}
