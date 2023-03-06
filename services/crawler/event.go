package main

import (
	"encoding/json"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/xitongsys/parquet-go/parquet"
	"github.com/xitongsys/parquet-go/writer"
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

type Price struct {
	Value    float64   `json:"price,omitempty"`
	Currency string    `json:"currency,omitempty"`
	Coin     string    `json:"coin,omitempty"`
	Time     time.Time `json:"time,omitempty"`
}

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
	Amount           int64        `json:"amount,omitempty"`
	Price            float64      `json:"price,omitempty"`
	SenderBalance    int64        `json:"sender_balance,omitempty"`
	RecipientBalance int64        `json:"recipient_balance,omitempty"`
}

func NewParquetWriter(schema []*parquet.SchemaElement) (*writer.ParquetWriter, error) {
	by := "casimir.parquet.schema"

	w := writer.ParquetWriter{
		NP: 4,
		Footer: &parquet.FileMetaData{
			Schema:    schema,
			Version:   1,
			CreatedBy: &by,
		},
		RowGroupSize: 128 * 1024 * 1024,
		PageSize:     8 * 1024,
	}
	w.CompressionType = parquet.CompressionCodec_SNAPPY
	return &w, nil
}

func NewBlockEvent(block *types.Block) (Event, error) {
	event := Event{
		Chain:      Ethereum,
		Network:    Mainnet,
		Provider:   Alchemy,
		Type:       Block,
		Height:     block.Number().Int64(),
		Block:      block.Hash().Hex(),
		ReceivedAt: time.Unix(int64(block.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
	}
	return event, nil
}

func NewTxEvent(block *types.Block, tx *types.Transaction) Event {
	event := Event{
		Network:     Mainnet,
		Provider:    Alchemy,
		Chain:       Ethereum,
		Type:        Transaction,
		Block:       tx.Hash().Hex(),
		Transaction: tx.Hash().Hex(),
		Height:      block.Number().Int64(),
		ReceivedAt:  time.Unix(int64(block.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
	}

	if tx.To() != nil {
		event.Recipient = tx.To().Hex()
	}

	if tx.Value() != nil {
		event.Amount = tx.Value().Int64()
	}

	return event
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
