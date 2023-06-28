package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Currency string

const (
	USD Currency = "USD"
)

// Exchange is an interface for getting current and historical prices
// for a given coin and currency. Supports multiple exchanges.
type Exchange interface {
	// CurrentPrice returns the current price of a coin
	CurrentPrice(coin ChainType, currency Currency) (ExchangePrice, error)
	// GetHistoricalPrice returns the price of a coin at a given time
	HistoricalPrice(coin ChainType, currency Currency, received time.Time) (ExchangePrice, error)
}

type ExchangePrice struct {
	Value    float64   `json:"price,omitempty"`
	Currency string    `json:"currency,omitempty"`
	Coin     string    `json:"coin,omitempty"`
	Time     time.Time `json:"time,omitempty"`
}

type CryptoCompareExchange struct {
	BaseUrl string
	ApiKey  string
	Version int
}

type CryptoCompareTickerResponse struct {
	Data struct {
		ETHUSD struct {
			Type                          string  `json:"TYPE"`
			Market                        string  `json:"MARKET"`
			Instrument                    string  `json:"INSTRUMENT"`
			Ccseq                         int     `json:"CCSEQ"`
			Value                         float64 `json:"VALUE"`
			ValueFlag                     string  `json:"VALUE_FLAG"`
			ValueLastUpdateTs             int     `json:"VALUE_LAST_UPDATE_TS"`
			ValueLastUpdateNs             int     `json:"VALUE_LAST_UPDATE_NS"`
			LastUpdateQuantity            float64 `json:"LAST_UPDATE_QUANTITY"`
			LastUpdateQuoteQuantity       float64 `json:"LAST_UPDATE_QUOTE_QUANTITY"`
			LastUpdateCcseq               int     `json:"LAST_UPDATE_CCSEQ"`
			CurrentHourVolume             float64 `json:"CURRENT_HOUR_VOLUME"`
			CurrentHourQuoteVolume        float64 `json:"CURRENT_HOUR_QUOTE_VOLUME"`
			CurrentHourOpen               float64 `json:"CURRENT_HOUR_OPEN"`
			CurrentHourHigh               float64 `json:"CURRENT_HOUR_HIGH"`
			CurrentHourLow                float64 `json:"CURRENT_HOUR_LOW"`
			CurrentHourTotalIndexUpdates  int     `json:"CURRENT_HOUR_TOTAL_INDEX_UPDATES"`
			CurrentHourChange             float64 `json:"CURRENT_HOUR_CHANGE"`
			CurrentHourChangePercentage   float64 `json:"CURRENT_HOUR_CHANGE_PERCENTAGE"`
			CurrentDayVolume              float64 `json:"CURRENT_DAY_VOLUME"`
			CurrentDayQuoteVolume         float64 `json:"CURRENT_DAY_QUOTE_VOLUME"`
			CurrentDayOpen                float64 `json:"CURRENT_DAY_OPEN"`
			CurrentDayHigh                float64 `json:"CURRENT_DAY_HIGH"`
			CurrentDayLow                 float64 `json:"CURRENT_DAY_LOW"`
			CurrentDayTotalIndexUpdates   int     `json:"CURRENT_DAY_TOTAL_INDEX_UPDATES"`
			CurrentDayChange              float64 `json:"CURRENT_DAY_CHANGE"`
			CurrentDayChangePercentage    float64 `json:"CURRENT_DAY_CHANGE_PERCENTAGE"`
			CurrentWeekVolume             float64 `json:"CURRENT_WEEK_VOLUME"`
			CurrentWeekQuoteVolume        float64 `json:"CURRENT_WEEK_QUOTE_VOLUME"`
			CurrentWeekOpen               float64 `json:"CURRENT_WEEK_OPEN"`
			CurrentWeekHigh               float64 `json:"CURRENT_WEEK_HIGH"`
			CurrentWeekLow                float64 `json:"CURRENT_WEEK_LOW"`
			CurrentWeekTotalIndexUpdates  int     `json:"CURRENT_WEEK_TOTAL_INDEX_UPDATES"`
			CurrentWeekChange             float64 `json:"CURRENT_WEEK_CHANGE"`
			CurrentWeekChangePercentage   float64 `json:"CURRENT_WEEK_CHANGE_PERCENTAGE"`
			CurrentMonthVolume            float64 `json:"CURRENT_MONTH_VOLUME"`
			CurrentMonthQuoteVolume       float64 `json:"CURRENT_MONTH_QUOTE_VOLUME"`
			CurrentMonthOpen              float64 `json:"CURRENT_MONTH_OPEN"`
			CurrentMonthHigh              float64 `json:"CURRENT_MONTH_HIGH"`
			CurrentMonthLow               float64 `json:"CURRENT_MONTH_LOW"`
			CurrentMonthTotalIndexUpdates int     `json:"CURRENT_MONTH_TOTAL_INDEX_UPDATES"`
			CurrentMonthChange            float64 `json:"CURRENT_MONTH_CHANGE"`
			CurrentMonthChangePercentage  float64 `json:"CURRENT_MONTH_CHANGE_PERCENTAGE"`
			CurrentYearVolume             float64 `json:"CURRENT_YEAR_VOLUME"`
			CurrentYearQuoteVolume        float64 `json:"CURRENT_YEAR_QUOTE_VOLUME"`
			CurrentYearOpen               float64 `json:"CURRENT_YEAR_OPEN"`
			CurrentYearHigh               float64 `json:"CURRENT_YEAR_HIGH"`
			CurrentYearLow                float64 `json:"CURRENT_YEAR_LOW"`
			CurrentYearTotalIndexUpdates  int     `json:"CURRENT_YEAR_TOTAL_INDEX_UPDATES"`
			CurrentYearChange             float64 `json:"CURRENT_YEAR_CHANGE"`
			CurrentYearChangePercentage   float64 `json:"CURRENT_YEAR_CHANGE_PERCENTAGE"`
			Moving24HourVolume            float64 `json:"MOVING_24_HOUR_VOLUME"`
			Moving24HourQuoteVolume       float64 `json:"MOVING_24_HOUR_QUOTE_VOLUME"`
			Moving24HourOpen              float64 `json:"MOVING_24_HOUR_OPEN"`
			Moving24HourHigh              float64 `json:"MOVING_24_HOUR_HIGH"`
			Moving24HourLow               float64 `json:"MOVING_24_HOUR_LOW"`
			Moving24HourTotalIndexUpdates int     `json:"MOVING_24_HOUR_TOTAL_INDEX_UPDATES"`
			Moving24HourChange            float64 `json:"MOVING_24_HOUR_CHANGE"`
			Moving24HourChangePercentage  float64 `json:"MOVING_24_HOUR_CHANGE_PERCENTAGE"`
			Moving7DayVolume              float64 `json:"MOVING_7_DAY_VOLUME"`
			Moving7DayQuoteVolume         float64 `json:"MOVING_7_DAY_QUOTE_VOLUME"`
			Moving7DayOpen                float64 `json:"MOVING_7_DAY_OPEN"`
			Moving7DayHigh                float64 `json:"MOVING_7_DAY_HIGH"`
			Moving7DayLow                 float64 `json:"MOVING_7_DAY_LOW"`
			Moving7DayTotalIndexUpdates   int     `json:"MOVING_7_DAY_TOTAL_INDEX_UPDATES"`
			Moving7DayChange              float64 `json:"MOVING_7_DAY_CHANGE"`
			Moving7DayChangePercentage    float64 `json:"MOVING_7_DAY_CHANGE_PERCENTAGE"`
			Moving30DayVolume             float64 `json:"MOVING_30_DAY_VOLUME"`
			Moving30DayQuoteVolume        float64 `json:"MOVING_30_DAY_QUOTE_VOLUME"`
			Moving30DayOpen               float64 `json:"MOVING_30_DAY_OPEN"`
			Moving30DayHigh               float64 `json:"MOVING_30_DAY_HIGH"`
			Moving30DayLow                float64 `json:"MOVING_30_DAY_LOW"`
			Moving30DayTotalIndexUpdates  int     `json:"MOVING_30_DAY_TOTAL_INDEX_UPDATES"`
			Moving30DayChange             float64 `json:"MOVING_30_DAY_CHANGE"`
			Moving30DayChangePercentage   float64 `json:"MOVING_30_DAY_CHANGE_PERCENTAGE"`
			Moving90DayVolume             float64 `json:"MOVING_90_DAY_VOLUME"`
			Moving90DayQuoteVolume        float64 `json:"MOVING_90_DAY_QUOTE_VOLUME"`
			Moving90DayOpen               float64 `json:"MOVING_90_DAY_OPEN"`
			Moving90DayHigh               float64 `json:"MOVING_90_DAY_HIGH"`
			Moving90DayLow                float64 `json:"MOVING_90_DAY_LOW"`
			Moving90DayTotalIndexUpdates  int     `json:"MOVING_90_DAY_TOTAL_INDEX_UPDATES"`
			Moving90DayChange             float64 `json:"MOVING_90_DAY_CHANGE"`
			Moving90DayChangePercentage   float64 `json:"MOVING_90_DAY_CHANGE_PERCENTAGE"`
			Moving180DayVolume            float64 `json:"MOVING_180_DAY_VOLUME"`
			Moving180DayQuoteVolume       float64 `json:"MOVING_180_DAY_QUOTE_VOLUME"`
			Moving180DayOpen              float64 `json:"MOVING_180_DAY_OPEN"`
			Moving180DayHigh              float64 `json:"MOVING_180_DAY_HIGH"`
			Moving180DayLow               float64 `json:"MOVING_180_DAY_LOW"`
			Moving180DayTotalIndexUpdates int     `json:"MOVING_180_DAY_TOTAL_INDEX_UPDATES"`
			Moving180DayChange            float64 `json:"MOVING_180_DAY_CHANGE"`
			Moving180DayChangePercentage  float64 `json:"MOVING_180_DAY_CHANGE_PERCENTAGE"`
			Moving365DayVolume            float64 `json:"MOVING_365_DAY_VOLUME"`
			Moving365DayQuoteVolume       float64 `json:"MOVING_365_DAY_QUOTE_VOLUME"`
			Moving365DayOpen              float64 `json:"MOVING_365_DAY_OPEN"`
			Moving365DayHigh              float64 `json:"MOVING_365_DAY_HIGH"`
			Moving365DayLow               float64 `json:"MOVING_365_DAY_LOW"`
			Moving365DayTotalIndexUpdates int     `json:"MOVING_365_DAY_TOTAL_INDEX_UPDATES"`
			Moving365DayChange            float64 `json:"MOVING_365_DAY_CHANGE"`
			Moving365DayChangePercentage  float64 `json:"MOVING_365_DAY_CHANGE_PERCENTAGE"`
			LifetimeFirstUpdateTs         int     `json:"LIFETIME_FIRST_UPDATE_TS"`
			LifetimeVolume                float64 `json:"LIFETIME_VOLUME"`
			LifetimeQuoteVolume           float64 `json:"LIFETIME_QUOTE_VOLUME"`
			LifetimeOpen                  float64 `json:"LIFETIME_OPEN"`
			LifetimeHigh                  float64 `json:"LIFETIME_HIGH"`
			LifetimeHighTs                int     `json:"LIFETIME_HIGH_TS"`
			LifetimeLow                   float64 `json:"LIFETIME_LOW"`
			LifetimeLowTs                 int     `json:"LIFETIME_LOW_TS"`
			LifetimeTotalIndexUpdates     int     `json:"LIFETIME_TOTAL_INDEX_UPDATES"`
			LifetimeChange                float64 `json:"LIFETIME_CHANGE"`
			LifetimeChangePercentage      float64 `json:"LIFETIME_CHANGE_PERCENTAGE"`
		} `json:"ETH-USD"`
	} `json:"Data"`
	Err struct {
	} `json:"Err"`
}

