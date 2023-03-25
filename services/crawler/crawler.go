package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/athena"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/ethclient"
	_ "github.com/segmentio/go-athena"
)

type EthereumCrawler struct {
	BaseConfig
	EthClient   *ethclient.Client
	S3Client    *s3.S3
	Elapsed     time.Duration
	TotalBlocks int64
	TotalEvents int64
	HttpClient  *http.Client
	Head        int64
	Provider    ProviderType
}

type BlockError struct {
	Block int64
	Err   error
}

func PString(s string) *string {
	return &s
}

func NewS3Client() (*s3.S3, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      PString(os.Getenv("AWS_REGION")),
		Credentials: credentials.NewEnvCredentials(),
	},
	)
	if err != nil {
		return nil, err
	}
	return s3.New(sess), nil
}

func NewAthenaClient() (*athena.Athena, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      PString(os.Getenv("AWS_REGION")),
		Credentials: credentials.NewEnvCredentials(),
	},
	)
	if err != nil {
		return nil, err
	}

	return athena.New(sess), nil
}

func NewHTTPClient(time time.Duration) (*http.Client, error) {
	client := &http.Client{
		Timeout: time,
	}
	return client, nil
}

func NewEthereumClient(url string) (*ethclient.Client, error) {
	client, err := ethclient.Dial(url)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func NewEthereumCrawler(config *BaseConfig) (*EthereumCrawler, error) {
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
			BaseConfig: *config,
			EthClient:  ethClient,
			S3Client:   s3Client,
		}

		http, err := NewHTTPClient(5 * time.Second)

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

func BatchIntervals(start, end, part int64) [][]int64 {
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

func (e *EthereumCrawler) Crawl() error {
	var wg sync.WaitGroup

	defer wg.Wait()

	begin := time.Now()

	fixedStart := int64(14000000)
	fixedHead := fixedStart + 1000000

	// also num of goroutines
	parts := 20

	intervals := BatchIntervals(14000000, fixedHead, int64(parts))

	previousRun, err := e.ListS3Files()

	if err != nil {
		return err
	}

	if len(previousRun) > 0 {
		e.Printf("detected previous run\n")

		for _, v := range previousRun {
			// format: start-end.ndjson
			key := strings.Split(v, ".ndjson")[1]

			if key == "" {
				panic(err)
			}

			ranges := strings.Split(key, "-")

			if len(ranges) != 2 {
				panic(err)
			}

			start, err := strconv.ParseInt(ranges[0], 10, 64)

			if err != nil {
				panic(err)
			}

			end, err := strconv.ParseInt(ranges[1], 10, 64)

			if err != nil {
				panic(err)
			}

			for i, v := range intervals {
				if v[0] == start && v[1] == end {
					e.Printf("skipping interval: %d - %d\n", v[0], v[1])
					intervals = append(intervals[:i], intervals[i+1:]...)
				}
			}
		}
	}

	for _, v := range intervals {
		err := e.Fetch(&wg, v)

		for _, v := range err {
			// TODO: handle error
			fmt.Println(v.Block, v.Err)
		}
	}

	defer func() {
		wg.Wait()
		e.Elapsed = time.Since(begin)
		fmt.Println("total blocks: ", e.TotalBlocks)
		fmt.Println("total events: ", e.TotalEvents)
		fmt.Println("elapsed: ", e.Elapsed)
	}()

	return nil
}

func (e *EthereumCrawler) Fetch(wg *sync.WaitGroup, interval []int64) []BlockError {
	wg.Add(1)
	var crawlErrors []BlockError
	go func() {
		defer wg.Done()

		start := interval[0]
		end := interval[1]

		var batchSize int64 = 10

		var events []Event

		fmt.Printf("crawling: %d - %d\n", start, end)
		for i := start; i <= end; i++ {
			e.Printf("block: %d\n", i)

			block, err := e.EthClient.BlockByNumber(context.Background(), big.NewInt(i))

			if err != nil {
				crawlErrors = append(crawlErrors, BlockError{
					Block: i,
					Err:   err,
				})
				panic(err)
			}

			blockEvent, err := e.NewBlockEvent(block)

			if err != nil {
				crawlErrors = append(crawlErrors, BlockError{
					Block: i,
					Err:   err,
				})
			}

			// genesis
			if i == 0 {
				blockEvent.Height = 0
			}

			events = append(events, blockEvent)

			if block != nil && len(block.Transactions()) > 0 {
				for k, tx := range block.Transactions() {

					txEvent, err := e.NewTxEvent(block, tx)

					if err != nil {
						crawlErrors = append(crawlErrors, BlockError{
							Block: i,
							Err:   err,
						})
					}

					// non-contract tx
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

					events = append(events, txEvent)
				}
			}

			if i%batchSize == 0 && i != start {
				batchStart := events[0].Height
				batchEnd := events[len(events)-1].Height

				file := fmt.Sprintf("%s/%s/%d-%d.ndjson", e.Chain, e.Network, batchStart, batchEnd)

				err = e.Save(&file, &events)

				if err != nil {
					crawlErrors = append(crawlErrors, BlockError{
						Block: 0,
						Err:   err,
					})
				}

				e.TotalBlocks += batchSize
				e.TotalEvents += int64(len(events))
				e.Printf("saved: %d - %d\n", batchStart, batchEnd)
				events = []Event{}
			}
		}

		if len(events) > 0 {
			batchStart := events[0].Height
			batchEnd := events[len(events)-1].Height

			file := fmt.Sprintf("%s/%s/%d-%d.ndjson", e.Chain, e.Network, batchStart, batchEnd)

			err := e.Save(&file, &events)

			if err != nil {
				crawlErrors = append(crawlErrors, BlockError{
					Block: 0,
					Err:   err,
				})
			}

			for _, event := range events {
				if event.Type == "block" {
					e.TotalBlocks++
				}
			}

			e.TotalEvents += int64(len(events))

			e.Printf("saved: %d - %d\n", batchStart, batchEnd)

			events = make([]Event, 0, batchSize)
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

func (e *EthereumCrawler) Save(key *string, data *[]Event) error {
	if len(*data) == 0 {
		return fmt.Errorf("data cannot be empty")
	}

	bucket := os.Getenv("EVENT_BUCKET")

	ndjson, err := NDJSON(data)

	if err != nil {
		return err
	}

	_, err = e.S3Client.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    key,
		Body:   bytes.NewReader([]byte(ndjson)),
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

	prefix := fmt.Sprintf("%s/%s/", e.Chain, e.Network)

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

func (e *EthereumCrawler) Printf(s string, args ...interface{}) {
	if e.Verbose {
		fmt.Printf(s, args...)
	}
}
