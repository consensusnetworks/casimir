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

// EventLogs queries for all contract events starting from the  StartBlock (when contract was deployed)
// and decodes (unpack) the logs using the ABI
func (cs *ContractService) EventLogs() (*[]Event, error) {
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

	events, err := cs.ParseLogs(logs)

	if err != nil {
		return nil, err
	}

	return events, nil
}

// FilterLogs parses the raw logs based on the event type (topic[0]).
// To find all the parse methods in the manager use: grep -E '^\s*func.*Parse.*{' ./casimir_manager.go
func (cs ContractService) ParseLogs(logs []types.Log) (*[]Event, error) {
	// var events []Event

	for _, l := range logs {
		event, err := cs.ABI.EventByID(l.Topics[0])

		if err != nil {
			return nil, err
		}

		switch event.Name {
		case "CompletedExitReportsRequested":
			req, err := cs.Caller.ParseCompletedExitReportsRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, "count:", req.Count)

		case "DepositActivated":
			req, err := cs.Caller.ParseDepositActivated(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", pool_id:", req.PoolId)
			fmt.Println("---")

		case "DepositInitiated":
			req, err := cs.Caller.ParseDepositInitiated(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", pool_id:", req.PoolId)
			fmt.Println("---")

		case "DepositRequested":
			req, err := cs.Caller.ParseDepositRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", pool_id:", req.PoolId)
			fmt.Println("---")

		case "ExitCompleted":
			req, err := cs.Caller.ParseExitCompleted(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, "pool_id:", req.PoolId)

		case "ExitRequested":
			req, err := cs.Caller.ParseExitRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, "pool_id:", req.PoolId)

		case "ForcedExitReportsRequested":
			req, err := cs.Caller.ParseForcedExitReportsRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, "count:", req.Count)
		case "OwnershipTransferred":
			req, err := cs.Caller.ParseOwnershipTransferred(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", new_owner:", req.NewOwner)
			fmt.Println("---")

		case "ReshareCompleted":
			req, err := cs.Caller.ParseReshareCompleted(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", pool_id:", req.PoolId)
			fmt.Println("---")

		case "ResharesRequested":
			req, err := cs.Caller.ParseResharesRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", operator_id:", req.OperatorId)
			fmt.Println("---")
		case "RewardsDeposited":
			req, err := cs.Caller.ParseRewardsDeposited(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", amount:", req.Amount)
			fmt.Println("---")

		case "SlashedExitReportsRequested":
			req, err := cs.Caller.ParseSlashedExitReportsRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", count:", req.Count)
			fmt.Println("---")

		case "StakeDeposited":
			deposit, err := cs.Caller.ParseStakeDeposited(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", sender", deposit.Sender, ", amount:", deposit.Amount)
			fmt.Println("---")
		case "StakeRebalanced":
			req, err := cs.Caller.ParseStakeRebalanced(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", amount:", req.Amount)
			fmt.Println("---")

		case "TipsDeposited":
			req, err := cs.Caller.ParseTipsDeposited(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", amount:", req.Amount)
			fmt.Println("---")
		case "WithdrawalInitiated":
			req, err := cs.Caller.ParseWithdrawalInitiated(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", sender", req.Sender, ", amount:", req.Amount)

		case "WithdrawalRequested":
			req, err := cs.Caller.ParseWithdrawalRequested(l)

			if err != nil {
				return nil, err
			}

			fmt.Println("event:", event.Name, ", sender", req.Sender, ", amount:", req.Amount)
		default:
			fmt.Println("unknown event:", event.Name)
		}
	}

	return nil, nil
}
