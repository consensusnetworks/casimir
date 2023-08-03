package main

import (
	"bytes"
	"encoding/json"
	"fmt"
)

type EventType string
type TxDirection string
type ContractEvents string
type SpecificActionType string

const (
	Block       EventType = "block"
	Transaction EventType = "transaction"
	// a special event type that is used to track in and out tx of a address
	Wallet EventType = "wallet"

	StakeDeposited       SpecificActionType = "stake_deposited"
	StakeRebalanced      SpecificActionType = "stake_rebalanced"
	WithdrawalInitiated  SpecificActionType = "withdrawal_initiated"
	WithdrawalFullfilled SpecificActionType = "withdrawal_fullfilled"
	// wallet event actions
	Received SpecificActionType = "received"
	Sent     SpecificActionType = "sent"
)

type Event struct {
	Chain            ChainType    `json:"chain"`
	Network          NetworkType  `json:"network"`
	Provider         ProviderType `json:"provider"`
	Type             EventType    `json:"type"`
	Height           int64        `json:"height"`
	Block            string       `json:"block"`
	Transaction      string       `json:"transaction"`
	ReceivedAt       int          `json:"received_at"`
	Sender           string       `json:"sender" `
	Recipient        string       `json:"recipient"`
	SenderBalance    string       `json:"sender_balance"`
	RecipientBalance string       `json:"recipient_balance"`
	Amount           string       `json:"amount"`
	Price            float64      `json:"price"`
	GasFee           int64        `json:"gas_fee"`
}

type Action struct {
	Chain          ChainType          `json:"chain"`
	Network        NetworkType        `json:"network"`
	Type           EventType          `json:"type"`
	Action         SpecificActionType `json:"action"`
	Address        string             `json:"address"`
	Amount         string             `json:"amount"`
	Balance        string             `json:"balance"`
	Gas            uint64             `json:"gas"`
	Hash           string             `json:"hash"`
	Price          float64            `json:"price"`
	ReceivedAt     string             `json:"received_at"`
	RewardsAllTime string             `json:"rewards_all_time"`
	StakingFees    string             `json:"staking_fees"`
}
type BlockEventsResult struct {
	Events             []Event   `json:"events"`
	Action             []Action  `json:"action"`
	EventsPartitionKey Partition `json:"events_partition_key"`
	ActionPartitionKey Partition `json:"action_partition_key"`
}

func (a Action) String() string {
	json, _ := json.Marshal(a)

	return string(json)
}

func (e Event) String() string {
	json, _ := json.Marshal(e)

	return string(json)
}

func (e EventType) String() string {
	switch e {
	case Block:
		return "block"
	case Transaction:
		return "transaction"
	default:
		return ""
	}
}

func NDJSON[T Event | Action](events []T) (*bytes.Buffer, error) {
	var buf bytes.Buffer

	for _, ev := range events {
		txj, err := json.Marshal(ev)
		if err != nil {
			return nil, fmt.Errorf("failed to encode wallet to JSON: %v", err)
		}
		buf.Write(txj)
		buf.WriteString("\n")
	}

	return &buf, nil
}
