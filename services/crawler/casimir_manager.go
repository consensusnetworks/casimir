// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package main

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
)

// ISSVNetworkCoreCluster is an auto generated low-level Go binding around an user-defined struct.
type ISSVNetworkCoreCluster struct {
	ValidatorCount  uint32
	NetworkFeeIndex uint64
	Index           uint64
	Balance         *big.Int
	Active          bool
}

// MainMetaData contains all meta data concerning the Main contract.
var MainMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_oracleAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"beaconDepositAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"linkFunctionsAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"linkRegistrarAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"linkRegistryAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"linkTokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"ssvNetworkAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"ssvNetworkViewsAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"ssvTokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"swapFactoryAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"swapRouterAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"wethTokenAddress\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"CompletedExitReportsRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"DepositActivated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"DepositInitiated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"DepositRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"ExitCompleted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"ExitRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"ForcedExitReportsRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"ReshareCompleted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint64\",\"name\":\"operatorId\",\"type\":\"uint64\"}],\"name\":\"ResharesRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"RewardsDeposited\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"SlashedExitReportsRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"StakeDeposited\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"StakeRebalanced\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"TipsDeposited\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"WithdrawalInitiated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"WithdrawalRequested\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"activateDeposits\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint32[5]\",\"name\":\"poolIds\",\"type\":\"uint32[5]\"}],\"name\":\"compoundRewards\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64[]\",\"name\":\"operatorIds\",\"type\":\"uint64[]\"},{\"components\":[{\"internalType\":\"uint32\",\"name\":\"validatorCount\",\"type\":\"uint32\"},{\"internalType\":\"uint64\",\"name\":\"networkFeeIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"index\",\"type\":\"uint64\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"active\",\"type\":\"bool\"}],\"internalType\":\"structISSVNetworkCore.Cluster\",\"name\":\"cluster\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"feeAmount\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"processed\",\"type\":\"bool\"}],\"name\":\"depositClusterBalance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"depositExitedBalance\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"depositRecoveredBalance\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"depositReservedFees\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"depositRewards\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"depositStake\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"feeAmount\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"processed\",\"type\":\"bool\"}],\"name\":\"depositUpkeepBalance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"feePercent\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"finalizableCompletedExits\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"fulfillWithdrawals\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getBufferedBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"bufferedBalance\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getExpectedEffectiveBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"expectedEffectiveBalance\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getPendingPoolIds\",\"outputs\":[{\"internalType\":\"uint32[]\",\"name\":\"\",\"type\":\"uint32[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"period\",\"type\":\"uint256\"}],\"name\":\"getPendingWithdrawalEligibility\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"pendingWithdrawalEligibility\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"}],\"name\":\"getPoolAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getReadyBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"readyBalance\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getReadyPoolIds\",\"outputs\":[{\"internalType\":\"uint32[]\",\"name\":\"\",\"type\":\"uint32[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getRegistryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"registryAddress\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getReservedFeeBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getStakedPoolIds\",\"outputs\":[{\"internalType\":\"uint32[]\",\"name\":\"\",\"type\":\"uint32[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getTotalStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"totalStake\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getUpkeepAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"upkeepAddress\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getUpkeepBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"upkeepBalance\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"userAddress\",\"type\":\"address\"}],\"name\":\"getUserStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"userStake\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getWithdrawableBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"depositDataRoot\",\"type\":\"bytes32\"},{\"internalType\":\"bytes\",\"name\":\"publicKey\",\"type\":\"bytes\"},{\"internalType\":\"bytes\",\"name\":\"signature\",\"type\":\"bytes\"},{\"internalType\":\"bytes\",\"name\":\"withdrawalCredentials\",\"type\":\"bytes\"},{\"internalType\":\"uint64[]\",\"name\":\"operatorIds\",\"type\":\"uint64[]\"},{\"internalType\":\"bytes\",\"name\":\"shares\",\"type\":\"bytes\"},{\"components\":[{\"internalType\":\"uint32\",\"name\":\"validatorCount\",\"type\":\"uint32\"},{\"internalType\":\"uint64\",\"name\":\"networkFeeIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"index\",\"type\":\"uint64\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"active\",\"type\":\"bool\"}],\"internalType\":\"structISSVNetworkCore.Cluster\",\"name\":\"cluster\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"feeAmount\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"processed\",\"type\":\"bool\"}],\"name\":\"initiateDeposit\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"latestActiveBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"activeBalance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sweptBalance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"activatedDeposits\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"completedExits\",\"type\":\"uint256\"}],\"name\":\"rebalanceStake\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"poolIndex\",\"type\":\"uint256\"},{\"internalType\":\"uint32[]\",\"name\":\"blamePercents\",\"type\":\"uint32[]\"},{\"components\":[{\"internalType\":\"uint32\",\"name\":\"validatorCount\",\"type\":\"uint32\"},{\"internalType\":\"uint64\",\"name\":\"networkFeeIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"index\",\"type\":\"uint64\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"active\",\"type\":\"bool\"}],\"internalType\":\"structISSVNetworkCore.Cluster\",\"name\":\"cluster\",\"type\":\"tuple\"}],\"name\":\"reportCompletedExit\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint32[]\",\"name\":\"poolIds\",\"type\":\"uint32[]\"}],\"name\":\"reportForcedExits\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"reportPeriod\",\"outputs\":[{\"internalType\":\"uint32\",\"name\":\"\",\"type\":\"uint32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint32\",\"name\":\"poolId\",\"type\":\"uint32\"},{\"internalType\":\"uint64[]\",\"name\":\"operatorIds\",\"type\":\"uint64[]\"},{\"internalType\":\"uint64[]\",\"name\":\"oldOperatorIds\",\"type\":\"uint64[]\"},{\"internalType\":\"uint64\",\"name\":\"newOperatorId\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"oldOperatorId\",\"type\":\"uint64\"},{\"internalType\":\"bytes\",\"name\":\"shares\",\"type\":\"bytes\"},{\"components\":[{\"internalType\":\"uint32\",\"name\":\"validatorCount\",\"type\":\"uint32\"},{\"internalType\":\"uint64\",\"name\":\"networkFeeIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"index\",\"type\":\"uint64\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"active\",\"type\":\"bool\"}],\"internalType\":\"structISSVNetworkCore.Cluster\",\"name\":\"cluster\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint32\",\"name\":\"validatorCount\",\"type\":\"uint32\"},{\"internalType\":\"uint64\",\"name\":\"networkFeeIndex\",\"type\":\"uint64\"},{\"internalType\":\"uint64\",\"name\":\"index\",\"type\":\"uint64\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"active\",\"type\":\"bool\"}],\"internalType\":\"structISSVNetworkCore.Cluster\",\"name\":\"oldCluster\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"feeAmount\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"processed\",\"type\":\"bool\"}],\"name\":\"reportReshare\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"requestCompletedExitReports\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"count\",\"type\":\"uint256\"}],\"name\":\"requestForcedExitReports\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint64\",\"name\":\"operatorId\",\"type\":\"uint64\"}],\"name\":\"requestReshares\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"requestWithdrawal\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"requestedExits\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"requestedWithdrawalBalance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"functionsAddress\",\"type\":\"address\"}],\"name\":\"setFunctionsAddress\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"upkeepId\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"withdrawLINKBalance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"withdrawReservedFees\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"withdrawSSVBalance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"withdrawUpkeepBalance\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"stateMutability\":\"payable\",\"type\":\"receive\"}]",
}

// MainABI is the input ABI used to generate the binding from.
// Deprecated: Use MainMetaData.ABI instead.
var MainABI = MainMetaData.ABI

// Main is an auto generated Go binding around an Ethereum contract.
type Main struct {
	MainCaller     // Read-only binding to the contract
	MainTransactor // Write-only binding to the contract
	MainFilterer   // Log filterer for contract events
}

// MainCaller is an auto generated read-only Go binding around an Ethereum contract.
type MainCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MainTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MainTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MainFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MainFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MainSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MainSession struct {
	Contract     *Main             // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MainCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MainCallerSession struct {
	Contract *MainCaller   // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// MainTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MainTransactorSession struct {
	Contract     *MainTransactor   // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MainRaw is an auto generated low-level Go binding around an Ethereum contract.
type MainRaw struct {
	Contract *Main // Generic contract binding to access the raw methods on
}

// MainCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MainCallerRaw struct {
	Contract *MainCaller // Generic read-only contract binding to access the raw methods on
}

// MainTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MainTransactorRaw struct {
	Contract *MainTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMain creates a new instance of Main, bound to a specific deployed contract.
