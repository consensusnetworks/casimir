package main

import (
	"context"
	"testing"
)

func TestNewEthereumStreamer(t *testing.T) {
	streamer, err := NewEtheruemStreamer()

	if err != nil {
		t.Error(err)
	}

	_, err = streamer.Client.BlockNumber(context.Background())

	if err != nil {
		t.Error(err)
	}
}
