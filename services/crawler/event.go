package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

type EventType string
type TxDirection string

const (
	Block       EventType = "block"
	Transaction EventType = "transaction"
	Contract    EventType = "contract"

	Outgoing TxDirection = "outgoing"
	Incoming TxDirection = "incoming"
)

type BlockConfig struct {
	Chain           ChainType    `json:"chain"`
	Network         NetworkType  `json:"network"`
	Provider        ProviderType `json:"provider"`
	Height          int64        `json:"height"`
	Forked          bool         `json:"forked"`
	ContractAddress string       `json:"contract_address"`
}

type Event struct {
	Chain            ChainType    `json:"chain"`
	Network          NetworkType  `json:"network"`
	Provider         ProviderType `json:"provider"`
	Type             EventType    `json:"type"`
	Height           int64        `json:"height"`
	Block            string       `json:"block"`
	Transaction      string       `json:"transaction"`
	ReceivedAt       string       `json:"received_at"`
	Sender           string       `json:"sender" `
	Recipient        string       `json:"recipient"`
	SenderBalance    string       `json:"sender_balance"`
	RecipientBalance string       `json:"recipient_balance"`
	Amount           string       `json:"amount"`
	Price            float64      `json:"price"`
	GasFee           string       `json:"gas_fee"`
}

type Wallet struct {
	WalletAddress string      `json:"wallet_address"`
	Balance       string      `json:"wallet_balance"`
	Direction     TxDirection `json:"tx_direction"`
	TxId          string      `json:"tx_id"`
	ReceivedAt    string      `json:"received_at"`
	Amount        string      `json:"amount"`
	Price         float64     `json:"price"`
	GasFee        string      `json:"gas_fee"`
}

type StakingAction struct {
	WalletAddress    string `json:"wallet_address"`
	StakeDeposit     int64  `json:"stake_deposit"`
	CreatedAt        string `json:"created_at"`
	StakeRebalance   int64  `json:"stake_rebalance"`
	WithdrawalAmount int64  `json:"withdrawal_amount"`
	DistributeReward int64  `json:"distribute_reward"`
}

type CasimirManager struct {
	Format                 string         `json:"_format,omitempty"`
	ContractName           string         `json:"contractName,omitempty"`
	SourceName             string         `json:"sourceName,omitempty"`
	ABI                    []ABI          `json:"abi,omitempty"`
	Bytecode               string         `json:"bytecode,omitempty"`
	DeployedBytecode       string         `json:"deployedBytecode,omitempty"`
	LinkReferences         LinkReferences `json:"linkReferences,omitempty"`
	DeployedLinkReferences LinkReferences `json:"deployedLinkReferences,omitempty"`
}

type ABI struct {
	Inputs          []Input       `json:"inputs,omitempty"`
	StateMutability string        `json:"stateMutability,omitempty"`
	Type            string        `json:"type,omitempty"`
	Anonymous       bool          `json:"anonymous,omitempty"`
	Name            string        `json:"name,omitempty"`
	Outputs         []interface{} `json:"outputs,omitempty"`
}

type Input struct {
	InternalType string `json:"internalType,omitempty"`
	Name         string `json:"name,omitempty"`
	Type         string `json:"type,omitempty"`
}

type LinkReferences struct{}

type BlockEventsResult struct {
	Events        []Event         `json:"events"`
	Wallets       []Wallet        `json:"wallets"`
	StakingAction []StakingAction `json:"staking_action"`
}