func NewMain(address common.Address, backend bind.ContractBackend) (*Main, error) {
	contract, err := bindMain(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Main{MainCaller: MainCaller{contract: contract}, MainTransactor: MainTransactor{contract: contract}, MainFilterer: MainFilterer{contract: contract}}, nil
}

// NewMainCaller creates a new read-only instance of Main, bound to a specific deployed contract.
func NewMainCaller(address common.Address, caller bind.ContractCaller) (*MainCaller, error) {
	contract, err := bindMain(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MainCaller{contract: contract}, nil
}

// NewMainTransactor creates a new write-only instance of Main, bound to a specific deployed contract.
func NewMainTransactor(address common.Address, transactor bind.ContractTransactor) (*MainTransactor, error) {
	contract, err := bindMain(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MainTransactor{contract: contract}, nil
}

// NewMainFilterer creates a new log filterer instance of Main, bound to a specific deployed contract.
func NewMainFilterer(address common.Address, filterer bind.ContractFilterer) (*MainFilterer, error) {
	contract, err := bindMain(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MainFilterer{contract: contract}, nil
}

// bindMain binds a generic wrapper to an already deployed contract.
func bindMain(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(MainABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Main *MainRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Main.Contract.MainCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Main *MainRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.Contract.MainTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Main *MainRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Main.Contract.MainTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Main *MainCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Main.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Main *MainTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Main *MainTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Main.Contract.contract.Transact(opts, method, params...)
}

// FeePercent is a free data retrieval call binding the contract method 0x7fd6f15c.
//
// Solidity: function feePercent() view returns(uint32)
func (_Main *MainCaller) FeePercent(opts *bind.CallOpts) (uint32, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "feePercent")

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

// FeePercent is a free data retrieval call binding the contract method 0x7fd6f15c.
//
// Solidity: function feePercent() view returns(uint32)
func (_Main *MainSession) FeePercent() (uint32, error) {
	return _Main.Contract.FeePercent(&_Main.CallOpts)
}

// FeePercent is a free data retrieval call binding the contract method 0x7fd6f15c.
//
// Solidity: function feePercent() view returns(uint32)
func (_Main *MainCallerSession) FeePercent() (uint32, error) {
	return _Main.Contract.FeePercent(&_Main.CallOpts)
}

// FinalizableCompletedExits is a free data retrieval call binding the contract method 0xecd3fc9b.
//
// Solidity: function finalizableCompletedExits() view returns(uint256)
func (_Main *MainCaller) FinalizableCompletedExits(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "finalizableCompletedExits")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// FinalizableCompletedExits is a free data retrieval call binding the contract method 0xecd3fc9b.
//
// Solidity: function finalizableCompletedExits() view returns(uint256)
func (_Main *MainSession) FinalizableCompletedExits() (*big.Int, error) {
	return _Main.Contract.FinalizableCompletedExits(&_Main.CallOpts)
}

// FinalizableCompletedExits is a free data retrieval call binding the contract method 0xecd3fc9b.
//
// Solidity: function finalizableCompletedExits() view returns(uint256)
func (_Main *MainCallerSession) FinalizableCompletedExits() (*big.Int, error) {
	return _Main.Contract.FinalizableCompletedExits(&_Main.CallOpts)
}

// GetBufferedBalance is a free data retrieval call binding the contract method 0x80637015.
//
// Solidity: function getBufferedBalance() view returns(uint256 bufferedBalance)
func (_Main *MainCaller) GetBufferedBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getBufferedBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetBufferedBalance is a free data retrieval call binding the contract method 0x80637015.
//
// Solidity: function getBufferedBalance() view returns(uint256 bufferedBalance)
func (_Main *MainSession) GetBufferedBalance() (*big.Int, error) {
	return _Main.Contract.GetBufferedBalance(&_Main.CallOpts)
}

// GetBufferedBalance is a free data retrieval call binding the contract method 0x80637015.
//
// Solidity: function getBufferedBalance() view returns(uint256 bufferedBalance)
func (_Main *MainCallerSession) GetBufferedBalance() (*big.Int, error) {
	return _Main.Contract.GetBufferedBalance(&_Main.CallOpts)
}

// GetExpectedEffectiveBalance is a free data retrieval call binding the contract method 0xb39c18dd.
//
// Solidity: function getExpectedEffectiveBalance() view returns(uint256 expectedEffectiveBalance)
func (_Main *MainCaller) GetExpectedEffectiveBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getExpectedEffectiveBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetExpectedEffectiveBalance is a free data retrieval call binding the contract method 0xb39c18dd.
//
// Solidity: function getExpectedEffectiveBalance() view returns(uint256 expectedEffectiveBalance)
func (_Main *MainSession) GetExpectedEffectiveBalance() (*big.Int, error) {
	return _Main.Contract.GetExpectedEffectiveBalance(&_Main.CallOpts)
}

// GetExpectedEffectiveBalance is a free data retrieval call binding the contract method 0xb39c18dd.
//
// Solidity: function getExpectedEffectiveBalance() view returns(uint256 expectedEffectiveBalance)
func (_Main *MainCallerSession) GetExpectedEffectiveBalance() (*big.Int, error) {
	return _Main.Contract.GetExpectedEffectiveBalance(&_Main.CallOpts)
}

// GetPendingPoolIds is a free data retrieval call binding the contract method 0xd5d2722c.
//
// Solidity: function getPendingPoolIds() view returns(uint32[])
func (_Main *MainCaller) GetPendingPoolIds(opts *bind.CallOpts) ([]uint32, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getPendingPoolIds")

	if err != nil {
		return *new([]uint32), err
	}

	out0 := *abi.ConvertType(out[0], new([]uint32)).(*[]uint32)

	return out0, err

}

// GetPendingPoolIds is a free data retrieval call binding the contract method 0xd5d2722c.
//
// Solidity: function getPendingPoolIds() view returns(uint32[])
func (_Main *MainSession) GetPendingPoolIds() ([]uint32, error) {
	return _Main.Contract.GetPendingPoolIds(&_Main.CallOpts)
}

// GetPendingPoolIds is a free data retrieval call binding the contract method 0xd5d2722c.
//
// Solidity: function getPendingPoolIds() view returns(uint32[])
func (_Main *MainCallerSession) GetPendingPoolIds() ([]uint32, error) {
	return _Main.Contract.GetPendingPoolIds(&_Main.CallOpts)
}

// GetPendingWithdrawalEligibility is a free data retrieval call binding the contract method 0x58c4e72e.
//
// Solidity: function getPendingWithdrawalEligibility(uint256 index, uint256 period) view returns(bool pendingWithdrawalEligibility)
func (_Main *MainCaller) GetPendingWithdrawalEligibility(opts *bind.CallOpts, index *big.Int, period *big.Int) (bool, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getPendingWithdrawalEligibility", index, period)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// GetPendingWithdrawalEligibility is a free data retrieval call binding the contract method 0x58c4e72e.
//
// Solidity: function getPendingWithdrawalEligibility(uint256 index, uint256 period) view returns(bool pendingWithdrawalEligibility)
func (_Main *MainSession) GetPendingWithdrawalEligibility(index *big.Int, period *big.Int) (bool, error) {
	return _Main.Contract.GetPendingWithdrawalEligibility(&_Main.CallOpts, index, period)
}

// GetPendingWithdrawalEligibility is a free data retrieval call binding the contract method 0x58c4e72e.
//
// Solidity: function getPendingWithdrawalEligibility(uint256 index, uint256 period) view returns(bool pendingWithdrawalEligibility)
func (_Main *MainCallerSession) GetPendingWithdrawalEligibility(index *big.Int, period *big.Int) (bool, error) {
	return _Main.Contract.GetPendingWithdrawalEligibility(&_Main.CallOpts, index, period)
}

// GetPoolAddress is a free data retrieval call binding the contract method 0xb641a34f.
//
// Solidity: function getPoolAddress(uint32 poolId) view returns(address)
func (_Main *MainCaller) GetPoolAddress(opts *bind.CallOpts, poolId uint32) (common.Address, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getPoolAddress", poolId)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetPoolAddress is a free data retrieval call binding the contract method 0xb641a34f.
//
// Solidity: function getPoolAddress(uint32 poolId) view returns(address)
func (_Main *MainSession) GetPoolAddress(poolId uint32) (common.Address, error) {
	return _Main.Contract.GetPoolAddress(&_Main.CallOpts, poolId)
}

// GetPoolAddress is a free data retrieval call binding the contract method 0xb641a34f.
//
// Solidity: function getPoolAddress(uint32 poolId) view returns(address)
func (_Main *MainCallerSession) GetPoolAddress(poolId uint32) (common.Address, error) {
	return _Main.Contract.GetPoolAddress(&_Main.CallOpts, poolId)
}

// GetReadyBalance is a free data retrieval call binding the contract method 0x8ee25ec8.
//
// Solidity: function getReadyBalance() view returns(uint256 readyBalance)
func (_Main *MainCaller) GetReadyBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getReadyBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetReadyBalance is a free data retrieval call binding the contract method 0x8ee25ec8.
//
// Solidity: function getReadyBalance() view returns(uint256 readyBalance)
func (_Main *MainSession) GetReadyBalance() (*big.Int, error) {
	return _Main.Contract.GetReadyBalance(&_Main.CallOpts)
}

// GetReadyBalance is a free data retrieval call binding the contract method 0x8ee25ec8.
//
// Solidity: function getReadyBalance() view returns(uint256 readyBalance)
func (_Main *MainCallerSession) GetReadyBalance() (*big.Int, error) {
	return _Main.Contract.GetReadyBalance(&_Main.CallOpts)
}

// GetReadyPoolIds is a free data retrieval call binding the contract method 0x6ee76d67.
//
// Solidity: function getReadyPoolIds() view returns(uint32[])
func (_Main *MainCaller) GetReadyPoolIds(opts *bind.CallOpts) ([]uint32, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getReadyPoolIds")

	if err != nil {
		return *new([]uint32), err
	}

	out0 := *abi.ConvertType(out[0], new([]uint32)).(*[]uint32)

	return out0, err

}

// GetReadyPoolIds is a free data retrieval call binding the contract method 0x6ee76d67.
//
// Solidity: function getReadyPoolIds() view returns(uint32[])
func (_Main *MainSession) GetReadyPoolIds() ([]uint32, error) {
	return _Main.Contract.GetReadyPoolIds(&_Main.CallOpts)
}

// GetReadyPoolIds is a free data retrieval call binding the contract method 0x6ee76d67.
//
// Solidity: function getReadyPoolIds() view returns(uint32[])
func (_Main *MainCallerSession) GetReadyPoolIds() ([]uint32, error) {
	return _Main.Contract.GetReadyPoolIds(&_Main.CallOpts)
}

// GetRegistryAddress is a free data retrieval call binding the contract method 0xf21de1e8.
//
// Solidity: function getRegistryAddress() view returns(address registryAddress)
func (_Main *MainCaller) GetRegistryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getRegistryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetRegistryAddress is a free data retrieval call binding the contract method 0xf21de1e8.
//
// Solidity: function getRegistryAddress() view returns(address registryAddress)
func (_Main *MainSession) GetRegistryAddress() (common.Address, error) {
	return _Main.Contract.GetRegistryAddress(&_Main.CallOpts)
}

// GetRegistryAddress is a free data retrieval call binding the contract method 0xf21de1e8.
//
// Solidity: function getRegistryAddress() view returns(address registryAddress)
func (_Main *MainCallerSession) GetRegistryAddress() (common.Address, error) {
	return _Main.Contract.GetRegistryAddress(&_Main.CallOpts)
}

// GetReservedFeeBalance is a free data retrieval call binding the contract method 0xac8e2953.
//
// Solidity: function getReservedFeeBalance() view returns(uint256)
func (_Main *MainCaller) GetReservedFeeBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getReservedFeeBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetReservedFeeBalance is a free data retrieval call binding the contract method 0xac8e2953.
//
// Solidity: function getReservedFeeBalance() view returns(uint256)
func (_Main *MainSession) GetReservedFeeBalance() (*big.Int, error) {
	return _Main.Contract.GetReservedFeeBalance(&_Main.CallOpts)
}

// GetReservedFeeBalance is a free data retrieval call binding the contract method 0xac8e2953.
//
// Solidity: function getReservedFeeBalance() view returns(uint256)
func (_Main *MainCallerSession) GetReservedFeeBalance() (*big.Int, error) {
	return _Main.Contract.GetReservedFeeBalance(&_Main.CallOpts)
}

// GetStakedPoolIds is a free data retrieval call binding the contract method 0x6d83dd5c.
//
// Solidity: function getStakedPoolIds() view returns(uint32[])
func (_Main *MainCaller) GetStakedPoolIds(opts *bind.CallOpts) ([]uint32, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getStakedPoolIds")

	if err != nil {
		return *new([]uint32), err
	}

	out0 := *abi.ConvertType(out[0], new([]uint32)).(*[]uint32)

	return out0, err

}

// GetStakedPoolIds is a free data retrieval call binding the contract method 0x6d83dd5c.
//
// Solidity: function getStakedPoolIds() view returns(uint32[])
func (_Main *MainSession) GetStakedPoolIds() ([]uint32, error) {
	return _Main.Contract.GetStakedPoolIds(&_Main.CallOpts)
}

// GetStakedPoolIds is a free data retrieval call binding the contract method 0x6d83dd5c.
//
// Solidity: function getStakedPoolIds() view returns(uint32[])
func (_Main *MainCallerSession) GetStakedPoolIds() ([]uint32, error) {
	return _Main.Contract.GetStakedPoolIds(&_Main.CallOpts)
}

// GetTotalStake is a free data retrieval call binding the contract method 0x7bc74225.
//
// Solidity: function getTotalStake() view returns(uint256 totalStake)
func (_Main *MainCaller) GetTotalStake(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getTotalStake")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalStake is a free data retrieval call binding the contract method 0x7bc74225.
//
// Solidity: function getTotalStake() view returns(uint256 totalStake)
func (_Main *MainSession) GetTotalStake() (*big.Int, error) {
	return _Main.Contract.GetTotalStake(&_Main.CallOpts)
}

// GetTotalStake is a free data retrieval call binding the contract method 0x7bc74225.
//
// Solidity: function getTotalStake() view returns(uint256 totalStake)
func (_Main *MainCallerSession) GetTotalStake() (*big.Int, error) {
	return _Main.Contract.GetTotalStake(&_Main.CallOpts)
}

// GetUpkeepAddress is a free data retrieval call binding the contract method 0xa2089f0e.
//
// Solidity: function getUpkeepAddress() view returns(address upkeepAddress)
func (_Main *MainCaller) GetUpkeepAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getUpkeepAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetUpkeepAddress is a free data retrieval call binding the contract method 0xa2089f0e.
//
// Solidity: function getUpkeepAddress() view returns(address upkeepAddress)
func (_Main *MainSession) GetUpkeepAddress() (common.Address, error) {
	return _Main.Contract.GetUpkeepAddress(&_Main.CallOpts)
}

// GetUpkeepAddress is a free data retrieval call binding the contract method 0xa2089f0e.
//
// Solidity: function getUpkeepAddress() view returns(address upkeepAddress)
func (_Main *MainCallerSession) GetUpkeepAddress() (common.Address, error) {
	return _Main.Contract.GetUpkeepAddress(&_Main.CallOpts)
}

// GetUpkeepBalance is a free data retrieval call binding the contract method 0x131f66d2.
//
// Solidity: function getUpkeepBalance() view returns(uint256 upkeepBalance)
func (_Main *MainCaller) GetUpkeepBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getUpkeepBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetUpkeepBalance is a free data retrieval call binding the contract method 0x131f66d2.
//
// Solidity: function getUpkeepBalance() view returns(uint256 upkeepBalance)
func (_Main *MainSession) GetUpkeepBalance() (*big.Int, error) {
	return _Main.Contract.GetUpkeepBalance(&_Main.CallOpts)
}

// GetUpkeepBalance is a free data retrieval call binding the contract method 0x131f66d2.
//
// Solidity: function getUpkeepBalance() view returns(uint256 upkeepBalance)
func (_Main *MainCallerSession) GetUpkeepBalance() (*big.Int, error) {
	return _Main.Contract.GetUpkeepBalance(&_Main.CallOpts)
}

// GetUserStake is a free data retrieval call binding the contract method 0xbbadc93a.
//
// Solidity: function getUserStake(address userAddress) view returns(uint256 userStake)
func (_Main *MainCaller) GetUserStake(opts *bind.CallOpts, userAddress common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getUserStake", userAddress)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetUserStake is a free data retrieval call binding the contract method 0xbbadc93a.
//
// Solidity: function getUserStake(address userAddress) view returns(uint256 userStake)
func (_Main *MainSession) GetUserStake(userAddress common.Address) (*big.Int, error) {
	return _Main.Contract.GetUserStake(&_Main.CallOpts, userAddress)
}

// GetUserStake is a free data retrieval call binding the contract method 0xbbadc93a.
//
// Solidity: function getUserStake(address userAddress) view returns(uint256 userStake)
func (_Main *MainCallerSession) GetUserStake(userAddress common.Address) (*big.Int, error) {
	return _Main.Contract.GetUserStake(&_Main.CallOpts, userAddress)
}

// GetWithdrawableBalance is a free data retrieval call binding the contract method 0xbe788e70.
//
// Solidity: function getWithdrawableBalance() view returns(uint256)
func (_Main *MainCaller) GetWithdrawableBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "getWithdrawableBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetWithdrawableBalance is a free data retrieval call binding the contract method 0xbe788e70.
//
// Solidity: function getWithdrawableBalance() view returns(uint256)
func (_Main *MainSession) GetWithdrawableBalance() (*big.Int, error) {
	return _Main.Contract.GetWithdrawableBalance(&_Main.CallOpts)
}

// GetWithdrawableBalance is a free data retrieval call binding the contract method 0xbe788e70.
//
// Solidity: function getWithdrawableBalance() view returns(uint256)
func (_Main *MainCallerSession) GetWithdrawableBalance() (*big.Int, error) {
	return _Main.Contract.GetWithdrawableBalance(&_Main.CallOpts)
}

// LatestActiveBalance is a free data retrieval call binding the contract method 0xce54d3e3.
//
// Solidity: function latestActiveBalance() view returns(uint256)
func (_Main *MainCaller) LatestActiveBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "latestActiveBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// LatestActiveBalance is a free data retrieval call binding the contract method 0xce54d3e3.
//
// Solidity: function latestActiveBalance() view returns(uint256)
func (_Main *MainSession) LatestActiveBalance() (*big.Int, error) {
	return _Main.Contract.LatestActiveBalance(&_Main.CallOpts)
}

// LatestActiveBalance is a free data retrieval call binding the contract method 0xce54d3e3.
//
// Solidity: function latestActiveBalance() view returns(uint256)
func (_Main *MainCallerSession) LatestActiveBalance() (*big.Int, error) {
	return _Main.Contract.LatestActiveBalance(&_Main.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Main *MainCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Main *MainSession) Owner() (common.Address, error) {
	return _Main.Contract.Owner(&_Main.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Main *MainCallerSession) Owner() (common.Address, error) {
	return _Main.Contract.Owner(&_Main.CallOpts)
}

// ReportPeriod is a free data retrieval call binding the contract method 0x0ea61dad.
//
// Solidity: function reportPeriod() view returns(uint32)
func (_Main *MainCaller) ReportPeriod(opts *bind.CallOpts) (uint32, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "reportPeriod")

	if err != nil {
		return *new(uint32), err
	}

	out0 := *abi.ConvertType(out[0], new(uint32)).(*uint32)

	return out0, err

}

// ReportPeriod is a free data retrieval call binding the contract method 0x0ea61dad.
//
// Solidity: function reportPeriod() view returns(uint32)
func (_Main *MainSession) ReportPeriod() (uint32, error) {
	return _Main.Contract.ReportPeriod(&_Main.CallOpts)
}

// ReportPeriod is a free data retrieval call binding the contract method 0x0ea61dad.
//
// Solidity: function reportPeriod() view returns(uint32)
func (_Main *MainCallerSession) ReportPeriod() (uint32, error) {
	return _Main.Contract.ReportPeriod(&_Main.CallOpts)
}

// RequestedExits is a free data retrieval call binding the contract method 0xea79ae89.
//
// Solidity: function requestedExits() view returns(uint256)
func (_Main *MainCaller) RequestedExits(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "requestedExits")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// RequestedExits is a free data retrieval call binding the contract method 0xea79ae89.
//
// Solidity: function requestedExits() view returns(uint256)
func (_Main *MainSession) RequestedExits() (*big.Int, error) {
	return _Main.Contract.RequestedExits(&_Main.CallOpts)
}

// RequestedExits is a free data retrieval call binding the contract method 0xea79ae89.
//
// Solidity: function requestedExits() view returns(uint256)
func (_Main *MainCallerSession) RequestedExits() (*big.Int, error) {
	return _Main.Contract.RequestedExits(&_Main.CallOpts)
}

// RequestedWithdrawalBalance is a free data retrieval call binding the contract method 0xa0b297d3.
//
// Solidity: function requestedWithdrawalBalance() view returns(uint256)
func (_Main *MainCaller) RequestedWithdrawalBalance(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "requestedWithdrawalBalance")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// RequestedWithdrawalBalance is a free data retrieval call binding the contract method 0xa0b297d3.
//
// Solidity: function requestedWithdrawalBalance() view returns(uint256)
func (_Main *MainSession) RequestedWithdrawalBalance() (*big.Int, error) {
	return _Main.Contract.RequestedWithdrawalBalance(&_Main.CallOpts)
}

// RequestedWithdrawalBalance is a free data retrieval call binding the contract method 0xa0b297d3.
//
// Solidity: function requestedWithdrawalBalance() view returns(uint256)
func (_Main *MainCallerSession) RequestedWithdrawalBalance() (*big.Int, error) {
	return _Main.Contract.RequestedWithdrawalBalance(&_Main.CallOpts)
}

// UpkeepId is a free data retrieval call binding the contract method 0xd2aa789f.
//
// Solidity: function upkeepId() view returns(uint256)
func (_Main *MainCaller) UpkeepId(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Main.contract.Call(opts, &out, "upkeepId")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// UpkeepId is a free data retrieval call binding the contract method 0xd2aa789f.
//
// Solidity: function upkeepId() view returns(uint256)
func (_Main *MainSession) UpkeepId() (*big.Int, error) {
	return _Main.Contract.UpkeepId(&_Main.CallOpts)
}

// UpkeepId is a free data retrieval call binding the contract method 0xd2aa789f.
//
// Solidity: function upkeepId() view returns(uint256)
func (_Main *MainCallerSession) UpkeepId() (*big.Int, error) {
	return _Main.Contract.UpkeepId(&_Main.CallOpts)
}

// ActivateDeposits is a paid mutator transaction binding the contract method 0xb592a6c8.
//
// Solidity: function activateDeposits(uint256 count) returns()
func (_Main *MainTransactor) ActivateDeposits(opts *bind.TransactOpts, count *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "activateDeposits", count)
}

// ActivateDeposits is a paid mutator transaction binding the contract method 0xb592a6c8.
//
// Solidity: function activateDeposits(uint256 count) returns()
func (_Main *MainSession) ActivateDeposits(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.ActivateDeposits(&_Main.TransactOpts, count)
}

// ActivateDeposits is a paid mutator transaction binding the contract method 0xb592a6c8.
//
// Solidity: function activateDeposits(uint256 count) returns()
func (_Main *MainTransactorSession) ActivateDeposits(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.ActivateDeposits(&_Main.TransactOpts, count)
}

// CompoundRewards is a paid mutator transaction binding the contract method 0x1ae0f14a.
//
// Solidity: function compoundRewards(uint32[5] poolIds) returns()
func (_Main *MainTransactor) CompoundRewards(opts *bind.TransactOpts, poolIds [5]uint32) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "compoundRewards", poolIds)
}

// CompoundRewards is a paid mutator transaction binding the contract method 0x1ae0f14a.
//
// Solidity: function compoundRewards(uint32[5] poolIds) returns()
func (_Main *MainSession) CompoundRewards(poolIds [5]uint32) (*types.Transaction, error) {
	return _Main.Contract.CompoundRewards(&_Main.TransactOpts, poolIds)
}

// CompoundRewards is a paid mutator transaction binding the contract method 0x1ae0f14a.
//
// Solidity: function compoundRewards(uint32[5] poolIds) returns()
func (_Main *MainTransactorSession) CompoundRewards(poolIds [5]uint32) (*types.Transaction, error) {
	return _Main.Contract.CompoundRewards(&_Main.TransactOpts, poolIds)
}

// DepositClusterBalance is a paid mutator transaction binding the contract method 0x2729fad1.
//
// Solidity: function depositClusterBalance(uint64[] operatorIds, (uint32,uint64,uint64,uint256,bool) cluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactor) DepositClusterBalance(opts *bind.TransactOpts, operatorIds []uint64, cluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositClusterBalance", operatorIds, cluster, feeAmount, processed)
}

// DepositClusterBalance is a paid mutator transaction binding the contract method 0x2729fad1.
//
// Solidity: function depositClusterBalance(uint64[] operatorIds, (uint32,uint64,uint64,uint256,bool) cluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainSession) DepositClusterBalance(operatorIds []uint64, cluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.DepositClusterBalance(&_Main.TransactOpts, operatorIds, cluster, feeAmount, processed)
}

// DepositClusterBalance is a paid mutator transaction binding the contract method 0x2729fad1.
//
// Solidity: function depositClusterBalance(uint64[] operatorIds, (uint32,uint64,uint64,uint256,bool) cluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactorSession) DepositClusterBalance(operatorIds []uint64, cluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.DepositClusterBalance(&_Main.TransactOpts, operatorIds, cluster, feeAmount, processed)
}

// DepositExitedBalance is a paid mutator transaction binding the contract method 0x457cf6ae.
//
// Solidity: function depositExitedBalance(uint32 poolId) payable returns()
func (_Main *MainTransactor) DepositExitedBalance(opts *bind.TransactOpts, poolId uint32) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositExitedBalance", poolId)
}

// DepositExitedBalance is a paid mutator transaction binding the contract method 0x457cf6ae.
//
// Solidity: function depositExitedBalance(uint32 poolId) payable returns()
func (_Main *MainSession) DepositExitedBalance(poolId uint32) (*types.Transaction, error) {
	return _Main.Contract.DepositExitedBalance(&_Main.TransactOpts, poolId)
}

// DepositExitedBalance is a paid mutator transaction binding the contract method 0x457cf6ae.
//
// Solidity: function depositExitedBalance(uint32 poolId) payable returns()
func (_Main *MainTransactorSession) DepositExitedBalance(poolId uint32) (*types.Transaction, error) {
	return _Main.Contract.DepositExitedBalance(&_Main.TransactOpts, poolId)
}

// DepositRecoveredBalance is a paid mutator transaction binding the contract method 0xcc487398.
//
// Solidity: function depositRecoveredBalance(uint32 poolId) payable returns()
func (_Main *MainTransactor) DepositRecoveredBalance(opts *bind.TransactOpts, poolId uint32) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositRecoveredBalance", poolId)
}

// DepositRecoveredBalance is a paid mutator transaction binding the contract method 0xcc487398.
//
// Solidity: function depositRecoveredBalance(uint32 poolId) payable returns()
func (_Main *MainSession) DepositRecoveredBalance(poolId uint32) (*types.Transaction, error) {
	return _Main.Contract.DepositRecoveredBalance(&_Main.TransactOpts, poolId)
}

// DepositRecoveredBalance is a paid mutator transaction binding the contract method 0xcc487398.
//
// Solidity: function depositRecoveredBalance(uint32 poolId) payable returns()
func (_Main *MainTransactorSession) DepositRecoveredBalance(poolId uint32) (*types.Transaction, error) {
	return _Main.Contract.DepositRecoveredBalance(&_Main.TransactOpts, poolId)
}

// DepositReservedFees is a paid mutator transaction binding the contract method 0x89fffc3c.
//
// Solidity: function depositReservedFees() payable returns()
func (_Main *MainTransactor) DepositReservedFees(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositReservedFees")
}

// DepositReservedFees is a paid mutator transaction binding the contract method 0x89fffc3c.
//
// Solidity: function depositReservedFees() payable returns()
func (_Main *MainSession) DepositReservedFees() (*types.Transaction, error) {
	return _Main.Contract.DepositReservedFees(&_Main.TransactOpts)
}

// DepositReservedFees is a paid mutator transaction binding the contract method 0x89fffc3c.
//
// Solidity: function depositReservedFees() payable returns()
func (_Main *MainTransactorSession) DepositReservedFees() (*types.Transaction, error) {
	return _Main.Contract.DepositReservedFees(&_Main.TransactOpts)
}

// DepositRewards is a paid mutator transaction binding the contract method 0x152111f7.
//
// Solidity: function depositRewards() payable returns()
func (_Main *MainTransactor) DepositRewards(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositRewards")
}

// DepositRewards is a paid mutator transaction binding the contract method 0x152111f7.
//
// Solidity: function depositRewards() payable returns()
func (_Main *MainSession) DepositRewards() (*types.Transaction, error) {
	return _Main.Contract.DepositRewards(&_Main.TransactOpts)
}

// DepositRewards is a paid mutator transaction binding the contract method 0x152111f7.
//
// Solidity: function depositRewards() payable returns()
func (_Main *MainTransactorSession) DepositRewards() (*types.Transaction, error) {
	return _Main.Contract.DepositRewards(&_Main.TransactOpts)
}

// DepositStake is a paid mutator transaction binding the contract method 0x0d2d76a2.
//
// Solidity: function depositStake() payable returns()
func (_Main *MainTransactor) DepositStake(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositStake")
}

// DepositStake is a paid mutator transaction binding the contract method 0x0d2d76a2.
//
// Solidity: function depositStake() payable returns()
func (_Main *MainSession) DepositStake() (*types.Transaction, error) {
	return _Main.Contract.DepositStake(&_Main.TransactOpts)
}

// DepositStake is a paid mutator transaction binding the contract method 0x0d2d76a2.
//
// Solidity: function depositStake() payable returns()
func (_Main *MainTransactorSession) DepositStake() (*types.Transaction, error) {
	return _Main.Contract.DepositStake(&_Main.TransactOpts)
}

// DepositUpkeepBalance is a paid mutator transaction binding the contract method 0xe9070ae5.
//
// Solidity: function depositUpkeepBalance(uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactor) DepositUpkeepBalance(opts *bind.TransactOpts, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "depositUpkeepBalance", feeAmount, processed)
}

// DepositUpkeepBalance is a paid mutator transaction binding the contract method 0xe9070ae5.
//
// Solidity: function depositUpkeepBalance(uint256 feeAmount, bool processed) returns()
func (_Main *MainSession) DepositUpkeepBalance(feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.DepositUpkeepBalance(&_Main.TransactOpts, feeAmount, processed)
}

// DepositUpkeepBalance is a paid mutator transaction binding the contract method 0xe9070ae5.
//
// Solidity: function depositUpkeepBalance(uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactorSession) DepositUpkeepBalance(feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.DepositUpkeepBalance(&_Main.TransactOpts, feeAmount, processed)
}

// FulfillWithdrawals is a paid mutator transaction binding the contract method 0x606225d0.
//
// Solidity: function fulfillWithdrawals(uint256 count) returns()
func (_Main *MainTransactor) FulfillWithdrawals(opts *bind.TransactOpts, count *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "fulfillWithdrawals", count)
}

