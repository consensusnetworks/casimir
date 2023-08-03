package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type EthereumStreamer struct {
	*Logger
	*EthereumService
	Glue    *GlueService
	S3      *S3Service
	Wg      *sync.WaitGroup
	Sema    chan struct{}
	Head    int64
	Version int
	Begin   time.Time
	Elapsed time.Duration
	Fork    bool
	Env     Environment
}

func NewEthereumStreamer(scnfg Config) (*EthereumStreamer, error) {
	logger, err := NewConsoleLogger()

	if err != nil {
		return nil, err
	}

	l := logger.Sugar()

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

	err = glue.Introspect(scnfg.Env)

	if err != nil {
		l.Infof("FailedToIntrospectGlue: %s", err.Error())
		return nil, err
	}

	s3, err := NewS3Service(config)

	if err != nil {
		l.Infof("FailedToCreateS3Client: %s", err.Error())
		return nil, err
	}

	srvc := &EthereumStreamer{
		Logger: logger,
		Glue:   glue,
		Wg:     &sync.WaitGroup{},
		S3:     s3,
		Begin:  time.Now(),
		Fork:   scnfg.Fork,
		Env:    scnfg.Env,
	}

	// if dev then use localhost fork
	// if scnfg.Fork && scnfg.Env == Dev {
	// 	url := "ws://localhost:8545"

	// 	l.Infof("ConnectingToEthereumNode: %s", url)

	// 	eths, err := NewEthereumService(url)

	// 	if err != nil {
	// 		l.Infof("FailedToCreateEthereumClient: %s", err.Error())
	// 		return nil, err
	// 	}

	// 	head, err := eths.Client.BlockNumber(context.Background())

	// 	if err != nil {
	// 		l.Infof("FailedToGetBlockNumber: %s", err.Error())
	// 		return nil, err
	// 	}

	// 	srvc.Head = int64(head)

	// 	srvc.EthereumService = eths
	// 	return srvc, nil
	// }

	l.Infof("ConnectingToEthereumNode: %s", "wss://nodes.casimir.co/eth/hardhat")

	eths, err := NewEthereumService("wss://nodes.casimir.co/eth/hardhat")

	if err != nil {
		l.Infof("FailedToCreateEthereumClient: %s", err.Error())
		return nil, err
	}

	head, err := eths.Client.BlockNumber(context.Background())

	if err != nil {
		l.Infof("FailedToGetBlockNumber: %s", err.Error())
		return nil, err
	}

	srvc.Head = int64(head)
	srvc.EthereumService = eths

	return srvc, nil
}

func (s *EthereumStreamer) Stream() error {
	l := s.Logger.Sugar()

	if s.Fork {
		l.Infof("Streaming Forked Ethereum Network from %d", s.Head)

		key := fmt.Sprintf("%s/%s/%s", Ethereum, s.Network, "contracts")

		objs, err := s.S3.ListObjects(s.Glue.EventMeta.Bucket, key)

		if err != nil {
			l.Infof("FailedToListObjects: %s", err.Error())
			return err
		}

		if len(*objs) != 0 {
			l.Infof("Found stale contract data from bucket, removing all previous contract data from %s", fmt.Sprintf("s3://%s/%s", s.Glue.EventMeta.Bucket, key))
			// TODO: remove previous contract data from s3
		} else {
			l.Infof("No stale contract data found in bucket (fresh run)")
		}
		return nil
	}

	// query := ethereum.FilterQuery{
	// 	Addresses: []common.Address{
	// 		common.HexToAddress("0x07e05700cb4e946ba50244e27f01805354cd8ef0"),
	// 	},
	// }

	// logs, err := s.Client.FilterLogs(context.Background(), query)

	// if err != nil {
	// 	l.Infof("FailedToGetLogs: %s", err.Error())
	// 	return err
	// }

	// if len(logs) == 0 {
	// 	l.Infof("NoLogsFound")
	// }

	// for _, vLog := range logs {
	// 	l.Infof("Log: %s", vLog.Address)
	// 	blockNum := vLog.BlockNumber
	// 	a := vLog.Topics

	// 	l.Infof("BlockNumber: %d", blockNum)
	// 	l.Infof("Topics: %s", a)
	// }

	return nil
}

