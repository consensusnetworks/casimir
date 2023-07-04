package main

import (
	"context"
	"testing"
)

func TestNewEthereumStreamer(t *testing.T) {
	streamer, err := NewEthereumStreamer(false)

	if err != nil {
		t.Error(err)
	}

	_, err = streamer.Client.BlockNumber(context.Background())

	if err != nil {
		t.Error(err)
	}
}

func TestEthereumStreamer_Instrospect(t *testing.T) {
	err := LoadEnv()

	if err != nil {
		t.Error(err)
	}

	streamer, err := NewEthereumStreamer(true)

	if err != nil {
		t.Error(err)
	}

	err = streamer.Introspect()

	if err != nil {
		t.Error(err)
	}

	if streamer.ContractABI == nil {
		t.Error("NoContractABI: expected contract ABI to be set")
	}
}
