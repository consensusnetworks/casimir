package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/core/types"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"

	_ "github.com/segmentio/go-athena"

	"github.com/ethereum/go-ethereum/ethclient"
)

type ChainType string
type NetworkType string

type ProviderType string
type EventType string
type Status string

const (
	Ethereum ChainType = "ethereum"
	Iotex    ChainType = "iotex"

	Mainnet NetworkType = "mainnet"
	Testnet NetworkType = "testnet"

	Alchemy ProviderType = "alchemy"

	Block       EventType = "block"
	Transaction EventType = "transaction"
	Deposit     EventType = "deposit"

	Idle    Status = "idle"
	Running Status = "running"
	Stopped Status = "stopped"
)

var ErrUnsupportedChain = errors.New("unsupported chain, only ethereum and iotex are supported")

type Config struct {
	Chain              ChainType
	Network            NetworkType
	BlockPerPerRoutine int64
	Url                string
	Start              int64
	End                int64
	AwsProfile         string
	Verbose            bool
	Output             string
}

type Crawler struct {
	Config    Config
	EthClient *ethclient.Client
	S3Client  *s3.S3
	Status    Status
	Head      int64
}

type Event struct {
	Chain            ChainType    `json:"chain,omitempty"`
	Network          NetworkType  `json:"network,omitempty"`
	Provider         ProviderType `json:"provider,omitempty"`
	Type             EventType    `json:"type,omitempty"`
	Height           int64        `json:"height"`
	Hash             string       `json:"block,omitempty"`
	CreatedAt        string       `json:"created_at,omitempty"`
	Address          string       `json:"address,omitempty"`
	ToAddress        string       `json:"to_address,omitempty"`
	Amount           string       `json:"amount,omitempty"`
	GasUsed          string       `json:"gas_used,omitempty"`
	GasPrice         string       `json:"gas_price,omitempty"`
	GasLimit         string       `json:"gas_limit,omitempty"`
	BaseFee          string       `json:"base_fee,omitempty"`
	BurntFee         string       `json:"burnt_fee,omitempty"`
	Validator        string       `json:"validator,omitempty"`
	ValidatorList    []string     `json:"validator_list,omitempty"`
	Duration         string       `json:"duration,omitempty"`
	AutoStake        bool         `json:"auto_stake,omitempty"`
	AddressBalance   string       `json:"address_balance,omitempty"`
	ToAddressBalance string       `json:"to_address_balance,omitempty"`
}

type Task struct {
	Range  []int64
	Events []Event
	Err    error
}

func main() {
	err := godotenv.Load()

	if err != nil {
		panic(err)
	}

	app := &cli.App{
		Name: "candle",
		Action: func(c *cli.Context) error {
			config, err := NewConfig(*c)

			if err != nil {
				panic(err)
			}

			crawler, err := NewCrawler(config)

			if err != nil {
				panic(err)
			}

			err = crawler.Start()

			if err != nil {
				panic(err)
			}

			return nil
		},
		Flags: []cli.Flag{
			&cli.Int64Flag{
				Name:  "start",
				Value: 0,
				Usage: "start block",
			},
			&cli.Int64Flag{
				Name:  "end",
				Value: 0,
				Usage: "end block",
			},
			&cli.StringFlag{
				Name:  "url",
				Value: os.Getenv("RPC_URL"),
				Usage: "rpc url",
			},
			&cli.StringFlag{
				Name:  "chain",
				Value: Ethereum.String(),
				Usage: "chain type",
			},
			&cli.StringFlag{
				Name:  "network",
				Value: Mainnet.String(),
				Usage: "network type",
			},
			&cli.StringFlag{
				Name:  "profile",
				Value: "default",
				Usage: "aws profile",
			},
			&cli.BoolFlag{
				Name:  "verbose",
				Value: false,
				Usage: "verbose mode",
			},
			&cli.Int64Flag{
				Name:  "bpr",
				Value: 0,
				Usage: "blocks per goroutine (lightweight thread)",
			},
			&cli.StringFlag{
				Name:  "output",
				Value: "",
				Usage: "output location (s3://bucket/path)",
			},
		},
	}

	app.Run(os.Args)
}

