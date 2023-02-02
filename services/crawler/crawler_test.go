package main

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

var ghaction = os.Getenv("GITHUB_ACTION")

func TestNewConfig(t *testing.T) {
	_ = &cli.App{
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
				Name:  "silent",
				Value: false,
				Usage: "silent",
			},
		},
		Action: func(c *cli.Context) error {
			config, err := NewConfig(*c)

			if err != nil {
				t.Error(err.Error())
			}

			if config.Url == "" {
				t.Error("RPC URL is empty")
			}
			return nil
		},
	}

}

func TestNewEthereumClient(t *testing.T) {
	if ghaction == "" {
		err := godotenv.Load()

		if err != nil {
			t.Error("Error loading .env file")
		}
	}

	client, err := NewEthereumClient(os.Getenv("RPC_URL"))

	if err != nil {
		t.Error("Error creating new ethereum client")
	}

	if client == nil {
		t.Error("Ethereum client is nil")
	}
}

func TestNewCrawler(t *testing.T) {
	if ghaction == "" {
		err := godotenv.Load()

		if err != nil {
			t.Error("Error loading .env file")
		}
	}

	crawler, err := NewCrawler(Config{
		Chain:   Ethereum,
		Network: Mainnet,
		Url:     os.Getenv("RPC_URL"),
	})

	if err != nil {
		t.Fatalf(err.Error())
	}

	if crawler.Head == 0 {
		t.Fatalf("Crawler head should not be 0")
	}

	if crawler.Status != Idle {
		t.Fatalf("Crawler status should be idle")
	}
}

func TestValidate(t *testing.T) {
	config := Config{
		Chain:   Ethereum,
		Start:   0,
		Network: Mainnet,
		Url:     os.Getenv("RPC_URL"),
		Output:  os.Getenv("EVENT_OUTPUT"),
	}

	config.End = config.Start + 100

	err := config.Validate()

	if err != nil {
		t.Fatalf(err.Error())
	}
}

func TestNewS3Client(t *testing.T) {
	if ghaction == "" {
		err := godotenv.Load()

		if err != nil {
			t.Fatalf("Error loading .env file")
		}
	}

	s3Client, err := NewS3Client("default")

	if err != nil {
		t.Fatalf("Error creating new s3 client")
	}

	if s3Client == nil {
		t.Fatalf(err.Error())
	}
}

func TestNewEvent(t *testing.T) {
	height := 16522700

	type testBlock struct {
		Number       int    `json:"number"`
		Hash         string `json:"hash"`
		Transactions []struct {
			BlockHash            string        `json:"blockHash"`
			BlockNumber          int           `json:"blockNumber"`
			Hash                 string        `json:"hash"`
			AccessList           []interface{} `json:"accessList"`
			ChainID              string        `json:"chainId"`
			From                 string        `json:"from"`
			Gas                  int           `json:"gas"`
			GasPrice             string        `json:"gasPrice"`
			Input                string        `json:"input"`
			MaxFeePerGas         string        `json:"maxFeePerGas"`
			MaxPriorityFeePerGas string        `json:"maxPriorityFeePerGas"`
			Nonce                int           `json:"nonce"`
			R                    string        `json:"r"`
			S                    string        `json:"s"`
			To                   string        `json:"to"`
			TransactionIndex     int           `json:"transactionIndex"`
			Type                 int           `json:"type"`
			V                    string        `json:"v"`
			Value                string        `json:"value"`
		} `json:"transactions"`
	}

	raw, err := os.ReadFile("./testblock.json")

	if err != nil {
		t.Error("Error reading block.json")
	}

	var tBlock testBlock

	err = json.Unmarshal(raw, &tBlock)

	if err != nil {
		t.Error("error unmarshalling block.json: " + err.Error())
	}

	fmt.Println(os.Getenv("RPC_URL"))

	client, err := NewEthereumClient(os.Getenv("RPC_URL"))

	if err != nil {
		t.Error("Error creating new ethereum client: " + err.Error())
	}

	block, err := client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		t.Error("Error getting block: " + err.Error())
	}

	blockEvent, err := NewBlockEvent(block)

	if err != nil {
		t.Error("Error creating new block event: " + err.Error())
	}

	if int(blockEvent.Height) != tBlock.Number {
		t.Error("Block number does not match")
	}

	if blockEvent.Hash != tBlock.Hash {
		t.Error("Block hash does not match")
	}

	if len(block.Transactions()) != len(tBlock.Transactions) {
		t.Error("Transaction length does not match")
	}
}