// FulfillWithdrawals is a paid mutator transaction binding the contract method 0x606225d0.
//
// Solidity: function fulfillWithdrawals(uint256 count) returns()
func (_Main *MainSession) FulfillWithdrawals(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.FulfillWithdrawals(&_Main.TransactOpts, count)
}

// FulfillWithdrawals is a paid mutator transaction binding the contract method 0x606225d0.
//
// Solidity: function fulfillWithdrawals(uint256 count) returns()
func (_Main *MainTransactorSession) FulfillWithdrawals(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.FulfillWithdrawals(&_Main.TransactOpts, count)
}

// InitiateDeposit is a paid mutator transaction binding the contract method 0x89dd9127.
//
// Solidity: function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, (uint32,uint64,uint64,uint256,bool) cluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactor) InitiateDeposit(opts *bind.TransactOpts, depositDataRoot [32]byte, publicKey []byte, signature []byte, withdrawalCredentials []byte, operatorIds []uint64, shares []byte, cluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "initiateDeposit", depositDataRoot, publicKey, signature, withdrawalCredentials, operatorIds, shares, cluster, feeAmount, processed)
}

// InitiateDeposit is a paid mutator transaction binding the contract method 0x89dd9127.
//
// Solidity: function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, (uint32,uint64,uint64,uint256,bool) cluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainSession) InitiateDeposit(depositDataRoot [32]byte, publicKey []byte, signature []byte, withdrawalCredentials []byte, operatorIds []uint64, shares []byte, cluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.InitiateDeposit(&_Main.TransactOpts, depositDataRoot, publicKey, signature, withdrawalCredentials, operatorIds, shares, cluster, feeAmount, processed)
}

