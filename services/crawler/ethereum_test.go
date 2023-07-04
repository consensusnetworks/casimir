package main

import (
	"context"
	"os"
	"testing"
)

func TestNewEtheruemClient(t *testing.T) {
	err := LoadEnv()

	if err != nil {
		t.Fatal(err)
	}

	url := os.Getenv("ETHEREUM_RPC_URL")

	if url == "" {
		t.Fatal("ETHEREUM_RPC_URL is not set")
	}

	client, err := NewEthereumClient(url)

	if err != nil {
		t.Fatal(err)
	}

	head, err := client.Client.HeaderByNumber(context.Background(), nil)

	if err != nil {
		t.Fatal(err)
	}

	t.Log(head.Number.String())
}
