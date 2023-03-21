package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/xitongsys/parquet-go/writer"
)

type EthereumStreamer struct {
	BaseConfig
	EthClient     *ethclient.Client
	S3Client      *s3.S3
	HttpClient    *http.Client
	ParquetWriter *writer.ParquetWriter
}

func NewEthereumStreamer(config BaseConfig) (*EthereumStreamer, error) {
	s := &EthereumStreamer{
		BaseConfig: config,
	}

	ethClient, err := NewEthereumClient(config.Url)

	if err != nil {
		return nil, err
	}

	s.EthClient = ethClient

	s3Client, err := NewS3Client()

	if err != nil {
		return nil, err
	}

	s.S3Client = s3Client

	httpClient, err := NewHTTPClient()

	if err != nil {
		return nil, err
	}

	s.HttpClient = httpClient
	return s, nil
}

func (e *EthereumStreamer) Stream() error {
	fmt.Println("streaming ethereum blocks...")

	header := make(chan *types.Header)

	sub, err := e.EthClient.SubscribeNewHead(context.Background(), header)

	if err != nil {
		return err
	}

	defer sub.Unsubscribe()

	if err != nil {
		return err
	}

	for {
		select {
		case err := <-sub.Err():
			return err
		case h := <-header:

			fmt.Printf("block: %d", h.Number.Int64())

			var events []Event

			block, err := e.EthClient.BlockByHash(context.Background(), h.Hash())

			if err != nil {
				return err
			}

			blockEvent := NewBlockEvent(block)

			if err != nil {
				return err
			}

			price, err := e.CurrentPrice("USD", Ethereum)

			if err != nil {
				return err
			}

			blockEvent.Price = price.Value

			events = append(events, blockEvent)

			if len(block.Transactions()) > 0 {
				for _, t := range block.Transactions() {
					tx, pending, err := e.EthClient.TransactionByHash(context.Background(), t.Hash())

					if err != nil {
						return err
					}

					if pending {
						fmt.Printf("skipping pending transaction: %s", tx.Hash().String())
						continue
					}

					if err != nil {
						return err
					}

					if tx.To() == nil {
						fmt.Printf("skipping contract transaction: %s", tx.Hash().String())
						continue
					}

					chainID, err := e.EthClient.NetworkID(context.Background())

					if err != nil {
						return err
					}

					txMsg, err := tx.AsMessage(types.NewEIP155Signer(chainID), nil)

					if err != nil {
						return err
					}

					from := txMsg.From()
					to := txMsg.To()

					txEvent := NewTxEvent(block, tx)

					fromBalance, err := e.EthClient.BalanceAt(context.Background(), from, nil)

					if err != nil {
						return err
					}

					toBalance, err := e.EthClient.BalanceAt(context.Background(), *to, nil)

					if err != nil {
						return nil
					}

					txEvent.Sender = from.Hex()
					txEvent.SenderBalance = fromBalance.String()

					txEvent.Recipient = to.Hex()
					txEvent.RecipientBalance = toBalance.String()

					txEvent.Price = price.Value

					events = append(events, txEvent)
				}
			}

			if err != nil {
				return err
			}

			key := fmt.Sprintf("%d.json", blockEvent.Height)

			ev, err := NDJSON(&events)

			if err != nil {
				return err
			}

			err = e.Save(key, []byte(ev))

			if err != nil {
				return err
			}

			fmt.Printf("\t saved %d events \n", len(events))
		}
	}
}

func (e *EthereumStreamer) CurrentPrice(currency string, coin ChainType) (Price, error) {
	if currency == "" {
		currency = "USD"
	}

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

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(req.Body)

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

func (e *EthereumStreamer) Save(dest string, data []byte) error {
	b := "casimir-etl-event-bucket-dev"

	input := &s3.PutObjectInput{
		Body:   bytes.NewReader(data),
		Bucket: aws.String(b),
		Key:    aws.String(dest),
	}

	_, err := e.S3Client.PutObject(input)

	if err != nil {
		return err
	}

	return nil
}

func (e Event) String() string {
	b, err := json.Marshal(e)
	if err != nil {
		return ""
	}
	return string(b)
}
