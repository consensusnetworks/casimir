package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

const (
	ConcurrencyLimit = 100
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

func NewEthereumCrawler(config Config) (*EthereumCrawler, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, errors.New("FailedToCreateLogger")
	}

	l := logger.Sugar()

	eth, err := NewEthereumService(config.URL.String())

	if err != nil {
		l.Infof("FailedToCreateEthereumClient: %s", err.Error())
		return nil, err
	}

	head, err := eth.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("FailedToGetBlockNumber: %s", err.Error())
		return nil, err
	}

	awsConfig, err := LoadDefaultAWSConfig()

	if err != nil {
		l.Infof("FailedToLoadDefaultAWSConfig: %s", err.Error())
		return nil, err
	}

	glue, err := NewGlueService(awsConfig)

	if err != nil {
		l.Infof("FailedToCreateGlueClient: %s", err.Error())
		return nil, err
	}

	err = glue.Introspect(config.Env)

	if err != nil {
		l.Infof("FailedToIntrospectGlue: %s", err.Error())
		return nil, err
	}

	s3c, err := NewS3Service(awsConfig)

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
		Config:          &config,
		CasimirManager:  csm,
	}, nil
}

func (c *EthereumCrawler) Crawl() error {
	defer c.Wg.Wait()

	l := c.Logger.Sugar()

	l.Infof("crawling %s", c.Config.URL.String())

	batchSizeLimit := 100
	batchSize := (c.Head + 1) / int64(batchSizeLimit)

	if batchSize > int64(ConcurrencyLimit) {
		batchSize = int64(ConcurrencyLimit)
	}

	l.Infof("batch size: %d", batchSize)

	for i := int64(10); i >= 0; i -= batchSize {
		batchHead := i
		batchTail := i - (int64(batchSize) - 1)

		if batchTail < 0 {
			batchHead = i
			batchTail = 0
		}

		c.Wg.Add(1)
		go func(batchHead, batchTail int64) {
			defer func() {
				<-c.Sema
				c.Wg.Done()
			}()

			c.Sema <- struct{}{}

			l.Infof("processing batch=%d-%d", batchHead, batchTail)

			err := c.ProcessBatch(batchHead, batchTail)

			if err != nil {
				l.Infof("failed to process batch=%d error=%s", batchHead, err.Error())
			}

			l.Infof("completed range [%d, %d]", batchHead, batchTail)
		}(batchHead, batchTail)
	}

	return nil
}

func (c *EthereumCrawler) ProcessBatch(start, end int64) error {
	l := c.Logger.Sugar()

	var txBytes []byte
	var walletBytes []byte

	for i := start; i >= end; i++ {
		config := BlockConfig{
			Chain:    Ethereum,
			Network:  c.EthereumService.Network,
			Provider: c.EthereumService.Provider,
			Height:   i,
			Forked:   c.Config.Fork,
		}

		blockEvents, err := GetBlockEvents(config, c.EthereumService.Client)

		if err != nil {
			l.Infof("failed to get block events: %s", err.Error())
			continue
		}

		if len(blockEvents.Events) != 0 {
			txs, err := NDJSON(blockEvents.Events)

			if err != nil {
				l.Infof("failed to marshal block events: %s", err.Error())
				continue
			}

			txBytes = append(txBytes, txs.Bytes()...)
		}

		if len(blockEvents.Wallets) != 0 {
			wallets, err := NDJSON(blockEvents.Wallets)

			if err != nil {
				l.Infof("failed to marshal block wallets: %s", err.Error())
				continue
			}

			walletBytes = append(walletBytes, wallets.Bytes()...)
		}
	}

	blockFile := fmt.Sprintf("block=%d-%d.ndjson", start, end)

	if len(txBytes) != 0 {
		txsKey := fmt.Sprintf("%s/%s/%s.ndjson", Ethereum, c.EthereumService.Network, blockFile)

		err := c.S3.UploadBytes(c.Glue.EventBucket.Bucket, txsKey, bytes.NewBuffer(txBytes))

		if err != nil {
			return err
		}
	}

	if len(txBytes) != 0 {
		walletsKey := fmt.Sprintf("%s/%s/%s.ndjson", Ethereum, c.EthereumService.Network, blockFile)

		err := c.S3.UploadBytes(c.Glue.WalletBucket.Bucket, walletsKey, bytes.NewBuffer(walletBytes))

		if err != nil {
			return err
		}
	}

	return nil
}

//if c.Fork {
//	l.Infof("Crawling Forked Ethereum Network from %d", c.Head)
//
//	l := c.Logger.Sugar()
//
//	query := ethereum.FilterQuery{
//		Addresses: []common.Address{
//			// TODO: replace with contract address from env
//			common.HexToAddress("0x07e05700cb4e946ba50244e27f01805354cd8ef0"),
//		},
//	}
//
//	logs, err := c.Client.FilterLogs(context.Background(), query)
//
//	if err != nil {
//		l.Infof("FailedToGetLogs: %s", err.Error())
//		return err
//	}
//
//	err = c.Client.Client().BatchCall(([]rpc.BatchElem{
//		{
//			Method: "eth_getFilterLogs",
//			Args:   []interface{}{query},
//			Result: &logs,
//		},
//	}))

//if err != nil {
//	l.Infof("FailedToGetLogs: %s", err.Error())
//	return err
//}
//
//if len(logs) == 0 {
//	l.Infof("NoLogsFound: Fork network has no logs for contract %s", "0x07e05700cb4e946ba50244e27f01805354cd8ef0")
//	return nil
//}
//
//for _, log := range logs {
//	fmt.Println(log.Data)
//}

// for i := 0; i < numLogs; i += logBatch {
// 	start := i

// 	if i != 0 {
// 		start = start + 1
// 	}

// 	end := i + logBatch

// 	if end > numLogs {
// 		end = numLogs
// 	}

// 	logsBatch := logs[start:end]

// 	c.Wg.Add(1)
// 	go func(logsBatch []types.Log) {
// 		defer c.Wg.Done()

// 		c.Sema <- struct{}{}

// 		for _, log := range logsBatch {
// 			err := c.ProcessBlock(int64(log.BlockNumber))

// 			if err != nil {
// 				l.Infof("FailedToProcessLog: %s", err.Error())
// 				continue
// 			}
// 		}

// 		<-c.Sema
// 	}(logsBatch)
// }

//
//for i := c.Head; i >= 0; i -= BlocksPerBatch {
//	start := i
//	end := i - BlocksPerBatch
//
//	if end < 0 {
//		end = 0
//	}
//
//	c.Wg.Add(1)
//	go func(start, end, i int64) {
//		defer func() {
//			c.Wg.Done()
//			<-c.Sema
//			l.Infof("CompletedBatch: batch=%d start=%d end=%d", i/BlocksPerBatch, start, end)
//		}()
//
//		c.Sema <- struct{}{}
//
//		l.Infof("StartedBatch: batch=%d start=%d end=%d", i/BlocksPerBatch, start, end)
//
//		for j := start; j >= end; j-- {
//			err := c.ProcessBlock(j)
//			if err != nil {
//				l.Errorf("FailedToConsumeBlock: block=%d error=%s", j, err)
//				continue
//			}
//		}
//
//		<-c.Sema
//	}(start, end, i)
//}
//
//defer c.Close()
//return nil

func (c *EthereumCrawler) Close() {
	l := c.Logger.Sugar()
	defer l.Sync()

	c.Client.Close()
	close(c.Sema)

	c.Elapsed = time.Since(c.Start)

	l.Info("closed all connections, shutting down...")
	l.Infof("time elapsed: %s", c.Elapsed)
}
