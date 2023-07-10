package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/rpc"
)

const (
	ConcurrencyLimit = 200
	BlocksPerBatch   = 100_000
)

type EthereumCrawler struct {
	*Logger
	*EthereumService
	*Config
	Glue           *GlueService
	S3             *S3Service
	Wg             *sync.WaitGroup
	CasimirManager *CasimirManager
	Sema           chan struct{}
	Head           int64
	Version        int
	Env            Environment
	Start          time.Time
	Elapsed        time.Duration
}

type Config struct {
	Env  Environment
	Fork bool
}

func NewEthereumCrawler(cnfg Config) (*EthereumCrawler, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, errors.New("FailedToCreateLogger")
	}

	l := logger.Sugar()

	url := os.Getenv("ETHEREUM_RPC_URL")

	if url == "" {
		l.Infof("EnvVariableNotFound: ETHEREUM_RPC_URL")
		return nil, errors.New("EnvVariableNotFound: ETHEREUM_RPC_URL is not set")
	}

	if cnfg.Fork {
		url = fmt.Sprintf("https://%s/%s/%s", NodeHost, "eth", "hardhat")
	}

	l.Infof("ConnectingToEthereumNode: %s", url)

	eth, err := NewEthereumService(url)

	if err != nil {
		l.Infof("FailedToCreateEthereumClient: %s", err.Error())
		return nil, err
	}

	head, err := eth.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("FailedToGetBlockNumber: %s", err.Error())
		return nil, err
	}

	config, err := LoadDefaultAWSConfig()

	if err != nil {
		l.Infof("FailedToLoadDefaultAWSConfig: %s", err.Error())
		return nil, err
	}

	glue, err := NewGlueService(config)

	if err != nil {
		l.Infof("FailedToCreateGlueClient: %s", err.Error())
		return nil, err
	}

	err = glue.Introspect(cnfg.Env)

	if err != nil {
		l.Infof("FailedToIntrospectGlue: %s", err.Error())
		return nil, err
	}

	s3c, err := NewS3Service(config)

	if err != nil {
		l.Infof("FailedToCreateS3Client: %s", err.Error())
		return nil, err
	}

	resourceVersion, err := GetResourceVersion()

	if err != nil {
		l.Infof("FailedToGetResourceVersion: %s", err.Error())
		return nil, err
	}

	csm, err := GetContractBuildArtifact()

	if err != nil {
		l.Infof("FailedToGetContractBuildArtifact: %s", err.Error())
		return nil, err
	}

	return &EthereumCrawler{
		Logger:          logger,
		EthereumService: eth,
		Glue:            glue,
		S3:              s3c,
		Wg:              &sync.WaitGroup{},
		Start:           time.Now(),
		Sema:            make(chan struct{}, ConcurrencyLimit),
		Head:            int64(head),
		Version:         resourceVersion,
		Env:             cnfg.Env,
		Config:          &cnfg,
		CasimirManager:  csm,
	}, nil
}

type BlockEvents struct {
	Events        []Event // +1 block
	Wallet        []Wallet
	StakingAction []StakingAction
}

