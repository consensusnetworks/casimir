package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/xitongsys/parquet-go/parquet"
	"github.com/xitongsys/parquet-go/writer"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/ethclient"
	_ "github.com/segmentio/go-athena"
)

type EthereumCrawler struct {
	BaseConfig
	EthClient     *ethclient.Client
	S3Client      *s3.S3
	Elapsed       time.Duration
	TotalBlocks   int64
	ParquetWriter *writer.ParquetWriter
	HttpClient    *http.Client
}

type ChainErr struct {
	Block int64 `json:"block"`
	Error error `json:"error"`
}

func NewEthereumCrawler(config BaseConfig) (*EthereumCrawler, error) {
	if config.Chain == Ethereum {
		ethClient, err := NewEthereumClient(config.Url)

		if err != nil {
			panic(err)
		}

		if err != nil {
			return nil, err
		}

		s3Client, err := NewS3Client()

		if err != nil {
			return nil, err
		}

		crawler := EthereumCrawler{
			BaseConfig: config,
			EthClient:  ethClient,
			S3Client:   s3Client,
		}

		http, err := NewHTTPClient()

		if err != nil {
			return nil, err
		}

		crawler.HttpClient = http

		schema := []*parquet.SchemaElement{
			{
				Name: "chain",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "network",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "provider",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "type",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "height",
				Type: parquet.TypePtr(parquet.Type_INT64),
			},
			{
				Name: "block",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "transaction",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "created_at",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "address",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "to_address",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "amount",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "address_balance",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "to_address_balance",
				Type: parquet.TypePtr(parquet.Type_BYTE_ARRAY),
			},
			{
				Name: "price",
				Type: parquet.TypePtr(parquet.Type_DOUBLE),
			},
		}

		pw, err := NewParquetWriter(schema)

		if err != nil {
			return nil, err
		}

		crawler.ParquetWriter = pw

		block, err := crawler.EthClient.HeaderByNumber(context.Background(), nil)

		if err != nil {
			return nil, err
		}

		crawler.Head = block.Number.Int64()

		return &crawler, nil
	}
	return nil, errors.New("unsupported chain")
}

func (e *EthereumCrawler) Crawl() error {
	e.Print("process id: %d \n", os.Getpid())
	s3Files, err := e.ListS3Files()

	if err != nil {
		return err
	}

	intervals := sliceRange(14000000, 14000000+1000, 100)

	if len(s3Files) > 0 {
		fmt.Println("some files already exists in s3")
	}

	var wg sync.WaitGroup

	var errs []ChainErr
	errChan := make(chan ChainErr)

	e.Print("crawling ethereum blocks...\n")

	begin := time.Now()

	for _, v := range intervals {
		wg.Add(1)
		go e.Fetch(&wg, errChan, v)
	}

	go func(ch chan ChainErr) {
		for {
			select {
			case err := <-ch:
				fmt.Printf("error: block %d, %v \n", err.Block, err.Error.Error())
				errs = append(errs, ChainErr{
					Block: err.Block,
					Error: err.Error,
				})
				return
			}
		}
	}(errChan)

	defer func() {
		if len(errs) > 0 {
			errorsByte, err := json.Marshal(errs)

			errorsByte = append(errorsByte, []byte(" \n")...)

			if err != nil {
				panic(err)
			}

			err = SaveErrorLog(errorsByte)

			if err != nil {
				panic(err)
			}
			e.Print("errors logged to %s.log \n", "crawler")
		}
		elapsed := time.Since(begin)
		e.Elapsed = elapsed
		e.Print("elapsed time: %v \n", elapsed)
	}()
	wg.Wait()
	return nil
}

