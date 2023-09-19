package main

import (
	"bytes"
	"encoding/json"
	"fmt"
)

type EventType string
type TxDirection string
type ActionType string

const (
	Outgoing TxDirection = "outgoing"
	Incoming TxDirection = "incoming"

	Block       EventType = "block"
	Transaction EventType = "transaction"
	Wallet      EventType = "wallet"
	Stake       EventType = "stake"

	Sent                 ActionType = "sent"
	Received             ActionType = "received"
	StakeDeposit         ActionType = "stake_deposit"
	StakeRebalance       ActionType = "stake_rebalance"
	WithdrawalInitiated  ActionType = "withdrawal_initiated"
	WithdrawalFullfilled ActionType = "withdrawal_fullfilled"
)

type EthereumEvent struct {
	Chain            Chain     `json:"chain"`
	Network          Network   `json:"network"`
	Provider         Provider  `json:"provider"`
	EventType        EventType `json:"event"`
	Height           uint64    `json:"height"`
	Block            string    `json:"block"`
	Transaction      string    `json:"transaction"`
	ReceivedAt       uint64    `json:"received_at"`
	Sender           string    `json:"sender" `
	Recipient        string    `json:"recipient"`
	SenderBalance    string    `json:"sender_balance"`
	RecipientBalance string    `json:"recipient_balance"`
	Amount           string    `json:"amount"`
	Price            string    `json:"price"`
	GasFee           string    `json:"gas_fee"`
	Count            uint64    `json:"count"`
	PoolId           uint64    `json:"pool_id"`
	NewOwner         string    `json:"new_owner"`
	OperatorId       string    `json:"operator_id"`
}

type Action struct {
	Chain          Chain      `json:"chain"`
	Network        Network    `json:"network"`
	Type           EventType  `json:"type"`
	Action         ActionType `json:"action"`
	Address        string     `json:"address"`
	Amount         string     `json:"amount"`
	Balance        string     `json:"balance"`
	Gas            string     `json:"gas"`
	Hash           string     `json:"hash"`
	Price          string     `json:"price"`
	ReceivedAt     uint64     `json:"received_at"`
	RewardsAllTime string     `json:"rewards_all_time"`
	StakingFees    string     `json:"staking_fees"`
}

type BlockEvents struct {
	TxEvents         []*EthereumEvent
	Actions          []*Action
	EventsPartition  Partition
	ActionsPartition Partition
}

func (a ActionType) String() string {
	switch a {
	case StakeDeposit:
		return "stake_deposit"
	case StakeRebalance:
		return "stake_rebalance"
	case WithdrawalInitiated:
		return "withdrawal_initiated"
	case WithdrawalFullfilled:
		return "withdrawal_fullfilled"
	case Received:
		return "received"
	case Sent:
		return "sent"
	default:
		return ""
	}
}

func (et EventType) String() string {
	switch et {
	case Block:
		return "block"
	case Transaction:
		return "transaction"
	case Wallet:
		return "wallet"
	case Stake:
		return "stake"
	default:
		return ""
	}
}

func (tx TxDirection) String() string {
	switch tx {
	case Outgoing:
		return "outgoing"
	case Incoming:
		return "incoming"
	default:
		return ""
	}
}

func NDJSON[T EthereumEvent | Action](events []*T) (*bytes.Buffer, error) {
	var buf bytes.Buffer

	for _, ev := range events {
		txj, err := json.Marshal(ev)
		if err != nil {
			return nil, fmt.Errorf("failed to encode JSON: %v", err)
		}
		buf.Write(txj)
		buf.WriteString("\n")
	}

	return &buf, nil
}