func (c *EthereumCrawler) Crawl() error {
	l := c.Logger.Sugar()

	l.Infof("StartedCrawler: Chain=%s Network=%s CrawlerVersion=%d ResourceVersion=%d Head=%d", Ethereum, c.EthereumService.Network, c.Version, c.Glue.ResourceVersion, c.Head)
	l.Infof("CrawlerOptions: ConcurrencyLimit=%d BlocksPerBatch=%d", ConcurrencyLimit, BlocksPerBatch)

	if c.Fork {
		l.Infof("Crawling Forked Ethereum Network from %d", c.Head)

		l := c.Logger.Sugar()

		query := ethereum.FilterQuery{
			Addresses: []common.Address{
				// TODO: replace with contract address from env
				common.HexToAddress("0x07e05700cb4e946ba50244e27f01805354cd8ef0"),
			},
		}

		logs, err := c.Client.FilterLogs(context.Background(), query)

		if err != nil {
			l.Infof("FailedToGetLogs: %s", err.Error())
			return err
		}

		err = c.Client.Client().BatchCall(([]rpc.BatchElem{
			{
				Method: "eth_getFilterLogs",
				Args:   []interface{}{query},
				Result: &logs,
			},
		}))

		if err != nil {
			l.Infof("FailedToGetLogs: %s", err.Error())
			return err
		}

		if len(logs) == 0 {
			l.Infof("NoLogsFound: Fork network has no logs for contract %s", "0x07e05700cb4e946ba50244e27f01805354cd8ef0")
			return nil
		}

		logBatch := 100
		numLogs := len(logs)

		l.Infof("Found %d contract logs", numLogs)

		for i := 0; i < numLogs; i += logBatch {
			start := i

			if i != 0 {
				start = start + 1
			}

			end := i + logBatch

			if end > numLogs {
				end = numLogs
			}

			logsBatch := logs[start:end]

			c.Wg.Add(1)
			go func(logsBatch []types.Log) {
				defer c.Wg.Done()

				c.Sema <- struct{}{}

				for _, log := range logsBatch {
					err := c.ProcessBlock(int64(log.BlockNumber))

					if err != nil {
						l.Infof("FailedToProcessLog: %s", err.Error())
						continue
					}
				}

				<-c.Sema
			}(logsBatch)
		}

		return nil
	}

	for i := c.Head; i >= 0; i -= BlocksPerBatch {
		start := i
		end := i - BlocksPerBatch

		if end < 0 {
			end = 0
		}

		c.Wg.Add(1)
		go func(start, end, i int64) {
			defer func() {
				c.Wg.Done()
				<-c.Sema
				l.Infof("CompletedBatch: batch=%d start=%d end=%d", i/BlocksPerBatch, start, end)
			}()

			c.Sema <- struct{}{}

			l.Infof("StartedBatch: batch=%d start=%d end=%d", i/BlocksPerBatch, start, end)

			for j := start; j >= end; j-- {
				err := c.ProcessBlock(j)
				if err != nil {
					l.Errorf("FailedToConsumeBlock: block=%d error=%s", j, err)
					continue
				}
			}

			<-c.Sema
		}(start, end, i)
	}

	defer c.Close()
	return nil
}

func (c *EthereumCrawler) Close() {
	l := c.Logger.Sugar()
	defer l.Sync()

	c.Wg.Wait()
	c.Client.Close()
	close(c.Sema)

	c.Elapsed = time.Since(c.Start)

	l.Infof("ClosedCrawlerConnections")
	l.Infof("TimeElapsed=%s", c.Elapsed.Round(time.Millisecond))
}

func (c *EthereumCrawler) ProcessBlock(height int64) error {
	l := c.Logger.Sugar()

	bcnfg := BlockConfig{
		Chain:    Ethereum,
		Network:  c.EthereumService.Network,
		Provider: Casimir,
		Height:   height,
	}

	blockEvents, err := GetBlockEvents(bcnfg, c.EthereumService.Client)

	if err != nil {
		l.Errorf("FailedToGetTxEvents: block=%d error=%s", height, err.Error())
		return err
	}

	txBytes, err := EventNDJSON(blockEvents.Events)

	if err != nil {
		return err
	}

	eventKey := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum, c.EthereumService.Network, height)

	err = c.S3.UploadBytes(c.Glue.EventBucket.Bucket, eventKey, txBytes)

	if err != nil {
		l.Errorf("FailedToUploadTxEvents: block=%d error=%s", height, err.Error())
		return err
	}

	walletBytes, err := WalletNDJSON(blockEvents.Wallets)

	if err != nil {
		return err
	}

	walletKey := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum, c.EthereumService.Network, height)

	err = c.S3.UploadBytes(c.Glue.WalletBucket.Bucket, walletKey, walletBytes)

	if err != nil {
		return err
	}

	contractDest := fmt.Sprintf("%s/%s/%s/block=%d.ndjson", Ethereum, c.EthereumService.Network, "contracts", height)

	err = c.S3.UploadBytes(c.Glue.EventBucket.Bucket, contractDest, nil)

	if err != nil {
		return err
	}

	l.Infof("UploadedBlock: block=%d", height)

	return nil
}
