package main

import (
	"context"
	"fmt"
	"math/big"
	"strings"
	"time"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// ContractService handles all calls and operations with the deployed Casimir contract
type ContractService struct {
	Caller         *Main // includes the tx and filterer
	CasimirManager common.Address
	ABI            abi.ABI
	Eths           *EthereumService
	StartBlock     uint64 // the block when the contract was deployed
	Timeout        time.Duration
}

// NewContractService calls the generated contract code and binds the passed Ethereum client
func NewContractService(eths *EthereumService) (*ContractService, error) {
	abi, err := abi.JSON(strings.NewReader(MainMetaData.ABI))

	if err != nil {
		return nil, err
	}

	// local
	casimirManager := common.HexToAddress("0xfCd243D10C7E578a01FC8b7E0cFA64bC6d98c254")

	caller, err := NewMain(casimirManager, eths.Client)

	if err != nil {
		return nil, err
	}

	cs := ContractService{
		CasimirManager: casimirManager,
		StartBlock:     uint64(9602550),
		ABI:            abi,
		Caller:         caller,
		Eths:           eths,
		Timeout:        3 * time.Second,
	}

	if !cs.IsLive() {
		return nil, fmt.Errorf("it seems like the contract code is not deployed at %s", casimirManager.Hex())
	}

	return &cs, nil
}

// IsLive pings the contract before moving forward with any calls
func (cs *ContractService) IsLive() bool {
	_, err := cs.Caller.LatestActiveBalance(&bind.CallOpts{})
	return err == nil
}

func (cs *ContractService) GetUserStake(addr common.Address) (*big.Int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), cs.Timeout)

	defer cancel()

	opts := &bind.CallOpts{
		Context: ctx,
	}

	total, err := cs.Caller.GetUserStake(opts, addr)

	if err != nil {
		return nil, err
	}

	return total, nil
}

func (cs *ContractService) FilterLogs() ([]types.Log, error) {
	filter := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(cs.StartBlock)),
		Addresses: []common.Address{cs.CasimirManager},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	logs, err := cs.Eths.Client.FilterLogs(ctx, filter)

	if err != nil {
		return nil, err
	}

	return logs, nil
}

// to find all the parse methods in the manager use: grep -E '^\s*func.*Parse.*{' ./casimir_manager.go
func (cs ContractService) ParseLog(l types.Log) (interface{}, error) {
	event, err := cs.ABI.EventByID(l.Topics[0])

	if err != nil {
		return nil, err
	}

	switch event.Name {
	case "CompletedExitReportsRequested":
		l, err := cs.Caller.ParseCompletedExitReportsRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil

	case "DepositActivated":
		l, err := cs.Caller.ParseDepositActivated(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "DepositInitiated":
		l, err := cs.Caller.ParseDepositInitiated(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "DepositRequested":
		l, err := cs.Caller.ParseDepositRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ExitCompleted":
		l, err := cs.Caller.ParseExitCompleted(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ExitRequested":
		l, err := cs.Caller.ParseExitRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ForcedExitReportsRequested":
		l, err := cs.Caller.ParseForcedExitReportsRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "OwnershipTransferred":
		l, err := cs.Caller.ParseOwnershipTransferred(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ReshareCompleted":
		l, err := cs.Caller.ParseReshareCompleted(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "ResharesRequested":
		l, err := cs.Caller.ParseResharesRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "RewardsDeposited":
		l, err := cs.Caller.ParseRewardsDeposited(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "SlashedExitReportsRequested":
		l, err := cs.Caller.ParseSlashedExitReportsRequested(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "StakeDeposited":
		l, err := cs.Caller.ParseStakeDeposited(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "StakeRebalanced":
		l, err := cs.Caller.ParseStakeRebalanced(l)

		if err != nil {
			return nil, err
		}

		return l, nil
	case "TipsDeposited":
		l, err := cs.Caller.ParseTipsDeposited(l)

		if err != nil {
			return nil, err
		}
		return l, nil
	case "WithdrawalInitiated":
		l, err := cs.Caller.ParseWithdrawalInitiated(l)

		if err != nil {
			return nil, err
		}
		return l, nil
	case "WithdrawalRequested":
		l, err := cs.Caller.ParseWithdrawalRequested(l)

		if err != nil {
			return nil, err
		}
		return l, nil
	default:
		return nil, fmt.Errorf("unknown event: %s", event.Name)
	}
}