// InitiateDeposit is a paid mutator transaction binding the contract method 0x89dd9127.
//
// Solidity: function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, (uint32,uint64,uint64,uint256,bool) cluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactorSession) InitiateDeposit(depositDataRoot [32]byte, publicKey []byte, signature []byte, withdrawalCredentials []byte, operatorIds []uint64, shares []byte, cluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.InitiateDeposit(&_Main.TransactOpts, depositDataRoot, publicKey, signature, withdrawalCredentials, operatorIds, shares, cluster, feeAmount, processed)
}

// RebalanceStake is a paid mutator transaction binding the contract method 0xaaf0c558.
//
// Solidity: function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) returns()
func (_Main *MainTransactor) RebalanceStake(opts *bind.TransactOpts, activeBalance *big.Int, sweptBalance *big.Int, activatedDeposits *big.Int, completedExits *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "rebalanceStake", activeBalance, sweptBalance, activatedDeposits, completedExits)
}

// RebalanceStake is a paid mutator transaction binding the contract method 0xaaf0c558.
//
// Solidity: function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) returns()
func (_Main *MainSession) RebalanceStake(activeBalance *big.Int, sweptBalance *big.Int, activatedDeposits *big.Int, completedExits *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RebalanceStake(&_Main.TransactOpts, activeBalance, sweptBalance, activatedDeposits, completedExits)
}

// RebalanceStake is a paid mutator transaction binding the contract method 0xaaf0c558.
//
// Solidity: function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) returns()
func (_Main *MainTransactorSession) RebalanceStake(activeBalance *big.Int, sweptBalance *big.Int, activatedDeposits *big.Int, completedExits *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RebalanceStake(&_Main.TransactOpts, activeBalance, sweptBalance, activatedDeposits, completedExits)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Main *MainTransactor) RenounceOwnership(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "renounceOwnership")
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Main *MainSession) RenounceOwnership() (*types.Transaction, error) {
	return _Main.Contract.RenounceOwnership(&_Main.TransactOpts)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Main *MainTransactorSession) RenounceOwnership() (*types.Transaction, error) {
	return _Main.Contract.RenounceOwnership(&_Main.TransactOpts)
}

// ReportCompletedExit is a paid mutator transaction binding the contract method 0x7277d07c.
//
// Solidity: function reportCompletedExit(uint256 poolIndex, uint32[] blamePercents, (uint32,uint64,uint64,uint256,bool) cluster) returns()
func (_Main *MainTransactor) ReportCompletedExit(opts *bind.TransactOpts, poolIndex *big.Int, blamePercents []uint32, cluster ISSVNetworkCoreCluster) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "reportCompletedExit", poolIndex, blamePercents, cluster)
}

// ReportCompletedExit is a paid mutator transaction binding the contract method 0x7277d07c.
//
// Solidity: function reportCompletedExit(uint256 poolIndex, uint32[] blamePercents, (uint32,uint64,uint64,uint256,bool) cluster) returns()
func (_Main *MainSession) ReportCompletedExit(poolIndex *big.Int, blamePercents []uint32, cluster ISSVNetworkCoreCluster) (*types.Transaction, error) {
	return _Main.Contract.ReportCompletedExit(&_Main.TransactOpts, poolIndex, blamePercents, cluster)
}

// ReportCompletedExit is a paid mutator transaction binding the contract method 0x7277d07c.
//
// Solidity: function reportCompletedExit(uint256 poolIndex, uint32[] blamePercents, (uint32,uint64,uint64,uint256,bool) cluster) returns()
func (_Main *MainTransactorSession) ReportCompletedExit(poolIndex *big.Int, blamePercents []uint32, cluster ISSVNetworkCoreCluster) (*types.Transaction, error) {
	return _Main.Contract.ReportCompletedExit(&_Main.TransactOpts, poolIndex, blamePercents, cluster)
}

// ReportForcedExits is a paid mutator transaction binding the contract method 0xf3bf9499.
//
// Solidity: function reportForcedExits(uint32[] poolIds) returns()
func (_Main *MainTransactor) ReportForcedExits(opts *bind.TransactOpts, poolIds []uint32) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "reportForcedExits", poolIds)
}

// ReportForcedExits is a paid mutator transaction binding the contract method 0xf3bf9499.
//
// Solidity: function reportForcedExits(uint32[] poolIds) returns()
func (_Main *MainSession) ReportForcedExits(poolIds []uint32) (*types.Transaction, error) {
	return _Main.Contract.ReportForcedExits(&_Main.TransactOpts, poolIds)
}

// ReportForcedExits is a paid mutator transaction binding the contract method 0xf3bf9499.
//
// Solidity: function reportForcedExits(uint32[] poolIds) returns()
func (_Main *MainTransactorSession) ReportForcedExits(poolIds []uint32) (*types.Transaction, error) {
	return _Main.Contract.ReportForcedExits(&_Main.TransactOpts, poolIds)
}

// ReportReshare is a paid mutator transaction binding the contract method 0x8ad6cc36.
//
// Solidity: function reportReshare(uint32 poolId, uint64[] operatorIds, uint64[] oldOperatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, (uint32,uint64,uint64,uint256,bool) cluster, (uint32,uint64,uint64,uint256,bool) oldCluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactor) ReportReshare(opts *bind.TransactOpts, poolId uint32, operatorIds []uint64, oldOperatorIds []uint64, newOperatorId uint64, oldOperatorId uint64, shares []byte, cluster ISSVNetworkCoreCluster, oldCluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "reportReshare", poolId, operatorIds, oldOperatorIds, newOperatorId, oldOperatorId, shares, cluster, oldCluster, feeAmount, processed)
}

