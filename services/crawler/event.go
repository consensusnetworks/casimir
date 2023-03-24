package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
)

type ChainType string
type NetworkType string
type ProviderType string
type EventType string

const (
	Ethereum ChainType = "ethereum"
	Iotex    ChainType = "iotex"

	Mainnet NetworkType = "mainnet"
	Testnet NetworkType = "testnet"

	Consensus ProviderType = "consensus"
	Alchemy   ProviderType = "alchemy"

	Block       EventType = "block"
	Transaction EventType = "transaction"
)

type Event struct {
	Chain            ChainType    `json:"chain,omitempty"`
	Network          NetworkType  `json:"network,omitempty"`
	Provider         ProviderType `json:"provider,omitempty"`
	Type             EventType    `json:"type,omitempty"`
	Height           int64        `json:"height,omitempty"`
	Block            string       `json:"block,omitempty"`
	Transaction      string       `json:"transaction,omitempty"`
	ReceivedAt       string       `json:"received_at,omitempty"`
	Sender           string       `json:"sender,omitempty"`
	Recipient        string       `json:"recipient,omitempty"`
	Amount           string       `json:"amount,omitempty"`
	Price            float64      `json:"price,omitempty"`
	SenderBalance    string       `json:"sender_balance,omitempty"`
	RecipientBalance string       `json:"recipient_balance,omitempty"`
	GasFee           string       `json:"gas_fee,omitempty"`
}

func (e *EthereumCrawler) NewBlockEvent(block *types.Block) (Event, error) {
	var event Event

	if block == nil {
		err := fmt.Errorf("failed to create block event: block is nil")
		return Event{}, err
	}

	event = Event{
		Chain:    Ethereum,
		Network:  Mainnet,
		Provider: Alchemy,
		Type:     Block,
		Height:   block.Number().Int64(),
		// Block:    block.Hash().Hex(),
		// ReceivedAt: time.Unix(int64(block.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
	}

	if block.Hash().Hex() != "" {
		event.Block = block.Hash().Hex()
	}

	if block.Time() != 0 {
		event.ReceivedAt = time.Unix(int64(block.Time()), 0).Format("2006-01-02 15:04:05.999999999")
	}

	return event, nil
}

func (e *EthereumCrawler) NewTxEvent(block *types.Block, tx *types.Transaction) (Event, error) {
	var event Event

	if block == nil {
		err := fmt.Errorf("failed to create transaction event: block is nil")
		fmt.Println(err)
		return event, err
	}

	if tx == nil {
		err := fmt.Errorf("failed to create transaction event: transaction is nil")
		fmt.Println(err)
		return event, err
	}

	event = Event{
		Network:  e.Network,
		Provider: Consensus,
		Chain:    Ethereum,
		Type:     Transaction,
	}

	if tx.GasPrice() != nil {
		gasPrice := tx.GasPrice().Uint64()
		gasFee := new(big.Int).Mul(new(big.Int).SetUint64(gasPrice), new(big.Int).SetUint64(tx.Gas()))
		event.GasFee = gasFee.String()
	}

	if block.Number() != nil {
		event.Height = block.Number().Int64()
	}

	if block.Hash().Hex() != "" {
		event.Block = block.Hash().Hex()
	}

	if block.Time() != 0 {
		event.ReceivedAt = time.Unix(int64(block.Time()), 0).Format("2006-01-02 15:04:05.999999999")
	}

	if tx.Hash().Hex() != "" {
		event.Transaction = tx.Hash().Hex()
	}

	if tx.Value() != nil {
		event.Amount = tx.Value().String()
	}

	return event, nil
}

func NDJSON(events *[]Event) (string, error) {
	var ndjson []byte

	for _, event := range *events {
		line, err := json.Marshal(event)

		if err != nil {
			return "", err
		}
		line = append(line, '\r')
		ndjson = append(ndjson, line...)
	}
	return string(ndjson), nil
}

func (c ChainType) String() string {
	switch c {
	case Ethereum:
		return "ethereum"
	case Iotex:
		return "iotex"
	default:
		panic("unknown")
	}
}

func (p ProviderType) String() string {
	switch p {
	case Alchemy:
		return "alchemy"
	case Consensus:
		return "consensus"
	default:
		panic("unknown")
	}
}

func (n NetworkType) String() string {
	switch n {
	case Testnet:
		return "testnet"
	case Mainnet:
		return "mainnet"
	default:
		panic("unknown")
	}
}