func NewConfig(c cli.Context) (Config, error) {
	config := Config{
		Start:              c.Int64("start"),
		End:                c.Int64("end"),
		Url:                c.String("url"),
		Chain:              ChainType(c.String("chain")),
		Network:            NetworkType(c.String("network")),
		AwsProfile:         c.String("profile"),
		Verbose:            c.Bool("verbose"),
		BlockPerPerRoutine: c.Int64("bpr"),
		Output:             c.String("output"),
	}

	if config.Url == "" {
		config.Url = "http://localhost:8545"
	}

	err := config.Validate()

	if err != nil {
		return config, err
	}

	return config, nil
}

func NewCrawler(config Config) (*Crawler, error) {
	if config.Chain == Ethereum {
		client, err := NewEthereumClient(config.Url)

		if err != nil {
			return nil, err
		}

		c := Crawler{
			Config:    config,
			EthClient: client,
			Status:    Idle,
		}

		block, err := c.EthClient.HeaderByNumber(context.Background(), nil)

		if err != nil {
			return nil, err
		}

		c.Head = block.Number.Int64()

		c.S3Client, err = NewS3Client(config.AwsProfile)

		if err != nil {
			return nil, err
		}

		return &c, nil
	}
	return nil, errors.New("chain not supported")
}

func NewEthereumClient(url string) (*ethclient.Client, error) {
	client, err := ethclient.Dial(url)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func (c *Crawler) Start() error {
	if c.Config.Chain == Ethereum {
		begin := time.Now()
		c.Status = Running
		max := 200

		if c.Config.BlockPerPerRoutine == 0 {
			c.Config.BlockPerPerRoutine = int64(max * 2)
		}

		var wg sync.WaitGroup

		for i := c.Config.Start; i <= c.Config.End; i++ {
			start := i
			end := i + int64(c.Config.BlockPerPerRoutine)

			if end > c.Config.End {
				end = c.Config.End
			}

			i = end

			wg.Add(1)
			go c.Crawl(&wg, []int64{start, end})
		}

		defer func() {
			wg.Wait()
			c.Print("elapsed time: %v \n", time.Since(begin).String())
		}()

		return nil
	}
	return ErrUnsupportedChain
}

func (c *Crawler) Crawl(wg *sync.WaitGroup, r []int64) {
	defer wg.Done()
	if c.Config.Chain == Ethereum {
		c.Print("crawling blocks %v - %v \n", r[0], r[1])

		var events []Event

		for i := r[0]; i <= r[1]; i++ {
			b, err := c.EthClient.BlockByNumber(context.Background(), big.NewInt(i))

			if err != nil {
				panic(err)
			}

			block, err := NewBlockEvent(b)

			if err != nil {
				panic(err)
			}

			events = append(events, block)

			if len(b.Transactions()) > 0 {
				for _, tx := range b.Transactions() {
					sender, err := c.EthClient.TransactionSender(context.Background(), tx, b.Hash(), uint(i))

					if err != nil {
						panic(err)
					}

					event, err := NewTxEvent(b, tx)

					if err != nil {
						panic(err)
					}

					event.Address = sender.Hash().String()
					events = append(events, event)
				}
			}
		}

		ev, err := ToNDJSON(events)

		if err != nil {
			panic(err)
		}

		key := fmt.Sprintf("%v-%v.ndjson", r[0], r[1])

		err = c.Save(key, []byte(ev))

		if err != nil {
			panic(err)
		}
		c.Print("saved %v - %v \t got %v events \n", r[0], r[1], len(events))
		return
	}
	panic(ErrUnsupportedChain)
}

func NewBlockEvent(block *types.Block) (Event, error) {
	unix := int64(block.Time())
	tt := time.Unix(unix, 0).Format("2006-01-02 15:04:05.999999999")

	event := Event{
		Network:   Mainnet,
		Provider:  Alchemy,
		Chain:     Ethereum,
		Type:      Block,
		Height:    block.Number().Int64(),
		Hash:      block.Hash().String(),
		CreatedAt: tt,
		Address:   block.Coinbase().String(),
		GasUsed:   fmt.Sprint(block.GasUsed()),
		GasLimit:  fmt.Sprint(block.GasLimit()),
	}

	if block.BaseFee() != nil {
		event.BaseFee = block.BaseFee().String()
		burntFee := new(big.Int).Mul(block.BaseFee(), big.NewInt(int64(block.GasUsed())))
		event.BurntFee = burntFee.String()
	}

	return event, nil
}

func NewTxEvent(block *types.Block, tx *types.Transaction) (Event, error) {
	unix := int64(block.Time())
	tt := time.Unix(unix, 0).Format("2006-01-02 15:04:05.999999999")

	event := Event{
		Network:   Mainnet,
		Provider:  Alchemy,
		Chain:     Ethereum,
		Type:      Transaction,
		Hash:      tx.Hash().String(),
		Height:    block.Number().Int64(),
		CreatedAt: tt,
		GasUsed:   fmt.Sprint(tx.Gas()),
		GasLimit:  fmt.Sprint(tx.Gas()),
		GasPrice:  tx.GasPrice().String(),
	}

	if tx.To() != nil {
		event.Address = tx.To().String()
	}

	if tx.Value() != nil {
		event.Amount = tx.Value().String()
	}

	return event, nil
}

func ToNDJSON(events []Event) (string, error) {
	var ndjson []byte

	for _, event := range events {
		line, err := json.Marshal(event)

		if err != nil {
			return "", err
		}

		line = append(line, '\r')
		ndjson = append(ndjson, line...)
	}

	return string(ndjson), nil
}

func (c *Config) Validate() error {
	if c.Start < 0 || c.End < 0 {
		return fmt.Errorf("start and end block must be greater than 0")
	}

	if c.Start == c.End {
		return fmt.Errorf("start and end block must be different")
	}

	if c.End < c.Start {
		return fmt.Errorf("end block must be greater than start block")
	}

	if c.Chain != Ethereum {
		return fmt.Errorf("chain not supported yet")
	}

	if c.Network != Mainnet {
		return fmt.Errorf("switch to mainnet for now")
	}

	if c.Output == "" || !strings.HasPrefix(c.Output, "s3://") {
		return fmt.Errorf("output must be an s3 bucket path")
	}

	return nil
}

func NewS3Client(profile string) (*s3.S3, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String("us-east-2"),
		Credentials: credentials.NewSharedCredentials("", profile),
	},
	)
	if err != nil {
		return nil, err
	}

	return s3.New(sess), nil
}

func (c *Crawler) Save(key string, data []byte) error {
	if len(data) == 0 {
		return fmt.Errorf("data cannot be empty")
	}

	bucket := strings.Split(c.Config.Output, "s3://")

	_, err := c.S3Client.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(bucket[1]),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
	})

	if err != nil {
		return err
	}
	return nil
}

func (chain ChainType) String() string {
	switch chain {
	case Ethereum:
		return "ethereum"
	case Iotex:
		return "iotex"
	default:
		panic("unknown")
	}
}

func (provider ProviderType) String() string {
	switch provider {
	case Alchemy:
		return "alchemy"
	default:
		panic("unknown")
	}
}

func (net NetworkType) String() string {
	switch net {
	case Testnet:
		return "testnet"
	case Mainnet:
		return "mainnet"
	default:
		panic("unknown")
	}
}

func (event EventType) String() string {
	switch event {
	case Transaction:
		return "transaction"
	case Deposit:
		return "deposit"
	case Block:
		return "block"
	default:
		panic("unknown")
	}
}

func (c *Crawler) Print(s string, args ...interface{}) {
	if c.Config.Verbose {
		fmt.Printf(s, args...)
	}
}