// ReportReshare is a paid mutator transaction binding the contract method 0x8ad6cc36.
//
// Solidity: function reportReshare(uint32 poolId, uint64[] operatorIds, uint64[] oldOperatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, (uint32,uint64,uint64,uint256,bool) cluster, (uint32,uint64,uint64,uint256,bool) oldCluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainSession) ReportReshare(poolId uint32, operatorIds []uint64, oldOperatorIds []uint64, newOperatorId uint64, oldOperatorId uint64, shares []byte, cluster ISSVNetworkCoreCluster, oldCluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.ReportReshare(&_Main.TransactOpts, poolId, operatorIds, oldOperatorIds, newOperatorId, oldOperatorId, shares, cluster, oldCluster, feeAmount, processed)
}

// ReportReshare is a paid mutator transaction binding the contract method 0x8ad6cc36.
//
// Solidity: function reportReshare(uint32 poolId, uint64[] operatorIds, uint64[] oldOperatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, (uint32,uint64,uint64,uint256,bool) cluster, (uint32,uint64,uint64,uint256,bool) oldCluster, uint256 feeAmount, bool processed) returns()
func (_Main *MainTransactorSession) ReportReshare(poolId uint32, operatorIds []uint64, oldOperatorIds []uint64, newOperatorId uint64, oldOperatorId uint64, shares []byte, cluster ISSVNetworkCoreCluster, oldCluster ISSVNetworkCoreCluster, feeAmount *big.Int, processed bool) (*types.Transaction, error) {
	return _Main.Contract.ReportReshare(&_Main.TransactOpts, poolId, operatorIds, oldOperatorIds, newOperatorId, oldOperatorId, shares, cluster, oldCluster, feeAmount, processed)
}

// RequestCompletedExitReports is a paid mutator transaction binding the contract method 0x530f4d1a.
//
// Solidity: function requestCompletedExitReports(uint256 count) returns()
func (_Main *MainTransactor) RequestCompletedExitReports(opts *bind.TransactOpts, count *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "requestCompletedExitReports", count)
}

// RequestCompletedExitReports is a paid mutator transaction binding the contract method 0x530f4d1a.
//
// Solidity: function requestCompletedExitReports(uint256 count) returns()
func (_Main *MainSession) RequestCompletedExitReports(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RequestCompletedExitReports(&_Main.TransactOpts, count)
}

// RequestCompletedExitReports is a paid mutator transaction binding the contract method 0x530f4d1a.
//
// Solidity: function requestCompletedExitReports(uint256 count) returns()
func (_Main *MainTransactorSession) RequestCompletedExitReports(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RequestCompletedExitReports(&_Main.TransactOpts, count)
}

// RequestForcedExitReports is a paid mutator transaction binding the contract method 0xa374e402.
//
// Solidity: function requestForcedExitReports(uint256 count) returns()
func (_Main *MainTransactor) RequestForcedExitReports(opts *bind.TransactOpts, count *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "requestForcedExitReports", count)
}

// RequestForcedExitReports is a paid mutator transaction binding the contract method 0xa374e402.
//
// Solidity: function requestForcedExitReports(uint256 count) returns()
func (_Main *MainSession) RequestForcedExitReports(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RequestForcedExitReports(&_Main.TransactOpts, count)
}

// RequestForcedExitReports is a paid mutator transaction binding the contract method 0xa374e402.
//
// Solidity: function requestForcedExitReports(uint256 count) returns()
func (_Main *MainTransactorSession) RequestForcedExitReports(count *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RequestForcedExitReports(&_Main.TransactOpts, count)
}

// RequestReshares is a paid mutator transaction binding the contract method 0x7e23341a.
//
// Solidity: function requestReshares(uint64 operatorId) returns()
func (_Main *MainTransactor) RequestReshares(opts *bind.TransactOpts, operatorId uint64) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "requestReshares", operatorId)
}

// RequestReshares is a paid mutator transaction binding the contract method 0x7e23341a.
//
// Solidity: function requestReshares(uint64 operatorId) returns()
func (_Main *MainSession) RequestReshares(operatorId uint64) (*types.Transaction, error) {
	return _Main.Contract.RequestReshares(&_Main.TransactOpts, operatorId)
}

// RequestReshares is a paid mutator transaction binding the contract method 0x7e23341a.
//
// Solidity: function requestReshares(uint64 operatorId) returns()
func (_Main *MainTransactorSession) RequestReshares(operatorId uint64) (*types.Transaction, error) {
	return _Main.Contract.RequestReshares(&_Main.TransactOpts, operatorId)
}

// RequestWithdrawal is a paid mutator transaction binding the contract method 0x9ee679e8.
//
// Solidity: function requestWithdrawal(uint256 amount) returns()
func (_Main *MainTransactor) RequestWithdrawal(opts *bind.TransactOpts, amount *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "requestWithdrawal", amount)
}

// RequestWithdrawal is a paid mutator transaction binding the contract method 0x9ee679e8.
//
// Solidity: function requestWithdrawal(uint256 amount) returns()
func (_Main *MainSession) RequestWithdrawal(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RequestWithdrawal(&_Main.TransactOpts, amount)
}

// RequestWithdrawal is a paid mutator transaction binding the contract method 0x9ee679e8.
//
// Solidity: function requestWithdrawal(uint256 amount) returns()
func (_Main *MainTransactorSession) RequestWithdrawal(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.RequestWithdrawal(&_Main.TransactOpts, amount)
}

// SetFunctionsAddress is a paid mutator transaction binding the contract method 0x8a2d0ae3.
//
// Solidity: function setFunctionsAddress(address functionsAddress) returns()
func (_Main *MainTransactor) SetFunctionsAddress(opts *bind.TransactOpts, functionsAddress common.Address) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "setFunctionsAddress", functionsAddress)
}

// SetFunctionsAddress is a paid mutator transaction binding the contract method 0x8a2d0ae3.
//
// Solidity: function setFunctionsAddress(address functionsAddress) returns()
func (_Main *MainSession) SetFunctionsAddress(functionsAddress common.Address) (*types.Transaction, error) {
	return _Main.Contract.SetFunctionsAddress(&_Main.TransactOpts, functionsAddress)
}

// SetFunctionsAddress is a paid mutator transaction binding the contract method 0x8a2d0ae3.
//
// Solidity: function setFunctionsAddress(address functionsAddress) returns()
func (_Main *MainTransactorSession) SetFunctionsAddress(functionsAddress common.Address) (*types.Transaction, error) {
	return _Main.Contract.SetFunctionsAddress(&_Main.TransactOpts, functionsAddress)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Main *MainTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Main *MainSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _Main.Contract.TransferOwnership(&_Main.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Main *MainTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _Main.Contract.TransferOwnership(&_Main.TransactOpts, newOwner)
}

// WithdrawLINKBalance is a paid mutator transaction binding the contract method 0xf95ea5a2.
//
// Solidity: function withdrawLINKBalance(uint256 amount) returns()
func (_Main *MainTransactor) WithdrawLINKBalance(opts *bind.TransactOpts, amount *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "withdrawLINKBalance", amount)
}

// WithdrawLINKBalance is a paid mutator transaction binding the contract method 0xf95ea5a2.
//
// Solidity: function withdrawLINKBalance(uint256 amount) returns()
func (_Main *MainSession) WithdrawLINKBalance(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.WithdrawLINKBalance(&_Main.TransactOpts, amount)
}

// WithdrawLINKBalance is a paid mutator transaction binding the contract method 0xf95ea5a2.
//
// Solidity: function withdrawLINKBalance(uint256 amount) returns()
func (_Main *MainTransactorSession) WithdrawLINKBalance(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.WithdrawLINKBalance(&_Main.TransactOpts, amount)
}

// WithdrawReservedFees is a paid mutator transaction binding the contract method 0x784b95b8.
//
// Solidity: function withdrawReservedFees(uint256 amount) returns()
func (_Main *MainTransactor) WithdrawReservedFees(opts *bind.TransactOpts, amount *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "withdrawReservedFees", amount)
}

// WithdrawReservedFees is a paid mutator transaction binding the contract method 0x784b95b8.
//
// Solidity: function withdrawReservedFees(uint256 amount) returns()
func (_Main *MainSession) WithdrawReservedFees(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.WithdrawReservedFees(&_Main.TransactOpts, amount)
}

// WithdrawReservedFees is a paid mutator transaction binding the contract method 0x784b95b8.
//
// Solidity: function withdrawReservedFees(uint256 amount) returns()
func (_Main *MainTransactorSession) WithdrawReservedFees(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.WithdrawReservedFees(&_Main.TransactOpts, amount)
}

// WithdrawSSVBalance is a paid mutator transaction binding the contract method 0x867918b6.
//
// Solidity: function withdrawSSVBalance(uint256 amount) returns()
func (_Main *MainTransactor) WithdrawSSVBalance(opts *bind.TransactOpts, amount *big.Int) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "withdrawSSVBalance", amount)
}

// WithdrawSSVBalance is a paid mutator transaction binding the contract method 0x867918b6.
//
// Solidity: function withdrawSSVBalance(uint256 amount) returns()
func (_Main *MainSession) WithdrawSSVBalance(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.WithdrawSSVBalance(&_Main.TransactOpts, amount)
}

// WithdrawSSVBalance is a paid mutator transaction binding the contract method 0x867918b6.
//
// Solidity: function withdrawSSVBalance(uint256 amount) returns()
func (_Main *MainTransactorSession) WithdrawSSVBalance(amount *big.Int) (*types.Transaction, error) {
	return _Main.Contract.WithdrawSSVBalance(&_Main.TransactOpts, amount)
}

// WithdrawUpkeepBalance is a paid mutator transaction binding the contract method 0xf7c700d1.
//
// Solidity: function withdrawUpkeepBalance() returns()
func (_Main *MainTransactor) WithdrawUpkeepBalance(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.contract.Transact(opts, "withdrawUpkeepBalance")
}

// WithdrawUpkeepBalance is a paid mutator transaction binding the contract method 0xf7c700d1.
//
// Solidity: function withdrawUpkeepBalance() returns()
func (_Main *MainSession) WithdrawUpkeepBalance() (*types.Transaction, error) {
	return _Main.Contract.WithdrawUpkeepBalance(&_Main.TransactOpts)
}

// WithdrawUpkeepBalance is a paid mutator transaction binding the contract method 0xf7c700d1.
//
// Solidity: function withdrawUpkeepBalance() returns()
func (_Main *MainTransactorSession) WithdrawUpkeepBalance() (*types.Transaction, error) {
	return _Main.Contract.WithdrawUpkeepBalance(&_Main.TransactOpts)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_Main *MainTransactor) Receive(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Main.contract.RawTransact(opts, nil) // calldata is disallowed for receive function
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_Main *MainSession) Receive() (*types.Transaction, error) {
	return _Main.Contract.Receive(&_Main.TransactOpts)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_Main *MainTransactorSession) Receive() (*types.Transaction, error) {
	return _Main.Contract.Receive(&_Main.TransactOpts)
}

