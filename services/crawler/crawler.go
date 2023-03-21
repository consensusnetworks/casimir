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
	Head          int64
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

		block, err := crawler.EthClient.HeaderByNumber(context.Background(), nil)

		if err != nil {
			return nil, err
		}

		crawler.Head = block.Number.Int64()

		return &crawler, nil
	}
	return nil, errors.New("unsupported chain")
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

func sliceRangeChan(start, end, part int64) <-chan []int64 {
	out := make(chan []int64)
	go func() {
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
			out <- arr
		}
		close(out)
	}()
	return out
}

func multiplex(chans ...<-chan []Event) <-chan []Event {
	var wg sync.WaitGroup

	out := make(chan []Event)

	// merges the inbound channels onto a single outbound channel
	output := func(c <-chan []Event) {
		for n := range c {
			out <- n
		}
		wg.Done()
	}

	wg.Add(len(chans))

	for _, c := range chans {
		go output(c)
	}

	go func() {
		wg.Wait()
		close(out)
	}()
	return out
}

type BlockError struct {
	Block int64
	Err   error
}

func (e *EthereumCrawler) Fetch(wg *sync.WaitGroup, interval []int64) []BlockError {
	wg.Add(1)
	var crawlErrors []BlockError
	go func() {
		defer wg.Done()

		start := interval[0]
		end := interval[1]

		fmt.Printf("crawling range: %d - %d\n", start, end)
		for i := start; i <= end; i++ {
			// gensis block
			if i == 0 {
				block, err := e.EthClient.BlockByNumber(context.Background(), big.NewInt(i))

				if err != nil {
					crawlErrors = append(crawlErrors, BlockError{
						Block: i,
						Err:   err,
					})
				}

				blockEvent := NewBlockEvent(block)

				blockEvent.Height = 0

				// e.TotalBlocks++

				err = e.Save([]Event{blockEvent})

				if err != nil {
					crawlErrors = append(crawlErrors, BlockError{
						Block: i,
						Err:   err,
					})
				}
				continue
			}

			var event []Event

			block, err := e.EthClient.BlockByNumber(context.Background(), big.NewInt(i))

			if err != nil {
				crawlErrors = append(crawlErrors, BlockError{
					Block: i,
					Err:   err,
				})
			}

			blockEvent := NewBlockEvent(block)

			event = append(event, blockEvent)

			if block != nil && len(block.Transactions()) > 0 {
				for k, tx := range block.Transactions() {
					txEvent := NewTxEvent(block, tx)

					if tx.To() != nil {
						recipientBalance, err := e.EthClient.BalanceAt(context.Background(), *tx.To(), nil)

						if err != nil {
							crawlErrors = append(crawlErrors, BlockError{
								Block: i,
								Err:   err,
							})
						}

						txEvent.Recipient = tx.To().Hex()
						txEvent.RecipientBalance = recipientBalance.String()

						senderAddr, err := e.EthClient.TransactionSender(context.Background(), tx, block.Hash(), uint(k))

						if err != nil {
							crawlErrors = append(crawlErrors, BlockError{
								Block: i,
								Err:   err,
							})
						}

						senderBalance, err := e.EthClient.BalanceAt(context.Background(), senderAddr, block.Number())

						if err != nil {
							crawlErrors = append(crawlErrors, BlockError{
								Block: i,
								Err:   err,
							})
						}

						txEvent.Sender = senderAddr.Hex()
						txEvent.SenderBalance = senderBalance.String()
					}

					event = append(event, txEvent)
				}
			}

			err = e.Save(event)

			if err != nil {
				crawlErrors = append(crawlErrors, BlockError{
					Block: i,
					Err:   err,
				})
			}
			fmt.Printf("saved block: %d\n", i)
			e.TotalBlocks++
		}
	}()

	wg.Add(1)
	go func() {
		if len(crawlErrors) > 0 {
			fmt.Printf("got %v errors\n", len(crawlErrors))

			for _, err := range crawlErrors {
				fmt.Printf("block: %d, error: %s\n", err.Block, err.Err.Error())
			}
		}

		defer wg.Done()
	}()

	return crawlErrors
}

func (e *EthereumCrawler) Save(event []Event) error {
	ndjson, err := NDJSON(&event)

	if err != nil {
		return err
	}

	file := fmt.Sprintf("%s/%s/%d.ndjson", e.Chain, e.Network, event[0].Height)

	data := []byte(ndjson)

	err = e.SaveToS3(&file, &data)

	if err != nil {
		return err
	}

	return nil
}

func (e *EthereumCrawler) Crawl() error {
	var wg sync.WaitGroup

	defer wg.Wait()

	begin := time.Now()

	// fixedHead := int64(1000)

	intervals := sliceRangeChan(14000000, 14000000+100, 20)

	for i := range intervals {
		err := e.Fetch(&wg, i)

		if err != nil {
			panic(err)
		}
	}

	defer func() {
		wg.Wait()
		e.Elapsed = time.Since(begin)
		fmt.Println("total blocks crawled: ", e.TotalBlocks)
		fmt.Println("elapsed: ", e.Elapsed)
	}()

	return nil
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
