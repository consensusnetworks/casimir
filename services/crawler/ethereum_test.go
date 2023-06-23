package main

import (
	"net/url"
	"os"
	"testing"
)

func TestNewEtheruemClient(t *testing.T) {
	err := LoadEnv()

	if err != nil {
		t.Fatal(err)
	}

	raw := os.Getenv("ETHEREUM_RPC")

	url, err := url.Parse(raw)

	if err != nil {
		t.Fatal(err)
	}

	client, err := NewEthereumClient(Casimir, *url)

	if err != nil {
		t.Fatal(err)
	}

	if client == nil {
		t.Fatal("client is nil")
	}
}