// func (s *EthereumStreamer) SaveBlock(block int64, tx *[]Event, wallet *[]WalletEvent) error {
// 	l := s.Logger.Sugar()

// 	if len(*tx) != 0 {
// 		err := s.SaveTxEvents(block, tx)

// 		if err != nil {
// 			l.Infof("FailedToSaveTxEvents: " + err.Error())
// 			return err
// 		}
// 	}

// 	if len(*wallet) != 0 {
// 		err := s.SaveWalletEvents(block, wallet)

// 		if err != nil {
// 			l.Infof("FailedToSaveWalletEvents: %s", err.Error())
// 			return err
// 		}

// 	}

// 	l.Infof("SavedBlock: %d", block)
// 	return nil
// }

// func (s *EthereumStreamer) SaveTxEvents(block int64, tx *[]Event) error {
// 	l := s.Logger.Sugar()
// 	var txEvents bytes.Buffer

// 	for _, e := range *tx {
// 		b, err := json.Marshal(e)

// 		if err != nil {
// 			l.Errorf("MarshallError: %s", err.Error())
// 			return err
// 		}

// 		txEvents.Write(b)
// 		txEvents.WriteByte('\n')

// 	}

// 	if s.EventBucket[len(s.EventBucket)-1] == '/' {
// 		s.EventBucket = s.EventBucket[:len(s.EventBucket)-1]
// 	}

// 	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), s.Network.String(), block)

// 	err := s.S3.UploadBytes(s.EventBucket, dest, &txEvents)

// 	if err != nil {
// 		l.Infof("FailedToUpload: %s", err.Error())
// 		return err
// 	}

// 	return nil
// }

// func (s *EthereumStreamer) SaveWalletEvents(block int64, wallet *[]WalletEvent) error {
// 	l := s.Logger.Sugar()

// 	var walletEvents bytes.Buffer

// 	for _, e := range *wallet {
// 		b, err := json.Marshal(e)

// 		if err != nil {
// 			l.Infof("MarshallError: %s", err.Error())
// 			return err
// 		}

// 		walletEvents.Write(b)
// 		walletEvents.WriteByte('\n')
// 	}

// 	if s.WalletBucket[len(s.WalletBucket)-1] == '/' {
// 		s.WalletBucket = s.WalletBucket[:len(s.WalletBucket)-1]
// 	}

// 	dest := fmt.Sprintf("%s/%s/block=%d.ndjson", Ethereum.String(), s.Network.String(), block)

// 	err := s.S3.UploadBytes(s.WalletBucket, dest, &walletEvents)

// 	if err != nil {
// 		l.Infof("FailedToUpload: %s", err.Error())
// 		return err
// 	}

// 	return nil
// }

// func (c *EthereumStreamer) ProcessBlock(height int64) (*[]Event, *[]WalletEvent, error) {
// 	l := c.Logger.Sugar()

// 	tx, wallet, err := c.BlockEvents(height)

// 	if err != nil {
// 		l.Infof("FailedToGetBlockEvents: block=%d error=%s", height, err.Error())
// 		return nil, nil, err
// 	}

// 	return tx, wallet, nil
// }

// // BlockEvents returns all events for a given block
// func (s *EthereumStreamer) BlockEvents(height int64) (*[]Event, *[]WalletEvent, error) {
// 	l := s.Logger.Sugar()

// 	var txEvents []Event
// 	var walletEvents []WalletEvent

// 	b, err := s.Client.BlockByNumber(context.Background(), big.NewInt(height))

// 	if err != nil {
// 		l.Infof("FailedToGetBlock: %s", err.Error())
// 		return nil, nil, err
// 	}