func TestNewTxEvent(t *testing.T) {
	height := 16522700

	type testTx struct {
		Number           int           `json:"number"`
		Hash             string        `json:"hash"`
		Difficulty       string        `json:"difficulty"`
		ExtraData        string        `json:"extraData"`
		GasLimit         int           `json:"gasLimit"`
		GasUsed          int           `json:"gasUsed"`
		LogsBloom        string        `json:"logsBloom"`
		Miner            string        `json:"miner"`
		MixHash          string        `json:"mixHash"`
		Nonce            string        `json:"nonce"`
		ParentHash       string        `json:"parentHash"`
		ReceiptsRoot     string        `json:"receiptsRoot"`
		Sha3Uncles       string        `json:"sha3Uncles"`
		Size             int           `json:"size"`
		StateRoot        string        `json:"stateRoot"`
		Timestamp        int           `json:"timestamp"`
		TotalDifficulty  string        `json:"totalDifficulty"`
		TransactionsRoot string        `json:"transactionsRoot"`
		Uncles           []interface{} `json:"uncles"`
		BaseFeePerGas    int64         `json:"baseFeePerGas"`
		Transactions     []struct {
			BlockHash            string        `json:"blockHash"`
			BlockNumber          int           `json:"blockNumber"`
			Hash                 string        `json:"hash"`
			AccessList           []interface{} `json:"accessList"`
			ChainID              string        `json:"chainId"`
			From                 string        `json:"from"`
			Gas                  int           `json:"gas"`
			GasPrice             string        `json:"gasPrice"`
			Input                string        `json:"input"`
			MaxFeePerGas         string        `json:"maxFeePerGas"`
			MaxPriorityFeePerGas string        `json:"maxPriorityFeePerGas"`
			Nonce                int           `json:"nonce"`
			R                    string        `json:"r"`
			S                    string        `json:"s"`
			To                   string        `json:"to"`
			TransactionIndex     int           `json:"transactionIndex"`
			Type                 int           `json:"type"`
			V                    string        `json:"v"`
			Value                string        `json:"value"`
		} `json:"transactions"`
	}

	raw, err := os.ReadFile("./testblock.json")

	if err != nil {
		t.Error("Error reading tx.json")
	}

	var tTx testTx

	err = json.Unmarshal(raw, &tTx)

	if err != nil {
		t.Error("error unmarshalling tx.json: " + err.Error())
	}

	client, err := NewEthereumClient(os.Getenv("RPC_URL"))

	if err != nil {
		t.Error("Error creating new ethereum client: " + err.Error())
	}

	block, err := client.BlockByNumber(context.Background(), big.NewInt(int64(height)))

	if err != nil {
		t.Error("Error getting block: " + err.Error())
	}

	for i, tx := range block.Transactions() {
		txEvent, err := NewTxEvent(block, tx)

		if err != nil {
			t.Error("Error creating new tx event: " + err.Error())
		}

		sender, err := client.TransactionSender(context.Background(), tx, block.Hash(), uint(i))

		txEvent.Address = sender.String()

		if err != nil {
			t.Error("Error getting tx sender: " + err.Error())
		}

		if txEvent.Hash != tTx.Transactions[i].Hash {
			t.Error("Tx hash does not match")
		}

		if txEvent.Address != tTx.Transactions[i].From {
			t.Error("Tx address does not match")
		}
	}

	if len(block.Transactions()) != len(tTx.Transactions) {
		t.Error("Transaction length does not match")
	}
}