func NewHttpClientWithTimeout(time time.Duration) (*http.Client, error) {
	client := &http.Client{
		Timeout: time,
	}
	return client, nil
}

func NewCryptoCompareExchange(apiKey string) (Exchange, error) {
	if apiKey == "" {
		return nil, errors.New("api key is required")
	}
	return CryptoCompareExchange{
		ApiKey:  apiKey,
		BaseUrl: "https://data-api.cryptocompare.com", // v2 api
	}, nil
}

func (c CryptoCompareExchange) CurrentPrice(coin ChainType, currency Currency) (ExchangePrice, error) {
	price := ExchangePrice{
		Coin:     coin.Short(),
		Currency: currency.String(),
		Time:     time.Now(),
	}

	httpClient, err := NewHttpClientWithTimeout(time.Duration(2 * time.Second))

	if err != nil {
		return price, err
	}

	path := "index/cc/v1/latest/tick"

	url := fmt.Sprintf("%s/%s?market=ccix&instruments=%s-%s", c.BaseUrl, path, coin.Short(), currency.String())

	req, err := httpClient.Get(url)

	if err != nil {
		return price, err
	}

	defer req.Body.Close()

	res, err := io.ReadAll(req.Body)

	if err != nil {
		return price, err
	}

	var response CryptoCompareTickerResponse

	err = json.Unmarshal(res, &response)

	if err != nil {
		return price, err
	}

	price.Value = response.Data.ETHUSD.CurrentDayOpen
	return price, nil
}

func (c CryptoCompareExchange) HistoricalPrice(coin ChainType, currency Currency, received time.Time) (ExchangePrice, error) {
	price := ExchangePrice{
		Coin:     coin.Short(),
		Currency: currency.String(),
		Time:     received,
	}

	httpClient, err := NewHttpClientWithTimeout(time.Duration(2 * time.Second))

	if err != nil {
		return price, err
	}

	path := "index/cc/v1/historical/minutes"

	// to_ts (timestamp) returns historical data before this unix timestamp
	// use limit=2000 and keep going back in time using the to_ts param.
	url := fmt.Sprintf("%s/%s?market=ccix&instruments=%s-%s&limit=20&to_ts=%d", c.BaseUrl, path, coin.Short(), currency.String(), received.Unix())

	req, err := httpClient.Get(url)

	if err != nil {
		return price, err
	}

	defer req.Body.Close()

	res, err := io.ReadAll(req.Body)

	if err != nil {
		return price, err
	}

	var response CryptoCompareTickerResponse

	err = json.Unmarshal(res, &response)

	if err != nil {
		return price, err
	}

	price.Value = response.Data.ETHUSD.CurrentDayOpen
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

func (c Currency) String() string {
	return string(c)
}
