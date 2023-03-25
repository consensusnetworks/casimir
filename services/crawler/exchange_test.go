package main

import (
	"fmt"
	"testing"
	"time"
)

func TestCurrentPrice(t *testing.T) {
	now := time.Now()

	price, err := CurrentPrice(Ethereum, USD)

	if err != nil {
		t.Error(err)
		t.FailNow()
	}

	if price.Value == 0 {
		t.Error("invalid price")
		t.FailNow()
	}

	if price.Time.Before(now) {
		t.Errorf("the exchange time is older than the current time")
		t.FailNow()
	}
}

func TestHistoricalPrice(t *testing.T) {
	tt, err := time.Parse("Jan-02-2006 03:04:05 PM MST", "Aug-10-2021 09:53:39 PM UTC")

	if err != nil {
		t.Errorf("err: %v", err)
		t.FailNow()
	}

	block := tt.Unix()

	day := time.Unix(block, 0).Day()

	fmt.Printf("wanted day %v\n", day)

	price, err := HistoricalPrice(Ethereum, USD, time.Unix(block, 0))

	if err != nil {
		t.Errorf("err: %v", err)
		t.FailNow()
	}

	if price.Value == 0 {
		t.Errorf("failed to get the price for the given block")
		t.FailNow()
	}

	if price.Time.Day() != day {
		t.Errorf("the exchange time is not the same as the block time")
		t.FailNow()
	}
}