// 	blockEvent := Event{
// 		Chain:      Ethereum,
// 		Network:    s.Network,
// 		Provider:   Casimir,
// 		Type:       Block,
// 		Height:     int64(b.Number().Uint64()),
// 		Block:      b.Hash().Hex(),
// 		ReceivedAt: time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
// 	}

// 	txEvents = append(txEvents, blockEvent)

// 	for index, tx := range b.Transactions() {
// 		receipt, err := s.Client.TransactionReceipt(context.Background(), tx.Hash())

// 		if err != nil {
// 			l.Infof("FailedToGetTransactionReceipt: %s", err.Error())
// 			return nil, nil, err
// 		}

// 		// l.Infof("ProcessingTransaction: Transaction %d of %d", index+1, len(b.Transactions()))

// 		txEvent := Event{
// 			Chain:       Ethereum,
// 			Network:     s.Network,
// 			Provider:    Casimir,
// 			Block:       b.Hash().Hex(),
// 			Type:        Transaction,
// 			Height:      int64(b.Number().Uint64()),
// 			Transaction: tx.Hash().Hex(),
// 			ReceivedAt:  time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
// 		}

// 		if tx.Value() != nil {
// 			txEvent.Amount = tx.Value().String()
// 		}

// 		txEvent.GasFee = new(big.Int).Mul(tx.GasPrice(), big.NewInt(int64(receipt.GasUsed))).String()

// 		if tx.To() != nil {
// 			txEvent.Recipient = tx.To().Hex()
// 			recipeintBalance, err := s.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

// 			if err != nil {
// 				l.Infof("FailedToGetBalanceAt: %s", err.Error())
// 				return nil, nil, err
// 			}

// 			txEvent.RecipientBalance = recipeintBalance.String()
// 		}

// 		sender, err := s.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

// 		if err != nil {
// 			l.Infof("FailedToGetTransactionSender: %s", err.Error())
// 			return nil, nil, err
// 		}

// 		if sender.Hex() != "" {
// 			txEvent.Sender = sender.Hex()

// 			senderBalance, err := s.Client.BalanceAt(context.Background(), sender, b.Number())

// 			if err != nil {
// 				l.Infof("FailedToGetBalanceAt: %s", err.Error())
// 				return nil, nil, err
// 			}

// 			txEvent.SenderBalance = senderBalance.String()
// 		}

// 		txEvents = append(txEvents, txEvent)

// 		senderWalletEvent := WalletEvent{
// 			WalletAddress: txEvent.Sender,
// 			Balance:       txEvent.SenderBalance,
// 			Direction:     Outgoing,
// 			TxId:          txEvent.Transaction,
// 			ReceivedAt:    txEvent.ReceivedAt,
// 			Amount:        txEvent.Amount,
// 			Price:         txEvent.Price,
// 			GasFee:        txEvent.GasFee,
// 		}

// 		walletEvents = append(walletEvents, senderWalletEvent)

// 		receiptWalletEvent := WalletEvent{
// 			WalletAddress: txEvent.Recipient,
// 			Balance:       txEvent.RecipientBalance,
// 			Direction:     Incoming,
// 			TxId:          txEvent.Transaction,
// 			ReceivedAt:    txEvent.ReceivedAt,
// 			Amount:        txEvent.Amount,
// 			Price:         txEvent.Price,
// 			GasFee:        txEvent.GasFee,
// 		}

// 		walletEvents = append(walletEvents, receiptWalletEvent)

// 		if !s.Local {
// 			continue
// 		}
// 		// TODO: handle contract events (staking action)
// 	}

// 	// don't stop processing we will retry later (-1 because the txEvent includes the block event)
// 	if len(txEvents) != 0 && len(walletEvents) != 0 && len(walletEvents) != (len(txEvents)-1)*2 {
// 		l.Errorf("TxWalletEventsMismatch: wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
// 	}

// 	return &txEvents, &walletEvents, nil
// }

