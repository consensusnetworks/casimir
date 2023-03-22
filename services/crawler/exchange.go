package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"time"
)

type Price struct {
	Value    float64   `json:"price,omitempty"`
	Currency string    `json:"currency,omitempty"`
	Coin     string    `json:"coin,omitempty"`
	Time     time.Time `json:"time,omitempty"`
}

func (e *EthereumCrawler) CurrentPrice(currency string) (Price, error) {
	if currency == "" {
		currency = "USD"
	}

	coin := e.Chain

	if len(currency) != 3 {
		return Price{}, fmt.Errorf("invalid currency")
	}

	var price Price
	var m map[string]interface{}

	url := fmt.Sprintf("https://min-api.cryptocompare.com/data/price?fsym=%s&tsyms=%s", coin.Short(), currency)

	price.Coin = coin.Short()
	price.Currency = currency
	price.Time = time.Now().UTC()

	req, err := e.HttpClient.Get(url)

	if err != nil {
		return price, err
	}

	defer req.Body.Close()

	res, err := io.ReadAll(req.Body)

	if err != nil {
		return price, err
	}

	body := bytes.NewReader(res)

	err = json.NewDecoder(body).Decode(&m)

	if err != nil {
		return price, err
	}

	v, ok := m["USD"]

	if !ok {
		return price, fmt.Errorf("invalid response")
	}

	price.Value = v.(float64)

	return price, nil
}

func (c ChainType) Short() string {
	switch c {
	case Ethereum:
		return "ETH"
	case Iotex:
		return "IOTX"

	default:
		panic("invalid chain type")
	}
}
