package main

type TxDirection int
type OperationType int

const (
	Outgoing TxDirection = iota
	Incoming
)

type Chain struct {
	Name    ChainType
	Network NetworkType
}

type Event struct {
	Chain            ChainType    `json:"chain" parquet:"name=chain, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Network          NetworkType  `json:"network" parquet:"name=network, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Provider         ProviderType `json:"provider" parquet:"name=provider, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Type             EventType    `json:"type" parquet:"name=type, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Height           int64        `json:"height" parquet:"name=height, type=INT64"`
	Block            string       `json:"block" parquet:"name=block, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Transaction      string       `json:"transaction" parquet:"name=transaction, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	ReceivedAt       string       `json:"received_at" parquet:"name=received_at, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Sender           string       `json:"sender" parquet:"name=sender, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Recipient        string       `json:"recipient" parquet:"name=recipient, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Amount           string       `json:"amount" parquet:"name=amount, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Price            float64      `json:"price" parquet:"name=price, type=DOUBLE"`
	SenderBalance    string       `json:"sender_balance" parquet:"name=sender_balance, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	RecipientBalance string       `json:"recipient_balance" parquet:"name=recipient_balance, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	GasFee           string       `json:"gas_fee" parquet:"name=gas_fee, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
}

type Wallet struct {
	Id         string      `json:"id" parquet:"name=id, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Address    string      `json:"address" parquet:"name=address, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Balance    string      `json:"balance" parquet:"name=balance, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	ReceivedAt string      `json:"received_at" parquet:"name=received_at, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Amount     string      `json:"amount" parquet:"name=amount, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Price      float64     `json:"price" parquet:"name=price, type=DOUBLE"`
	GasFee     string      `json:"gas_fee" parquet:"name=gas_fee, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	Direction  TxDirection `json:"direction" parquet:"name=direction, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
}

type StakingAction struct {
	WalletAddress    string `json:"wallet_address" parquet:"name=wallet_address, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	StakeDeposit     int64  `json:"stake_deposit" parquet:"name=stake_deposit, type=INT64"`
	CreatedAt        string `json:"created_at" parquet:"name=created_at, type=BYTE_ARRAY, convertedtype=UTF8, encoding=PLAIN_DICTIONARY"`
	StakeRebalance   int64  `json:"stake_rebalance" parquet:"name=stake_rebalance, type=INT64"`
	WithdrawalAmount int64  `json:"withdrawal_amount" parquet:"name=withdrawal_amount, type=INT64"`
	DistributeReward int64  `json:"distribute_reward" parquet:"name=distribute_reward, type=INT64"`
}
