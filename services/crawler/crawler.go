package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	concurrencyLimit = 200
)

type Pkg struct {
	Version string `json:"version"`
}

type Table struct {
	Name    string
	Version string
	Bucket  string
}

type Crawler interface {
	Crawl() error
}

type EtheruemCrawler struct {
	EtheruemClient
	Logger
	Mutex          *sync.Mutex
	Begin          time.Time
	Elapsed        time.Duration
	Glue           *GlueClient
	S3             *S3Client
	Sema           chan struct{}
	Head           uint64
	EventsConsumed int
	Version        int
}

func NewCrawler() (*EtheruemCrawler, error) {
	err := LoadEnv()

	if err != nil {
		return nil, err
	}

	raw := os.Getenv("ETHEREUM_RPC")

	if raw == "" {
		return nil, errors.New("ETHERUEM_RPC env variable is not set")
	}

	url, err := url.Parse(raw)

	if err != nil {
		return nil, err
	}

	client, err := NewEthereumClient(Casimir, *url)

	if err != nil {
		return nil, err
	}

	head, err := client.Client.BlockNumber(context.Background())

	if err != nil {
		return nil, err
	}

	config, err := LoadDefaultAWSConfig()

	if err != nil {
		return nil, err
	}

	glue, err := NewGlueClient(config)

	if err != nil {
		return nil, err
	}

	s3c, err := NewS3Client()

	if err != nil {
		return nil, err
	}

	return &EtheruemCrawler{
		EtheruemClient: *client,
		Logger:         NewStdoutLogger(),
		Mutex:          &sync.Mutex{},
		Sema:           make(chan struct{}, concurrencyLimit),
		Glue:           glue,
		S3:             s3c,
		Head:           head,
		Begin:          time.Now(),
	}, nil
}

func (c *EtheruemCrawler) Crawl() error {
	l := c.Logger
	_, err := c.Introspect()

	if err != nil {
		return nil
	}

	diff := c.Head - 0 + 1

	l.Info("crawling %d blocks...\n", diff)

	wg := sync.WaitGroup{}

	step := uint64(1000)

	for i := uint64(0); i < c.Head; i += step {
		c.Sema <- struct{}{}
		wg.Add(1)

		start := i
		end := i + 100 - 1

		if end > c.Head {
			end = c.Head
		}

		go func(start, end uint64) {
			defer func() {
				<-c.Sema
				wg.Done()
			}()
			l.Info("batch=%d start=%d end=%d\n", i/step, start, end)

			for j := start; j <= end; j++ {
				l.Info("block=%d\n", j)
			}
		}(start, end)
	}

	wg.Wait()
	c.Elapsed = time.Since(c.Begin)
	return nil
}

func (c *EtheruemCrawler) ProcessBlock(height int) error {
	l := c.Logger

	// get block
	block, err := c.Client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		return err
	}

	l.Info("processing block=%d\n", block.Number().Uint64())

	// get transactions
	// get receipts
	// get l

	return nil
}

func (c *EtheruemCrawler) Introspect() ([]Table, error) {
	l := c.Logger

	l.Info("introspecting...\n")

	err := c.Glue.LoadDatabases()

	if err != nil {
		return nil, err
	}

	err = c.Glue.LoadTables(AnalyticsDatabaseDev)

	if err != nil {
		return nil, err
	}

	var tables []Table

	for _, t := range c.Glue.Tables {
		var table Table

		table.Name = *t.Name
		tableVersion, err := strconv.Atoi(string([]rune(*t.Name)[len(*t.Name)-1]))

		if err != nil {
			return nil, err
		}

		table.Version = strconv.Itoa(tableVersion)

		resourceVersion, err := ResourceVersion()

		if err != nil {
			return nil, err
		}

		// we expect table version to match resource version otherwise the resoure is not ready yet wait
		if tableVersion != resourceVersion {
			l.Error(fmt.Sprintf("database=%s %s table=%s resourceVersion=%s \n", AnalyticsDatabaseDev, table.String(), *t.Name, strconv.Itoa(resourceVersion)))
			return nil, errors.New("resource version does not match table version")
		}

		table.Version = strconv.Itoa(tableVersion)
		tables = append(tables, table)

		bucket := *t.StorageDescriptor.Location

		if bucket == "" {
			return nil, errors.New("an external table must have a s3 bucket")
		}

		table.Bucket = bucket
		l.Info(fmt.Sprintf("database=%s %s table=%s \n", AnalyticsDatabaseDev, table.String(), *t.Name))
	}
	return tables, nil
}

func ResourceVersion() (int, error) {
	f, err := os.ReadFile("../../common/data/package.json")

	if err != nil {
		return 0, err
	}

	var pkgJson Pkg

	err = json.Unmarshal(f, &pkgJson)

	if err != nil {
		return 0, err
	}

	var major int

	semver := strings.Split(pkgJson.Version, ".")

	if len(semver) < 3 {
		return 0, errors.New("invalid semver")
	}

	major, err = strconv.Atoi(semver[0])

	if err != nil {
		return 0, err
	}

	if major < 1 {
		return 0, errors.New("major version must be greater than 0")
	}
	return major, nil
}

func (t Table) String() string {
	return fmt.Sprintf("table=%s version=%s bucket=%s", t.Name, t.Version, t.Bucket)
}
