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
	Previous *Price    `json:"previous,omitempty"`
}

type Currency string

const (
	USD Currency = "USD"
)

type TempPrice struct {
	Response   string `json:"Response"`
	Message    string `json:"Message"`
	HasWarning bool   `json:"HasWarning"`
	TimeFrom   int64  `json:"TimeFrom"`
	TimeTo     int64  `json:"TimeTo"`
	Data       struct {
		Aggregated bool `json:"Aggregated"`
		TimeFrom   int  `json:"TimeFrom"`
		TimeTo     int  `json:"TimeTo"`
		Data       []struct {
			Time             int64   `json:"time"`
			High             float64 `json:"high"`
			Low              float64 `json:"low"`
			Open             float64 `json:"open"`
			VolumeFrom       float64 `json:"volumefrom"`
			VolumeTo         float64 `json:"volumeto"`
			Close            float64 `json:"close"`
			ConversionType   string  `json:"conversionType"`
			ConversionSymbol string  `json:"conversionSymbol"`
		} `json:"Data"`
	}
}

func (c Currency) String() string {
	return string(c)
}

func HistoricalPrice(coin ChainType, currency Currency, received time.Time) (Price, error) {
	var price Price

	price.Coin = coin.Short()
	price.Currency = currency.String()

	client, err := NewHTTPClient(5 * time.Second)

	if err != nil {
		return price, err
	}

	// because api returns before the timestamp
	nextDay := received.AddDate(0, 0, 1)

	req, err := client.Get(fmt.Sprintf("https://min-api.cryptocompare.com/data/v2/histoday?fsym=%s&tsym=%s&limit=1&toTs=%d", coin.Short(), currency.String(), nextDay.Unix()))

	if err != nil {
		return price, err
	}

	defer req.Body.Close()

	res, err := io.ReadAll(req.Body)

	if err != nil {
		return price, err
	}

	body := bytes.NewReader(res)

	var temp TempPrice

	err = json.NewDecoder(body).Decode(&temp)

	if err != nil {
		return price, err
	}

	for _, v := range temp.Data.Data {
		got := time.Unix(v.Time, 0).Day()

		if got == received.Day() {
			price.Value = v.Close
			price.Time = time.Unix(v.Time, 0)
			break
		}
	}

	if price.Value == 0 {
		return price, fmt.Errorf("no price found for %s on %s", coin.Short(), received.Format("2006-01-02"))
	}

	return price, nil
}

func CurrentPrice(coin ChainType, currency Currency) (Price, error) {

	var price Price
	var m map[string]interface{}

	price.Coin = coin.Short()
	price.Currency = currency.String()
	price.Time = time.Now().UTC()

	client, err := NewHTTPClient(time.Duration(5 * time.Second))

	if err != nil {
		return price, err
	}

	req, err := client.Get(fmt.Sprintf("https://min-api.cryptocompare.com/data/price?fsym=%s&tsyms=%s", coin.Short(), currency))

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
