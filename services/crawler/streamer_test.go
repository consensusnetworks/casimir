package main

import (
	"context"
	"testing"
)

func TestNewEthereumStreamer(t *testing.T) {
	streamer, err := NewEthereumStreamer()

	if err != nil {
		t.Error(err)
	}

	_, err = streamer.Client.BlockNumber(context.Background())

	if err != nil {
		t.Error(err)
	}
}