func (e *EthereumCrawler) Fetch(wg *sync.WaitGroup, errChan chan ChainErr, blockRange []int64) {
	e.Print("new thread crawling blocks: %d - %d\n", blockRange[0], blockRange[1])

	defer wg.Done()

	bachSize := 500
	start := blockRange[0]
	end := blockRange[1]

	var events []Event

	for i := start; i <= end; i++ {
		//fmt.Printf("crawling block: %d\n", i)
		block, err := e.EthClient.BlockByNumber(context.Background(), big.NewInt(i))

		if err != nil {
			errChan <- ChainErr{
				Block: i,
				Error: err,
			}
		}

		blockEvent, err := NewBlockEvent(block)

		if err != nil {
			errChan <- ChainErr{
				Block: i,
				Error: err,
			}
		}

		//price, err := e.CurrentPrice("USD", Ethereum)

		//if err != nil {
		//	errChan <- ChainErr{
		//		Block: i,
		//		Error: err,
		//	}
		//}
		//
		//blockEvent.Price = price.Value

		events = append(events, blockEvent)

		if len(block.Transactions()) > 0 {
			for k, tx := range block.Transactions() {
				_, err := e.EthClient.TransactionReceipt(context.Background(), tx.Hash())

				if err != nil {
					fmt.Println("cant get tx receipt")
					errChan <- ChainErr{
						Block: i,
						Error: err,
					}
				}

				txEvent := NewTxEvent(block, tx)

				if err != nil {
					fmt.Println("cant get tx event")
					errChan <- ChainErr{
						Block: i,
						Error: err,
					}
				}

				//txEvent.Price = price.Value

				if tx.To() != nil {
					balance, err := e.EthClient.BalanceAt(context.Background(), *tx.To(), nil)

					if err != nil {
						fmt.Println("cant get balance for to address")
						errChan <- ChainErr{
							Block: i,
							Error: err,
						}
					}
					txEvent.Recipient = tx.To().Hex()
					txEvent.RecipientBalance = balance.Int64()

					//txIndex := k - len(block.Transactions())
					sender, err := e.EthClient.TransactionSender(context.Background(), tx, block.Hash(), uint(k))

					if err != nil {
						fmt.Println("cant get sender")
						errChan <- ChainErr{
							Block: i,
							Error: err,
						}
					}

					balance, err = e.EthClient.BalanceAt(context.Background(), sender, block.Number())

					if err != nil {
						fmt.Println("cant get balance for sender")
						errChan <- ChainErr{
							Block: i,
							Error: err,
						}
					}
					txEvent.Sender = sender.Hex()
					txEvent.SenderBalance = balance.Int64()
				}
				events = append(events, txEvent)
			}
		}
		//if i%int64(bachSize) == 0 {
		if i%int64(bachSize) == 0 && i != start {
			eventsND, err := NDJSON(&events)

			if err != nil {
				panic(err)
			}

			key := fmt.Sprintf("%d-%d.ndjson", blockRange[0], i)

			data := []byte(eventsND)

			err = e.SaveToS3(&key, &data)

			if err != nil {
				errChan <- ChainErr{
					Block: i,
					Error: err,
				}
			}

			e.Print("saved %s \n", key)
		}
	}

	if len(events) > 0 {
		eventsND, err := NDJSON(&events)

		if err != nil {
			panic(err)
		}

		key := fmt.Sprintf("%d-%d.ndjson", blockRange[0], blockRange[len(blockRange)-1])
		data := []byte(eventsND)

		err = e.SaveToS3(&key, &data)

		if err != nil {
			panic(err)
		}
		e.Print("saved %s \n", key)
	}
}

func sliceRange(start, end, part int64) [][]int64 {
	var result [][]int64
	step := (end - start) / part
	for i := int64(0); i < part; i++ {
		var arr []int64
		if i == 0 {
			arr = append(arr, start)
			arr = append(arr, start+step)
		} else if i == part-1 {
			arr = append(arr, start+i*step+1)
			arr = append(arr, end)
		} else {
			arr = append(arr, start+i*step+1)
			arr = append(arr, start+(i+1)*step)
		}
		result = append(result, arr)
	}
	return result
}

func (e *EthereumCrawler) CurrentPrice(currency string, coin ChainType) (Price, error) {
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

func (e *EthereumCrawler) Print(s string, args ...interface{}) {
	if e.Verbose {
		fmt.Printf(s, args...)
	}
}

func SaveErrorLog(data []byte) error {
	file := fmt.Sprintf("%s.log", "crawler")

	f, err := os.OpenFile(file, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	if err != nil {
		return err
	}

	defer f.Close()

	if _, err := f.Write(data); err != nil {
		return err
	}

	return nil
}

func (e *EthereumCrawler) SaveToS3(key *string, data *[]byte) error {
	if len(*data) == 0 {
		return fmt.Errorf("data cannot be empty")
	}

	bucket := os.Getenv("EVENT_BUCKET")

	_, err := e.S3Client.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    key,
		Body:   bytes.NewReader(*data),
	})

	if err != nil {
		return err
	}
	return nil
}

func (e *EthereumCrawler) SaveToLocal(key *string, data *[]byte) error {
	if len(*data) == 0 {
		return fmt.Errorf("data cannot be empty")
	}

	err := os.MkdirAll("./data", 0755)

	if err != nil {
		return err
	}

	err = os.WriteFile(*key, *data, 0644)

	if err != nil {
		return err
	}

	return nil
}

func (e *EthereumCrawler) ListS3Files() ([]string, error) {
	bucket := os.Getenv("EVENT_BUCKET")

	if bucket == "" {
		return nil, errors.New("bucket name not set")
	}

	prefix := ""

	input := &s3.ListObjectsInput{
		Bucket: &bucket,
		Prefix: &prefix,
	}

	result, err := e.S3Client.ListObjects(input)

	if err != nil {
		return nil, err
	}

	var files []string

	for _, object := range result.Contents {
		files = append(files, *object.Key)

	}
	return files, nil
}