// MainCompletedExitReportsRequestedIterator is returned from FilterCompletedExitReportsRequested and is used to iterate over the raw logs and unpacked data for CompletedExitReportsRequested events raised by the Main contract.
type MainCompletedExitReportsRequestedIterator struct {
	Event *MainCompletedExitReportsRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainCompletedExitReportsRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainCompletedExitReportsRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainCompletedExitReportsRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainCompletedExitReportsRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainCompletedExitReportsRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainCompletedExitReportsRequested represents a CompletedExitReportsRequested event raised by the Main contract.
type MainCompletedExitReportsRequested struct {
	Count *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterCompletedExitReportsRequested is a free log retrieval operation binding the contract event 0x2e85588e294368bbb2102d8b8bd81e952c30f94956f69d2e9a6a2da5a690c919.
//
// Solidity: event CompletedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) FilterCompletedExitReportsRequested(opts *bind.FilterOpts) (*MainCompletedExitReportsRequestedIterator, error) {

	logs, sub, err := _Main.contract.FilterLogs(opts, "CompletedExitReportsRequested")
	if err != nil {
		return nil, err
	}
	return &MainCompletedExitReportsRequestedIterator{contract: _Main.contract, event: "CompletedExitReportsRequested", logs: logs, sub: sub}, nil
}

// WatchCompletedExitReportsRequested is a free log subscription operation binding the contract event 0x2e85588e294368bbb2102d8b8bd81e952c30f94956f69d2e9a6a2da5a690c919.
//
// Solidity: event CompletedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) WatchCompletedExitReportsRequested(opts *bind.WatchOpts, sink chan<- *MainCompletedExitReportsRequested) (event.Subscription, error) {

	logs, sub, err := _Main.contract.WatchLogs(opts, "CompletedExitReportsRequested")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainCompletedExitReportsRequested)
				if err := _Main.contract.UnpackLog(event, "CompletedExitReportsRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseCompletedExitReportsRequested is a log parse operation binding the contract event 0x2e85588e294368bbb2102d8b8bd81e952c30f94956f69d2e9a6a2da5a690c919.
//
// Solidity: event CompletedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) ParseCompletedExitReportsRequested(log types.Log) (*MainCompletedExitReportsRequested, error) {
	event := new(MainCompletedExitReportsRequested)
	if err := _Main.contract.UnpackLog(event, "CompletedExitReportsRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainDepositActivatedIterator is returned from FilterDepositActivated and is used to iterate over the raw logs and unpacked data for DepositActivated events raised by the Main contract.
type MainDepositActivatedIterator struct {
	Event *MainDepositActivated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainDepositActivatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainDepositActivated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainDepositActivated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainDepositActivatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainDepositActivatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainDepositActivated represents a DepositActivated event raised by the Main contract.
type MainDepositActivated struct {
	PoolId uint32
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterDepositActivated is a free log retrieval operation binding the contract event 0x47cc13c0d0733c86b121e1efaaf1554a8e2fa62e4db238e28f492d837b3b0cbf.
//
// Solidity: event DepositActivated(uint32 indexed poolId)
func (_Main *MainFilterer) FilterDepositActivated(opts *bind.FilterOpts, poolId []uint32) (*MainDepositActivatedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "DepositActivated", poolIdRule)
	if err != nil {
		return nil, err
	}
	return &MainDepositActivatedIterator{contract: _Main.contract, event: "DepositActivated", logs: logs, sub: sub}, nil
}

// WatchDepositActivated is a free log subscription operation binding the contract event 0x47cc13c0d0733c86b121e1efaaf1554a8e2fa62e4db238e28f492d837b3b0cbf.
//
// Solidity: event DepositActivated(uint32 indexed poolId)
func (_Main *MainFilterer) WatchDepositActivated(opts *bind.WatchOpts, sink chan<- *MainDepositActivated, poolId []uint32) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "DepositActivated", poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainDepositActivated)
				if err := _Main.contract.UnpackLog(event, "DepositActivated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseDepositActivated is a log parse operation binding the contract event 0x47cc13c0d0733c86b121e1efaaf1554a8e2fa62e4db238e28f492d837b3b0cbf.
//
// Solidity: event DepositActivated(uint32 indexed poolId)
func (_Main *MainFilterer) ParseDepositActivated(log types.Log) (*MainDepositActivated, error) {
	event := new(MainDepositActivated)
	if err := _Main.contract.UnpackLog(event, "DepositActivated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainDepositInitiatedIterator is returned from FilterDepositInitiated and is used to iterate over the raw logs and unpacked data for DepositInitiated events raised by the Main contract.
type MainDepositInitiatedIterator struct {
	Event *MainDepositInitiated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainDepositInitiatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainDepositInitiated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainDepositInitiated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainDepositInitiatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainDepositInitiatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainDepositInitiated represents a DepositInitiated event raised by the Main contract.
type MainDepositInitiated struct {
	PoolId uint32
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterDepositInitiated is a free log retrieval operation binding the contract event 0xcb269e0cb51e3b2e94cbce3ed406b42b7b3f9506eda093aac04fe3023f71005f.
//
// Solidity: event DepositInitiated(uint32 indexed poolId)
func (_Main *MainFilterer) FilterDepositInitiated(opts *bind.FilterOpts, poolId []uint32) (*MainDepositInitiatedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "DepositInitiated", poolIdRule)
	if err != nil {
		return nil, err
	}
	return &MainDepositInitiatedIterator{contract: _Main.contract, event: "DepositInitiated", logs: logs, sub: sub}, nil
}

// WatchDepositInitiated is a free log subscription operation binding the contract event 0xcb269e0cb51e3b2e94cbce3ed406b42b7b3f9506eda093aac04fe3023f71005f.
//
// Solidity: event DepositInitiated(uint32 indexed poolId)
func (_Main *MainFilterer) WatchDepositInitiated(opts *bind.WatchOpts, sink chan<- *MainDepositInitiated, poolId []uint32) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "DepositInitiated", poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainDepositInitiated)
				if err := _Main.contract.UnpackLog(event, "DepositInitiated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseDepositInitiated is a log parse operation binding the contract event 0xcb269e0cb51e3b2e94cbce3ed406b42b7b3f9506eda093aac04fe3023f71005f.
//
// Solidity: event DepositInitiated(uint32 indexed poolId)
func (_Main *MainFilterer) ParseDepositInitiated(log types.Log) (*MainDepositInitiated, error) {
	event := new(MainDepositInitiated)
	if err := _Main.contract.UnpackLog(event, "DepositInitiated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainDepositRequestedIterator is returned from FilterDepositRequested and is used to iterate over the raw logs and unpacked data for DepositRequested events raised by the Main contract.
type MainDepositRequestedIterator struct {
	Event *MainDepositRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainDepositRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainDepositRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainDepositRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainDepositRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainDepositRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainDepositRequested represents a DepositRequested event raised by the Main contract.
type MainDepositRequested struct {
	PoolId uint32
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterDepositRequested is a free log retrieval operation binding the contract event 0xcb5c918897d5a5273152963ee11ce1564cf0b651342e29f8fe161ee52ba04630.
//
// Solidity: event DepositRequested(uint32 indexed poolId)
func (_Main *MainFilterer) FilterDepositRequested(opts *bind.FilterOpts, poolId []uint32) (*MainDepositRequestedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "DepositRequested", poolIdRule)
	if err != nil {
		return nil, err
	}
	return &MainDepositRequestedIterator{contract: _Main.contract, event: "DepositRequested", logs: logs, sub: sub}, nil
}

// WatchDepositRequested is a free log subscription operation binding the contract event 0xcb5c918897d5a5273152963ee11ce1564cf0b651342e29f8fe161ee52ba04630.
//
// Solidity: event DepositRequested(uint32 indexed poolId)
func (_Main *MainFilterer) WatchDepositRequested(opts *bind.WatchOpts, sink chan<- *MainDepositRequested, poolId []uint32) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "DepositRequested", poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainDepositRequested)
				if err := _Main.contract.UnpackLog(event, "DepositRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseDepositRequested is a log parse operation binding the contract event 0xcb5c918897d5a5273152963ee11ce1564cf0b651342e29f8fe161ee52ba04630.
//
// Solidity: event DepositRequested(uint32 indexed poolId)
func (_Main *MainFilterer) ParseDepositRequested(log types.Log) (*MainDepositRequested, error) {
	event := new(MainDepositRequested)
	if err := _Main.contract.UnpackLog(event, "DepositRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainExitCompletedIterator is returned from FilterExitCompleted and is used to iterate over the raw logs and unpacked data for ExitCompleted events raised by the Main contract.
type MainExitCompletedIterator struct {
	Event *MainExitCompleted // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainExitCompletedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainExitCompleted)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainExitCompleted)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainExitCompletedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainExitCompletedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainExitCompleted represents a ExitCompleted event raised by the Main contract.
type MainExitCompleted struct {
	PoolId uint32
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterExitCompleted is a free log retrieval operation binding the contract event 0x4ab3ec53a27d9876941ac7b3ddc5c26553f8e08c95669c555c4c5eb9b32fe811.
//
// Solidity: event ExitCompleted(uint32 indexed poolId)
func (_Main *MainFilterer) FilterExitCompleted(opts *bind.FilterOpts, poolId []uint32) (*MainExitCompletedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "ExitCompleted", poolIdRule)
	if err != nil {
		return nil, err
	}
	return &MainExitCompletedIterator{contract: _Main.contract, event: "ExitCompleted", logs: logs, sub: sub}, nil
}

// WatchExitCompleted is a free log subscription operation binding the contract event 0x4ab3ec53a27d9876941ac7b3ddc5c26553f8e08c95669c555c4c5eb9b32fe811.
//
// Solidity: event ExitCompleted(uint32 indexed poolId)
func (_Main *MainFilterer) WatchExitCompleted(opts *bind.WatchOpts, sink chan<- *MainExitCompleted, poolId []uint32) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "ExitCompleted", poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainExitCompleted)
				if err := _Main.contract.UnpackLog(event, "ExitCompleted", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseExitCompleted is a log parse operation binding the contract event 0x4ab3ec53a27d9876941ac7b3ddc5c26553f8e08c95669c555c4c5eb9b32fe811.
//
// Solidity: event ExitCompleted(uint32 indexed poolId)
func (_Main *MainFilterer) ParseExitCompleted(log types.Log) (*MainExitCompleted, error) {
	event := new(MainExitCompleted)
	if err := _Main.contract.UnpackLog(event, "ExitCompleted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainExitRequestedIterator is returned from FilterExitRequested and is used to iterate over the raw logs and unpacked data for ExitRequested events raised by the Main contract.
type MainExitRequestedIterator struct {
	Event *MainExitRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainExitRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainExitRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainExitRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainExitRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainExitRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainExitRequested represents a ExitRequested event raised by the Main contract.
type MainExitRequested struct {
	PoolId uint32
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterExitRequested is a free log retrieval operation binding the contract event 0x22f0bbd39772e68a16caa935d437e997aea4854e3db82046a9edf222c0065345.
//
// Solidity: event ExitRequested(uint32 indexed poolId)
func (_Main *MainFilterer) FilterExitRequested(opts *bind.FilterOpts, poolId []uint32) (*MainExitRequestedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "ExitRequested", poolIdRule)
	if err != nil {
		return nil, err
	}
	return &MainExitRequestedIterator{contract: _Main.contract, event: "ExitRequested", logs: logs, sub: sub}, nil
}

// WatchExitRequested is a free log subscription operation binding the contract event 0x22f0bbd39772e68a16caa935d437e997aea4854e3db82046a9edf222c0065345.
//
// Solidity: event ExitRequested(uint32 indexed poolId)
func (_Main *MainFilterer) WatchExitRequested(opts *bind.WatchOpts, sink chan<- *MainExitRequested, poolId []uint32) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "ExitRequested", poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainExitRequested)
				if err := _Main.contract.UnpackLog(event, "ExitRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseExitRequested is a log parse operation binding the contract event 0x22f0bbd39772e68a16caa935d437e997aea4854e3db82046a9edf222c0065345.
//
// Solidity: event ExitRequested(uint32 indexed poolId)
func (_Main *MainFilterer) ParseExitRequested(log types.Log) (*MainExitRequested, error) {
	event := new(MainExitRequested)
	if err := _Main.contract.UnpackLog(event, "ExitRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainForcedExitReportsRequestedIterator is returned from FilterForcedExitReportsRequested and is used to iterate over the raw logs and unpacked data for ForcedExitReportsRequested events raised by the Main contract.
type MainForcedExitReportsRequestedIterator struct {
	Event *MainForcedExitReportsRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainForcedExitReportsRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainForcedExitReportsRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainForcedExitReportsRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainForcedExitReportsRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainForcedExitReportsRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainForcedExitReportsRequested represents a ForcedExitReportsRequested event raised by the Main contract.
type MainForcedExitReportsRequested struct {
	Count *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterForcedExitReportsRequested is a free log retrieval operation binding the contract event 0x6c2aac12c3b087390d54813fb777f4bbf13f6d18f0d79199df88e565d22605a0.
//
// Solidity: event ForcedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) FilterForcedExitReportsRequested(opts *bind.FilterOpts) (*MainForcedExitReportsRequestedIterator, error) {

	logs, sub, err := _Main.contract.FilterLogs(opts, "ForcedExitReportsRequested")
	if err != nil {
		return nil, err
	}
	return &MainForcedExitReportsRequestedIterator{contract: _Main.contract, event: "ForcedExitReportsRequested", logs: logs, sub: sub}, nil
}

// WatchForcedExitReportsRequested is a free log subscription operation binding the contract event 0x6c2aac12c3b087390d54813fb777f4bbf13f6d18f0d79199df88e565d22605a0.
//
// Solidity: event ForcedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) WatchForcedExitReportsRequested(opts *bind.WatchOpts, sink chan<- *MainForcedExitReportsRequested) (event.Subscription, error) {

	logs, sub, err := _Main.contract.WatchLogs(opts, "ForcedExitReportsRequested")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainForcedExitReportsRequested)
				if err := _Main.contract.UnpackLog(event, "ForcedExitReportsRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseForcedExitReportsRequested is a log parse operation binding the contract event 0x6c2aac12c3b087390d54813fb777f4bbf13f6d18f0d79199df88e565d22605a0.
//
// Solidity: event ForcedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) ParseForcedExitReportsRequested(log types.Log) (*MainForcedExitReportsRequested, error) {
	event := new(MainForcedExitReportsRequested)
	if err := _Main.contract.UnpackLog(event, "ForcedExitReportsRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the Main contract.
type MainOwnershipTransferredIterator struct {
	Event *MainOwnershipTransferred // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainOwnershipTransferred)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainOwnershipTransferred)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainOwnershipTransferred represents a OwnershipTransferred event raised by the Main contract.
type MainOwnershipTransferred struct {
	PreviousOwner common.Address
	NewOwner      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Main *MainFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts, previousOwner []common.Address, newOwner []common.Address) (*MainOwnershipTransferredIterator, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return &MainOwnershipTransferredIterator{contract: _Main.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Main *MainFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *MainOwnershipTransferred, previousOwner []common.Address, newOwner []common.Address) (event.Subscription, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainOwnershipTransferred)
				if err := _Main.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseOwnershipTransferred is a log parse operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Main *MainFilterer) ParseOwnershipTransferred(log types.Log) (*MainOwnershipTransferred, error) {
	event := new(MainOwnershipTransferred)
	if err := _Main.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainReshareCompletedIterator is returned from FilterReshareCompleted and is used to iterate over the raw logs and unpacked data for ReshareCompleted events raised by the Main contract.
type MainReshareCompletedIterator struct {
	Event *MainReshareCompleted // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainReshareCompletedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainReshareCompleted)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainReshareCompleted)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainReshareCompletedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainReshareCompletedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainReshareCompleted represents a ReshareCompleted event raised by the Main contract.
type MainReshareCompleted struct {
	PoolId uint32
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterReshareCompleted is a free log retrieval operation binding the contract event 0xb157673964a38ef2dc8dbf337bf59ed140f0e037c5004f9e64b3fade3d03107b.
//
// Solidity: event ReshareCompleted(uint32 indexed poolId)
func (_Main *MainFilterer) FilterReshareCompleted(opts *bind.FilterOpts, poolId []uint32) (*MainReshareCompletedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "ReshareCompleted", poolIdRule)
	if err != nil {
		return nil, err
	}
	return &MainReshareCompletedIterator{contract: _Main.contract, event: "ReshareCompleted", logs: logs, sub: sub}, nil
}

// WatchReshareCompleted is a free log subscription operation binding the contract event 0xb157673964a38ef2dc8dbf337bf59ed140f0e037c5004f9e64b3fade3d03107b.
//
// Solidity: event ReshareCompleted(uint32 indexed poolId)
func (_Main *MainFilterer) WatchReshareCompleted(opts *bind.WatchOpts, sink chan<- *MainReshareCompleted, poolId []uint32) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "ReshareCompleted", poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainReshareCompleted)
				if err := _Main.contract.UnpackLog(event, "ReshareCompleted", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseReshareCompleted is a log parse operation binding the contract event 0xb157673964a38ef2dc8dbf337bf59ed140f0e037c5004f9e64b3fade3d03107b.
//
// Solidity: event ReshareCompleted(uint32 indexed poolId)
func (_Main *MainFilterer) ParseReshareCompleted(log types.Log) (*MainReshareCompleted, error) {
	event := new(MainReshareCompleted)
	if err := _Main.contract.UnpackLog(event, "ReshareCompleted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainResharesRequestedIterator is returned from FilterResharesRequested and is used to iterate over the raw logs and unpacked data for ResharesRequested events raised by the Main contract.
type MainResharesRequestedIterator struct {
	Event *MainResharesRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainResharesRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainResharesRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainResharesRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainResharesRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainResharesRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainResharesRequested represents a ResharesRequested event raised by the Main contract.
type MainResharesRequested struct {
	OperatorId uint64
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterResharesRequested is a free log retrieval operation binding the contract event 0x26fa0cf8467f09034e61537261071d9c09281e064ca254846c412f9dcdb2c6af.
//
// Solidity: event ResharesRequested(uint64 indexed operatorId)
func (_Main *MainFilterer) FilterResharesRequested(opts *bind.FilterOpts, operatorId []uint64) (*MainResharesRequestedIterator, error) {

	var operatorIdRule []interface{}
	for _, operatorIdItem := range operatorId {
		operatorIdRule = append(operatorIdRule, operatorIdItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "ResharesRequested", operatorIdRule)
	if err != nil {
		return nil, err
	}
	return &MainResharesRequestedIterator{contract: _Main.contract, event: "ResharesRequested", logs: logs, sub: sub}, nil
}

// WatchResharesRequested is a free log subscription operation binding the contract event 0x26fa0cf8467f09034e61537261071d9c09281e064ca254846c412f9dcdb2c6af.
//
// Solidity: event ResharesRequested(uint64 indexed operatorId)
func (_Main *MainFilterer) WatchResharesRequested(opts *bind.WatchOpts, sink chan<- *MainResharesRequested, operatorId []uint64) (event.Subscription, error) {

	var operatorIdRule []interface{}
	for _, operatorIdItem := range operatorId {
		operatorIdRule = append(operatorIdRule, operatorIdItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "ResharesRequested", operatorIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainResharesRequested)
				if err := _Main.contract.UnpackLog(event, "ResharesRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseResharesRequested is a log parse operation binding the contract event 0x26fa0cf8467f09034e61537261071d9c09281e064ca254846c412f9dcdb2c6af.
//
// Solidity: event ResharesRequested(uint64 indexed operatorId)
func (_Main *MainFilterer) ParseResharesRequested(log types.Log) (*MainResharesRequested, error) {
	event := new(MainResharesRequested)
	if err := _Main.contract.UnpackLog(event, "ResharesRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainRewardsDepositedIterator is returned from FilterRewardsDeposited and is used to iterate over the raw logs and unpacked data for RewardsDeposited events raised by the Main contract.
type MainRewardsDepositedIterator struct {
	Event *MainRewardsDeposited // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainRewardsDepositedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainRewardsDeposited)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainRewardsDeposited)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainRewardsDepositedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainRewardsDepositedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainRewardsDeposited represents a RewardsDeposited event raised by the Main contract.
type MainRewardsDeposited struct {
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterRewardsDeposited is a free log retrieval operation binding the contract event 0x4e9221f2cca6ca0397acc6004ea0b716798254f5abcf53924fab34f0373e5d4e.
//
// Solidity: event RewardsDeposited(uint256 amount)
func (_Main *MainFilterer) FilterRewardsDeposited(opts *bind.FilterOpts) (*MainRewardsDepositedIterator, error) {

	logs, sub, err := _Main.contract.FilterLogs(opts, "RewardsDeposited")
	if err != nil {
		return nil, err
	}
	return &MainRewardsDepositedIterator{contract: _Main.contract, event: "RewardsDeposited", logs: logs, sub: sub}, nil
}

// WatchRewardsDeposited is a free log subscription operation binding the contract event 0x4e9221f2cca6ca0397acc6004ea0b716798254f5abcf53924fab34f0373e5d4e.
//
// Solidity: event RewardsDeposited(uint256 amount)
func (_Main *MainFilterer) WatchRewardsDeposited(opts *bind.WatchOpts, sink chan<- *MainRewardsDeposited) (event.Subscription, error) {

	logs, sub, err := _Main.contract.WatchLogs(opts, "RewardsDeposited")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainRewardsDeposited)
				if err := _Main.contract.UnpackLog(event, "RewardsDeposited", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseRewardsDeposited is a log parse operation binding the contract event 0x4e9221f2cca6ca0397acc6004ea0b716798254f5abcf53924fab34f0373e5d4e.
//
// Solidity: event RewardsDeposited(uint256 amount)
func (_Main *MainFilterer) ParseRewardsDeposited(log types.Log) (*MainRewardsDeposited, error) {
	event := new(MainRewardsDeposited)
	if err := _Main.contract.UnpackLog(event, "RewardsDeposited", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainSlashedExitReportsRequestedIterator is returned from FilterSlashedExitReportsRequested and is used to iterate over the raw logs and unpacked data for SlashedExitReportsRequested events raised by the Main contract.
type MainSlashedExitReportsRequestedIterator struct {
	Event *MainSlashedExitReportsRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainSlashedExitReportsRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainSlashedExitReportsRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainSlashedExitReportsRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainSlashedExitReportsRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainSlashedExitReportsRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainSlashedExitReportsRequested represents a SlashedExitReportsRequested event raised by the Main contract.
type MainSlashedExitReportsRequested struct {
	Count *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterSlashedExitReportsRequested is a free log retrieval operation binding the contract event 0x22f410f2657b6345d01345fa883150623fe5331f91506e9b89d252a9d73a2078.
//
// Solidity: event SlashedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) FilterSlashedExitReportsRequested(opts *bind.FilterOpts) (*MainSlashedExitReportsRequestedIterator, error) {

	logs, sub, err := _Main.contract.FilterLogs(opts, "SlashedExitReportsRequested")
	if err != nil {
		return nil, err
	}
	return &MainSlashedExitReportsRequestedIterator{contract: _Main.contract, event: "SlashedExitReportsRequested", logs: logs, sub: sub}, nil
}

// WatchSlashedExitReportsRequested is a free log subscription operation binding the contract event 0x22f410f2657b6345d01345fa883150623fe5331f91506e9b89d252a9d73a2078.
//
// Solidity: event SlashedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) WatchSlashedExitReportsRequested(opts *bind.WatchOpts, sink chan<- *MainSlashedExitReportsRequested) (event.Subscription, error) {

	logs, sub, err := _Main.contract.WatchLogs(opts, "SlashedExitReportsRequested")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainSlashedExitReportsRequested)
				if err := _Main.contract.UnpackLog(event, "SlashedExitReportsRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseSlashedExitReportsRequested is a log parse operation binding the contract event 0x22f410f2657b6345d01345fa883150623fe5331f91506e9b89d252a9d73a2078.
//
// Solidity: event SlashedExitReportsRequested(uint256 count)
func (_Main *MainFilterer) ParseSlashedExitReportsRequested(log types.Log) (*MainSlashedExitReportsRequested, error) {
	event := new(MainSlashedExitReportsRequested)
	if err := _Main.contract.UnpackLog(event, "SlashedExitReportsRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainStakeDepositedIterator is returned from FilterStakeDeposited and is used to iterate over the raw logs and unpacked data for StakeDeposited events raised by the Main contract.
type MainStakeDepositedIterator struct {
	Event *MainStakeDeposited // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainStakeDepositedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainStakeDeposited)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainStakeDeposited)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainStakeDepositedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainStakeDepositedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainStakeDeposited represents a StakeDeposited event raised by the Main contract.
type MainStakeDeposited struct {
	Sender common.Address
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterStakeDeposited is a free log retrieval operation binding the contract event 0x0a7bb2e28cc4698aac06db79cf9163bfcc20719286cf59fa7d492ceda1b8edc2.
//
// Solidity: event StakeDeposited(address indexed sender, uint256 amount)
func (_Main *MainFilterer) FilterStakeDeposited(opts *bind.FilterOpts, sender []common.Address) (*MainStakeDepositedIterator, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "StakeDeposited", senderRule)
	if err != nil {
		return nil, err
	}
	return &MainStakeDepositedIterator{contract: _Main.contract, event: "StakeDeposited", logs: logs, sub: sub}, nil
}

// WatchStakeDeposited is a free log subscription operation binding the contract event 0x0a7bb2e28cc4698aac06db79cf9163bfcc20719286cf59fa7d492ceda1b8edc2.
//
// Solidity: event StakeDeposited(address indexed sender, uint256 amount)
func (_Main *MainFilterer) WatchStakeDeposited(opts *bind.WatchOpts, sink chan<- *MainStakeDeposited, sender []common.Address) (event.Subscription, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "StakeDeposited", senderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainStakeDeposited)
				if err := _Main.contract.UnpackLog(event, "StakeDeposited", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseStakeDeposited is a log parse operation binding the contract event 0x0a7bb2e28cc4698aac06db79cf9163bfcc20719286cf59fa7d492ceda1b8edc2.
//
// Solidity: event StakeDeposited(address indexed sender, uint256 amount)
func (_Main *MainFilterer) ParseStakeDeposited(log types.Log) (*MainStakeDeposited, error) {
	event := new(MainStakeDeposited)
	if err := _Main.contract.UnpackLog(event, "StakeDeposited", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainStakeRebalancedIterator is returned from FilterStakeRebalanced and is used to iterate over the raw logs and unpacked data for StakeRebalanced events raised by the Main contract.
type MainStakeRebalancedIterator struct {
	Event *MainStakeRebalanced // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainStakeRebalancedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainStakeRebalanced)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainStakeRebalanced)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainStakeRebalancedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainStakeRebalancedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainStakeRebalanced represents a StakeRebalanced event raised by the Main contract.
type MainStakeRebalanced struct {
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterStakeRebalanced is a free log retrieval operation binding the contract event 0x98272bf4346d2df18cd71298e274359d2bdc8caa09a958b3055156f211d897e4.
//
// Solidity: event StakeRebalanced(uint256 amount)
func (_Main *MainFilterer) FilterStakeRebalanced(opts *bind.FilterOpts) (*MainStakeRebalancedIterator, error) {

	logs, sub, err := _Main.contract.FilterLogs(opts, "StakeRebalanced")
	if err != nil {
		return nil, err
	}
	return &MainStakeRebalancedIterator{contract: _Main.contract, event: "StakeRebalanced", logs: logs, sub: sub}, nil
}

// WatchStakeRebalanced is a free log subscription operation binding the contract event 0x98272bf4346d2df18cd71298e274359d2bdc8caa09a958b3055156f211d897e4.
//
// Solidity: event StakeRebalanced(uint256 amount)
func (_Main *MainFilterer) WatchStakeRebalanced(opts *bind.WatchOpts, sink chan<- *MainStakeRebalanced) (event.Subscription, error) {

	logs, sub, err := _Main.contract.WatchLogs(opts, "StakeRebalanced")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainStakeRebalanced)
				if err := _Main.contract.UnpackLog(event, "StakeRebalanced", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseStakeRebalanced is a log parse operation binding the contract event 0x98272bf4346d2df18cd71298e274359d2bdc8caa09a958b3055156f211d897e4.
//
// Solidity: event StakeRebalanced(uint256 amount)
func (_Main *MainFilterer) ParseStakeRebalanced(log types.Log) (*MainStakeRebalanced, error) {
	event := new(MainStakeRebalanced)
	if err := _Main.contract.UnpackLog(event, "StakeRebalanced", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainTipsDepositedIterator is returned from FilterTipsDeposited and is used to iterate over the raw logs and unpacked data for TipsDeposited events raised by the Main contract.
type MainTipsDepositedIterator struct {
	Event *MainTipsDeposited // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainTipsDepositedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainTipsDeposited)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainTipsDeposited)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainTipsDepositedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainTipsDepositedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainTipsDeposited represents a TipsDeposited event raised by the Main contract.
type MainTipsDeposited struct {
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterTipsDeposited is a free log retrieval operation binding the contract event 0xf8658710ce7e8a4a5b7a98ce1af4f298996ad35241a321612e5d55e88b04e753.
//
// Solidity: event TipsDeposited(uint256 amount)
func (_Main *MainFilterer) FilterTipsDeposited(opts *bind.FilterOpts) (*MainTipsDepositedIterator, error) {

	logs, sub, err := _Main.contract.FilterLogs(opts, "TipsDeposited")
	if err != nil {
		return nil, err
	}
	return &MainTipsDepositedIterator{contract: _Main.contract, event: "TipsDeposited", logs: logs, sub: sub}, nil
}

// WatchTipsDeposited is a free log subscription operation binding the contract event 0xf8658710ce7e8a4a5b7a98ce1af4f298996ad35241a321612e5d55e88b04e753.
//
// Solidity: event TipsDeposited(uint256 amount)
func (_Main *MainFilterer) WatchTipsDeposited(opts *bind.WatchOpts, sink chan<- *MainTipsDeposited) (event.Subscription, error) {

	logs, sub, err := _Main.contract.WatchLogs(opts, "TipsDeposited")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainTipsDeposited)
				if err := _Main.contract.UnpackLog(event, "TipsDeposited", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseTipsDeposited is a log parse operation binding the contract event 0xf8658710ce7e8a4a5b7a98ce1af4f298996ad35241a321612e5d55e88b04e753.
//
// Solidity: event TipsDeposited(uint256 amount)
func (_Main *MainFilterer) ParseTipsDeposited(log types.Log) (*MainTipsDeposited, error) {
	event := new(MainTipsDeposited)
	if err := _Main.contract.UnpackLog(event, "TipsDeposited", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainWithdrawalInitiatedIterator is returned from FilterWithdrawalInitiated and is used to iterate over the raw logs and unpacked data for WithdrawalInitiated events raised by the Main contract.
type MainWithdrawalInitiatedIterator struct {
	Event *MainWithdrawalInitiated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainWithdrawalInitiatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainWithdrawalInitiated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainWithdrawalInitiated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainWithdrawalInitiatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainWithdrawalInitiatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainWithdrawalInitiated represents a WithdrawalInitiated event raised by the Main contract.
type MainWithdrawalInitiated struct {
	Sender common.Address
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterWithdrawalInitiated is a free log retrieval operation binding the contract event 0x6d92f7d3303f995bf21956bb0c51b388bae348eaf45c23debd2cfa3fcd9ec646.
//
// Solidity: event WithdrawalInitiated(address indexed sender, uint256 amount)
func (_Main *MainFilterer) FilterWithdrawalInitiated(opts *bind.FilterOpts, sender []common.Address) (*MainWithdrawalInitiatedIterator, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "WithdrawalInitiated", senderRule)
	if err != nil {
		return nil, err
	}
	return &MainWithdrawalInitiatedIterator{contract: _Main.contract, event: "WithdrawalInitiated", logs: logs, sub: sub}, nil
}

// WatchWithdrawalInitiated is a free log subscription operation binding the contract event 0x6d92f7d3303f995bf21956bb0c51b388bae348eaf45c23debd2cfa3fcd9ec646.
//
// Solidity: event WithdrawalInitiated(address indexed sender, uint256 amount)
func (_Main *MainFilterer) WatchWithdrawalInitiated(opts *bind.WatchOpts, sink chan<- *MainWithdrawalInitiated, sender []common.Address) (event.Subscription, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "WithdrawalInitiated", senderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainWithdrawalInitiated)
				if err := _Main.contract.UnpackLog(event, "WithdrawalInitiated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseWithdrawalInitiated is a log parse operation binding the contract event 0x6d92f7d3303f995bf21956bb0c51b388bae348eaf45c23debd2cfa3fcd9ec646.
//
// Solidity: event WithdrawalInitiated(address indexed sender, uint256 amount)
func (_Main *MainFilterer) ParseWithdrawalInitiated(log types.Log) (*MainWithdrawalInitiated, error) {
	event := new(MainWithdrawalInitiated)
	if err := _Main.contract.UnpackLog(event, "WithdrawalInitiated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// MainWithdrawalRequestedIterator is returned from FilterWithdrawalRequested and is used to iterate over the raw logs and unpacked data for WithdrawalRequested events raised by the Main contract.
type MainWithdrawalRequestedIterator struct {
	Event *MainWithdrawalRequested // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *MainWithdrawalRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(MainWithdrawalRequested)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(MainWithdrawalRequested)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *MainWithdrawalRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *MainWithdrawalRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// MainWithdrawalRequested represents a WithdrawalRequested event raised by the Main contract.
type MainWithdrawalRequested struct {
	Sender common.Address
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterWithdrawalRequested is a free log retrieval operation binding the contract event 0xe670e4e82118d22a1f9ee18920455ebc958bae26a90a05d31d3378788b1b0e44.
//
// Solidity: event WithdrawalRequested(address indexed sender, uint256 amount)
func (_Main *MainFilterer) FilterWithdrawalRequested(opts *bind.FilterOpts, sender []common.Address) (*MainWithdrawalRequestedIterator, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Main.contract.FilterLogs(opts, "WithdrawalRequested", senderRule)
	if err != nil {
		return nil, err
	}
	return &MainWithdrawalRequestedIterator{contract: _Main.contract, event: "WithdrawalRequested", logs: logs, sub: sub}, nil
}

// WatchWithdrawalRequested is a free log subscription operation binding the contract event 0xe670e4e82118d22a1f9ee18920455ebc958bae26a90a05d31d3378788b1b0e44.
//
// Solidity: event WithdrawalRequested(address indexed sender, uint256 amount)
func (_Main *MainFilterer) WatchWithdrawalRequested(opts *bind.WatchOpts, sink chan<- *MainWithdrawalRequested, sender []common.Address) (event.Subscription, error) {

	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Main.contract.WatchLogs(opts, "WithdrawalRequested", senderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(MainWithdrawalRequested)
				if err := _Main.contract.UnpackLog(event, "WithdrawalRequested", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseWithdrawalRequested is a log parse operation binding the contract event 0xe670e4e82118d22a1f9ee18920455ebc958bae26a90a05d31d3378788b1b0e44.
//
// Solidity: event WithdrawalRequested(address indexed sender, uint256 amount)
func (_Main *MainFilterer) ParseWithdrawalRequested(log types.Log) (*MainWithdrawalRequested, error) {
	event := new(MainWithdrawalRequested)
	if err := _Main.contract.UnpackLog(event, "WithdrawalRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
