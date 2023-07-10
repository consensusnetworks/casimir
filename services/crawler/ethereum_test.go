package main

import (
	"context"
	"os"
	"testing"
)

func TestNewEthereumClient(t *testing.T) {
	url := os.Getenv("ETHEREUM_RPC_URL")

	if url == "" {
		t.Fatal("ETHEREUM_RPC_URL is not set")
	}

	_, err := NewEthereumService(url)

	if err != nil {
		t.Fatal(err)
	}
}

func TestNewEthereumService(t *testing.T) {
	url := os.Getenv("ETHEREUM_RPC_URL")

	if url == "" {
		t.Fatal("ETHEREUM_RPC_URL is not set")
	}

	client, err := NewEthereumService(url)

	if err != nil {
		t.Fatal(err)
	}

	head, err := client.Client.HeaderByNumber(context.Background(), nil)

	if err != nil {
		t.Fatal(err)
	}
	t.Log(head.Number.String())
}