func GetBlockEvents(bcnfg BlockConfig, client *ethclient.Client) (*BlockEventsResult, error) {
	txs := []Event{}
	wallets := []Wallet{}

	b, err := client.BlockByNumber(context.Background(), big.NewInt(bcnfg.Height))

	if err != nil {
		return nil, err
	}

	blockEvent := &Event{
		Chain:      bcnfg.Chain,
		Network:    bcnfg.Network,
		Provider:   Casimir,
		Type:       Block,
		Height:     int64(b.Number().Uint64()),
		Block:      b.Hash().Hex(),
		ReceivedAt: time.Unix(int64(b.Time()), 0).Format(AWSAthenaTimeFormat),
	}

	txs = append(txs, *blockEvent)

	for index, tx := range b.Transactions() {
		receipt, err := client.TransactionReceipt(context.Background(), tx.Hash())

		if err != nil {
			return nil, err
		}

		txEvent := Event{
			Chain:       bcnfg.Chain,
			Network:     bcnfg.Network,
			Provider:    Casimir,
			Block:       b.Hash().Hex(),
			Type:        Transaction,
			Height:      int64(b.Number().Uint64()),
			Transaction: tx.Hash().Hex(),
			ReceivedAt:  time.Unix(int64(b.Time()), 0).Format(AWSAthenaTimeFormat),
		}

		if tx.Value() != nil {
			txEvent.Amount = tx.Value().String()
		}

		txEvent.GasFee = new(big.Int).Mul(tx.GasPrice(), big.NewInt(int64(receipt.GasUsed))).String()

		if tx.To() != nil {
			txEvent.Recipient = tx.To().Hex()
			recipeintBalance, err := client.BalanceAt(context.Background(), *tx.To(), b.Number())

			if err != nil {
				return nil, err
			}

			txEvent.RecipientBalance = recipeintBalance.String()
		}

		sender, err := client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

		if err != nil {
			return nil, err
		}

		if sender.Hex() != "" {
			txEvent.Sender = sender.Hex()
			senderBalance, err := client.BalanceAt(context.Background(), sender, b.Number())

			if err != nil {
				return nil, err
			}

			txEvent.SenderBalance = senderBalance.String()
		}

		txs = append(txs, txEvent)

		senderWalletEvent := Wallet{
			WalletAddress: txEvent.Sender,
			Balance:       txEvent.SenderBalance,
			Direction:     Outgoing,
			TxId:          txEvent.Transaction,
			ReceivedAt:    txEvent.ReceivedAt,
			Amount:        txEvent.Amount,
			Price:         txEvent.Price,
			GasFee:        txEvent.GasFee,
		}

		receiptWalletEvent := Wallet{
			WalletAddress: txEvent.Recipient,
			Balance:       txEvent.RecipientBalance,
			Direction:     Incoming,
			TxId:          txEvent.Transaction,
			ReceivedAt:    txEvent.ReceivedAt,
			Amount:        txEvent.Amount,
			Price:         txEvent.Price,
			GasFee:        txEvent.GasFee,
		}

		wallets = append(wallets, senderWalletEvent, receiptWalletEvent)

		// check for staking action conrtact
		if bcnfg.Forked {

		}
	}

	if len(txs) != 0 && len(wallets) != 0 && len(wallets) != (len(txs)-1)*2 {
		return nil, fmt.Errorf("txs and wallets length mismatch")
	}

	return &BlockEventsResult{
		Events:        txs,
		Wallets:       wallets,
		StakingAction: []StakingAction{},
	}, nil
}

func EventNDJSON(txs []Event) (*bytes.Buffer, error) {
	var buf bytes.Buffer

	enc := json.NewEncoder(&buf)
	enc.SetIndent("", "")

	for _, tx := range txs {
		if err := enc.Encode(tx); err != nil {
			return nil, fmt.Errorf("failed to encode wallet to JSON: %v", err)
		}
		buf.WriteString("\n")
	}

	return &buf, nil
}

func WalletNDJSON(txs []Wallet) (*bytes.Buffer, error) {
	var buf bytes.Buffer

	enc := json.NewEncoder(&buf)
	enc.SetIndent("", "")

	for _, tx := range txs {
		if err := enc.Encode(tx); err != nil {
			return nil, fmt.Errorf("failed to encode wallet to JSON: %v", err)
		}
		buf.WriteString("\n")
	}

	return &buf, nil
}