// func (s *EthereumStreamer) EventsFromTransaction(b *types.Block, receipt *types.Receipt) ([]*Event, []*WalletEvent, error) {
// 	var txEvents []*Event
// 	var walletEvents []*WalletEvent

// 	l := s.Logger.Sugar()

// 	for index, tx := range b.Transactions() {
// 		txEvent := Event{
// 			Chain:       Ethereum,
// 			Network:     s.Network,
// 			Provider:    Casimir,
// 			Block:       b.Hash().Hex(),
// 			Type:        Transaction,
// 			Height:      int64(b.Number().Uint64()),
// 			Transaction: tx.Hash().Hex(),
// 			ReceivedAt:  time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
// 		}

// 		if tx.Value() != nil {
// 			txEvent.Amount = tx.Value().String()
// 		}

// 		txEvent.GasFee = new(big.Int).Mul(tx.GasPrice(), big.NewInt(int64(receipt.GasUsed))).String()

// 		if tx.To() != nil {
// 			txEvent.Recipient = tx.To().Hex()
// 			recipeintBalance, err := s.Client.BalanceAt(context.Background(), *tx.To(), b.Number())

// 			if err != nil {
// 				return nil, nil, err
// 			}

// 			txEvent.RecipientBalance = recipeintBalance.String()
// 		}

// 		sender, err := s.Client.TransactionSender(context.Background(), tx, b.Hash(), uint(index))

// 		if err != nil {
// 			return nil, nil, err
// 		}

// 		if sender.Hex() != "" {
// 			txEvent.Sender = sender.Hex()

// 			senderBalance, err := s.Client.BalanceAt(context.Background(), sender, b.Number())

// 			if err != nil {
// 				return nil, nil, err
// 			}

// 			txEvent.SenderBalance = senderBalance.String()
// 		}

// 		txEvents = append(txEvents, &txEvent)

// 		senderWalletEvent := WalletEvent{
// 			WalletAddress: txEvent.Sender,
// 			Balance:       txEvent.SenderBalance,
// 			Direction:     Outgoing,
// 			TxId:          txEvent.Transaction,
// 			ReceivedAt:    txEvent.ReceivedAt,
// 			Amount:        txEvent.Amount,
// 			Price:         txEvent.Price,
// 			GasFee:        txEvent.GasFee,
// 		}

// 		walletEvents = append(walletEvents, &senderWalletEvent)

// 		receiptWalletEvent := WalletEvent{
// 			WalletAddress: txEvent.Recipient,
// 			Balance:       txEvent.RecipientBalance,
// 			Direction:     Incoming,
// 			TxId:          txEvent.Transaction,
// 			ReceivedAt:    txEvent.ReceivedAt,
// 			Amount:        txEvent.Amount,
// 			Price:         txEvent.Price,
// 			GasFee:        txEvent.GasFee,
// 		}
// 		walletEvents = append(walletEvents, &receiptWalletEvent)
// 		// TODO: handle contract events (staking action)
// 	}

// 	// don't stop processing we will retry later (-1 because the txEvent includes the block event)
// 	if len(txEvents) != 0 && len(walletEvents) != 0 && len(walletEvents) != (len(txEvents)-1)*2 {
// 		l.Errorf("TxWalletEventsMismatch: wallet events=%d tx events=%d", len(walletEvents), len(txEvents))
// 	}

// 	return txEvents, walletEvents, nil
// }

// func (s *EthereumStreamer) BlockEvent(b *types.Block) (*Event, error) {
// 	event := Event{
// 		Chain:      Ethereum,
// 		Network:    s.Network,
// 		Provider:   Casimir,
// 		Type:       Block,
// 		Height:     int64(b.Number().Uint64()),
// 		Block:      b.Hash().Hex(),
// 		ReceivedAt: time.Unix(int64(b.Time()), 0).Format("2006-01-02 15:04:05.999999999"),
// 	}
// 	return &event, nil
// }
