# Solidity API

## CasimirManager

### Token

```solidity
enum Token {
  LINK,
  SSV,
  WETH
}
```

### latestActiveBalance

```solidity
uint256 latestActiveBalance
```

Latest active (consensus) balance

### latestActiveStake

```solidity
uint256 latestActiveStake
```

Latest active (consensus) stake after fees

### lastPoolId

```solidity
uint32 lastPoolId
```

Last pool ID created

### stakeRatioSum

```solidity
uint256 stakeRatioSum
```

Sum of scaled rewards to stake ratios (intial value required)

### ethFeePercent

```solidity
uint32 ethFeePercent
```

ETH fee percentage

### linkFeePercent

```solidity
uint32 linkFeePercent
```

LINK fee percentage

### ssvFeePercent

```solidity
uint32 ssvFeePercent
```

SSV fee percentage

### constructor

```solidity
constructor(address beaconDepositAddress, address _dkgOracleAddress, address functionsOracleAddress, uint32 functionsSubscriptionId, address linkTokenAddress, address ssvNetworkAddress, address ssvTokenAddress, address swapFactoryAddress, address swapRouterAddress, address wethTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconDepositAddress | address | The Beacon deposit address |
| _dkgOracleAddress | address | The DKG oracle address |
| functionsOracleAddress | address | The Chainlink functions oracle address |
| functionsSubscriptionId | uint32 | The Chainlink functions subscription ID |
| linkTokenAddress | address | The Chainlink token address |
| ssvNetworkAddress | address | The SSV network address |
| ssvTokenAddress | address | The SSV token address |
| swapFactoryAddress | address | The Uniswap factory address |
| swapRouterAddress | address | The Uniswap router address |
| wethTokenAddress | address | The WETH contract address |

### depositStake

```solidity
function depositStake() external payable
```

Deposit user stake

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeBalance, uint256 sweptRewards, uint256 sweptExits, uint32 depositCount, uint32 exitCount) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeBalance | uint256 | The active consensus balance |
| sweptRewards | uint256 | The swept consensus rewards |
| sweptExits | uint256 | The swept consensus exits |
| depositCount | uint32 |  |
| exitCount | uint32 |  |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of stake to withdraw |

### initiateRequestedWithdrawals

```solidity
function initiateRequestedWithdrawals(uint256 count) external
```

Initiate a given count of requested withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of withdrawals to initiate |

### completePendingWithdrawals

```solidity
function completePendingWithdrawals(uint256 count) external
```

Complete a given count of pending withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of withdrawals to complete |

### initiatePoolDeposit

```solidity
function initiatePoolDeposit(bytes32 depositDataRoot, bytes publicKey, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, bytes signature, bytes withdrawalCredentials, uint256 feeAmount) external
```

Initiate the next ready pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | The deposit data root |
| publicKey | bytes | The validator public key |
| operatorIds | uint64[] | The operator IDs |
| shares | bytes | The operator shares |
| cluster | struct ISSVNetworkCore.Cluster |  |
| signature | bytes | The signature |
| withdrawalCredentials | bytes | The withdrawal credentials |
| feeAmount | uint256 | The fee amount |

### _getRevertMsg

```solidity
function _getRevertMsg(bytes _returnData) internal pure returns (string)
```

### requestPoolExits

```solidity
function requestPoolExits(uint256 count) external
```

Request a given count of staked pool exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of exits to request |

### completePoolExit

```solidity
function completePoolExit(uint256 poolIndex, uint256 validatorIndex) external
```

Complete a pool exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The staked pool index |
| validatorIndex | uint256 | The staked validator (internal) index |

### registerOperator

```solidity
function registerOperator(uint32 operatorId) external payable
```

Register an operator with the pool manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint32 | The operator ID |

### resharePool

```solidity
function resharePool(uint32 poolId, uint64[] operatorIds, bytes shares) external
```

Reshare a given pool's validator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| operatorIds | uint64[] | The operator IDs |
| shares | bytes | The operator shares |

### setFeePercents

```solidity
function setFeePercents(uint32 _ethFeePercent, uint32 _linkFeePercent, uint32 _ssvFeePercent) external
```

_Update fee percentages_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ethFeePercent | uint32 | The new ETH fee percentage |
| _linkFeePercent | uint32 | The new LINK fee percentage |
| _ssvFeePercent | uint32 | The new SSV fee percentage |

### setOracleAddress

```solidity
function setOracleAddress(address oracle) external
```

Update the functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracle | address | New oracle address |

### getStake

```solidity
function getStake() public view returns (uint256 stake)
```

Get the manager stake

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| stake | uint256 | The manager stake |

### getBufferedStake

```solidity
function getBufferedStake() public view returns (uint256 stake)
```

Get the manager buffered (execution) stake

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| stake | uint256 | The manager buffered (execution) stake |

### getPendingStake

```solidity
function getPendingStake() public view returns (uint256 stake)
```

Get the manager pending (consensus) stake

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| stake | uint256 | The manager pending (consensus) stake |

### getActiveStake

```solidity
function getActiveStake() public view returns (uint256 stake)
```

Get the manager active (consensus) stake

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| stake | uint256 | The manager active (consensus) stake |

### getUserStake

```solidity
function getUserStake(address userAddress) public view returns (uint256 userStake)
```

Get the total user stake for a given user address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userStake | uint256 | The total user stake |

### getReservedFees

```solidity
function getReservedFees() public view returns (uint256)
```

Get the manager reserved fees

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | reservedFees The manager reserved fees |

### getSweptBalance

```solidity
function getSweptBalance() public view returns (uint256 balance)
```

Get the manager swept balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | The manager swept balance |

### getFeePercent

```solidity
function getFeePercent() public view returns (uint32 feePercent)
```

Get the total fee percentage

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feePercent | uint32 | The total fee percentage |

### getRequestedWithdrawals

```solidity
function getRequestedWithdrawals() external view returns (uint256)
```

Get the total requested withdrawals

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | requestedWithdrawals The total requested withdrawals |

### getPendingWithdrawals

```solidity
function getPendingWithdrawals() external view returns (uint256)
```

Get the total pending withdrawals

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | pendingWithdrawals The total pending withdrawals |

### getRequestedWithdrawalQueue

```solidity
function getRequestedWithdrawalQueue() external view returns (struct ICasimirManager.Withdrawal[])
```

Get the requested withdrawal queue

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirManager.Withdrawal[] | requestedWithdrawalQueue The requested withdrawal queue |

### getPendingWithdrawalQueue

```solidity
function getPendingWithdrawalQueue() external view returns (struct ICasimirManager.Withdrawal[])
```

Get the pending withdrawal queue

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirManager.Withdrawal[] | pendingWithdrawalQueue The pending withdrawal queue |

### getValidatorPublicKeys

```solidity
function getValidatorPublicKeys() external view returns (bytes[])
```

Get validator public keys

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes[] | A list of pending and active validator public keys |

### getExitingValidatorCount

```solidity
function getExitingValidatorCount() external view returns (uint256)
```

Get the count of exiting validators

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The count of exiting validators |

### getFilledPoolIds

```solidity
function getFilledPoolIds() external view returns (uint32[])
```

Get a list of all filled pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all filled pool IDs |

### getReadyPoolIds

```solidity
function getReadyPoolIds() external view returns (uint32[])
```

Get a list of all ready pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all ready pool IDs |

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

Get a list of all pending pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all pending pool IDs |

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get a list of all staked pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all staked pool IDs |

### getOpenDeposits

```solidity
function getOpenDeposits() external view returns (uint256)
```

Get the total manager open deposits

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total manager open deposits |

### getPool

```solidity
function getPool(uint32 poolId) external view returns (struct ICasimirManager.Pool pool)
```

Get a pool by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | struct ICasimirManager.Pool | The pool details |

### getETHFeePercent

```solidity
function getETHFeePercent() external view returns (uint32)
```

Get the ETH fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | The ETH fee percentage to charge on each deposit |

### getLINKFeePercent

```solidity
function getLINKFeePercent() external view returns (uint32)
```

Get the LINK fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | The LINK fee percentage to charge on each deposit |

### getSSVFeePercent

```solidity
function getSSVFeePercent() external view returns (uint32)
```

Get the SSV fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | The SSV fee percentage to charge on each deposit |

### getSSVNetworkAddress

```solidity
function getSSVNetworkAddress() external view returns (address ssvNetworkAddress)
```

Get the SSV network address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ssvNetworkAddress | address | The SSV network address |

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address upkeepAddress)
```

Get the upkeep address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepAddress | address | The upkeep address |

### receive

```solidity
receive() external payable
```

_Will be removed in production
Used for mocking sweeps from Beacon to the manager_

## CasimirUpkeep

### reportHeartbeat

```solidity
uint256 reportHeartbeat
```

Oracle heartbeat

### poolCapacity

```solidity
uint256 poolCapacity
```

Pool capacity

### requestCBOR

```solidity
bytes requestCBOR
```

Binary request source code

### latestRequestId

```solidity
bytes32 latestRequestId
```

Latest request ID

### latestFulfilledRequestId

```solidity
bytes32 latestFulfilledRequestId
```

Latest fulfilled request ID

### fulfillGasLimit

```solidity
uint32 fulfillGasLimit
```

Fulfillment gas limit

### constructor

```solidity
constructor(address managerAddress, address functionsOracleAddress, uint64 _functionsSubscriptionId) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerAddress | address | The manager contract address |
| functionsOracleAddress | address | The functions oracle contract address |
| _functionsSubscriptionId | uint64 | The functions subscription ID |

### generateRequest

```solidity
function generateRequest(string source, bytes secrets, string[] args) public pure returns (bytes)
```

Generate a new Functions.Request(off-chain, saving gas)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| source | string | JavaScript source code |
| secrets | bytes | Encrypted secrets payload |
| args | string[] | List of arguments accessible from within the source code |

### setRequest

```solidity
function setRequest(uint32 _fulfillGasLimit, uint64 _functionsSubscriptionId, bytes _requestCBOR) external
```

Set the bytes representing the CBOR-encoded Functions.Request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _fulfillGasLimit | uint32 | Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function |
| _functionsSubscriptionId | uint64 | The functions billing subscription ID used to pay for Functions requests |
| _requestCBOR | bytes | Bytes representing the CBOR-encoded Functions.Request |

### checkUpkeep

```solidity
function checkUpkeep(bytes) public view returns (bool upkeepNeeded, bytes performData)
```

Check if the upkeep is needed

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepNeeded | bool | True if the upkeep is needed |
| performData | bytes |  |

### performUpkeep

```solidity
function performUpkeep(bytes) external
```

Perform the upkeep

### fulfillRequest

```solidity
function fulfillRequest(bytes32 requestId, bytes response, bytes err) internal
```

Callback that is invoked once the DON has resolved the request or hit an error

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the user code |
| err | bytes | Aggregated error from the user code or from the sweptStake pipeline Either response or error parameter will be set, but never both |

### setOracleAddress

```solidity
function setOracleAddress(address newOracleAddress) external
```

Update the functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOracleAddress | address | New oracle address |

### mockFulfillRequest

```solidity
function mockFulfillRequest(bytes32 requestId, bytes response, bytes err) external
```

Fulfill the request for testing

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the user code |
| err | bytes | Aggregated error from the user code or from the sweptStake pipeline Either response or error parameter will be set, but never both |

## ICasimirManager

### ProcessedDeposit

```solidity
struct ProcessedDeposit {
  uint256 ethAmount;
  uint256 linkAmount;
  uint256 ssvAmount;
}
```

### Pool

```solidity
struct Pool {
  uint256 deposits;
  bool exiting;
  uint256 reshareCount;
  bytes32 depositDataRoot;
  bytes publicKey;
  uint64[] operatorIds;
  bytes shares;
  bytes signature;
  bytes withdrawalCredentials;
}
```

### User

```solidity
struct User {
  uint256 stake0;
  uint256 stakeRatioSum0;
}
```

### Withdrawal

```solidity
struct Withdrawal {
  address user;
  uint256 amount;
}
```

### PoolDepositRequested

```solidity
event PoolDepositRequested(uint32 poolId)
```

### PoolDepositInitiated

```solidity
event PoolDepositInitiated(uint32 poolId)
```

### PoolDeposited

```solidity
event PoolDeposited(uint32 poolId)
```

### PoolReshareRequested

```solidity
event PoolReshareRequested(uint32 poolId)
```

### PoolReshared

```solidity
event PoolReshared(uint32 poolId)
```

### PoolExitRequested

```solidity
event PoolExitRequested(uint32 poolId)
```

### PoolExited

```solidity
event PoolExited(uint32 poolId)
```

### StakeDeposited

```solidity
event StakeDeposited(address sender, uint256 amount)
```

### StakeRebalanced

```solidity
event StakeRebalanced(uint256 amount)
```

### RewardsDeposited

```solidity
event RewardsDeposited(uint256 amount)
```

### WithdrawalRequested

```solidity
event WithdrawalRequested(address sender, uint256 amount)
```

### WithdrawalInitiated

```solidity
event WithdrawalInitiated(address sender, uint256 amount)
```

### WithdrawalCompleted

```solidity
event WithdrawalCompleted(address sender, uint256 amount)
```

### depositStake

```solidity
function depositStake() external payable
```

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeStake, uint256 sweptRewards, uint256 sweptExits, uint32 depositCount, uint32 exitCount) external
```

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

### initiateRequestedWithdrawals

```solidity
function initiateRequestedWithdrawals(uint256 count) external
```

### completePendingWithdrawals

```solidity
function completePendingWithdrawals(uint256 count) external
```

### initiatePoolDeposit

```solidity
function initiatePoolDeposit(bytes32 depositDataRoot, bytes publicKey, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, bytes signature, bytes withdrawalCredentials, uint256 feeAmount) external
```

### requestPoolExits

```solidity
function requestPoolExits(uint256 count) external
```

### completePoolExit

```solidity
function completePoolExit(uint256 poolIndex, uint256 validatorIndex) external
```

### setFeePercents

```solidity
function setFeePercents(uint32 ethFeePercent, uint32 linkFeePercent, uint32 ssvFeePercent) external
```

### setOracleAddress

```solidity
function setOracleAddress(address oracleAddress) external
```

### getFeePercent

```solidity
function getFeePercent() external view returns (uint32)
```

### getETHFeePercent

```solidity
function getETHFeePercent() external view returns (uint32)
```

### getLINKFeePercent

```solidity
function getLINKFeePercent() external view returns (uint32)
```

### getSSVFeePercent

```solidity
function getSSVFeePercent() external view returns (uint32)
```

### getValidatorPublicKeys

```solidity
function getValidatorPublicKeys() external view returns (bytes[])
```

### getExitingValidatorCount

```solidity
function getExitingValidatorCount() external view returns (uint256)
```

### getReadyPoolIds

```solidity
function getReadyPoolIds() external view returns (uint32[])
```

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

### getStake

```solidity
function getStake() external view returns (uint256)
```

### getBufferedStake

```solidity
function getBufferedStake() external view returns (uint256)
```

### getActiveStake

```solidity
function getActiveStake() external view returns (uint256)
```

### getOpenDeposits

```solidity
function getOpenDeposits() external view returns (uint256)
```

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

### getRequestedWithdrawals

```solidity
function getRequestedWithdrawals() external view returns (uint256)
```

### getPendingWithdrawals

```solidity
function getPendingWithdrawals() external view returns (uint256)
```

### getRequestedWithdrawalQueue

```solidity
function getRequestedWithdrawalQueue() external view returns (struct ICasimirManager.Withdrawal[])
```

### getPendingWithdrawalQueue

```solidity
function getPendingWithdrawalQueue() external view returns (struct ICasimirManager.Withdrawal[])
```

## ICasimirUpkeep

### OracleReport

```solidity
struct OracleReport {
  uint256 activeStake;
  uint256 sweptRewards;
  uint256 sweptExits;
}
```

### OCRResponse

```solidity
event OCRResponse(bytes32 requestId, bytes result, bytes err)
```

### UpkeepPerformed

```solidity
event UpkeepPerformed(bytes performData)
```

### checkUpkeep

```solidity
function checkUpkeep(bytes checkData) external returns (bool upkeepNeeded, bytes performData)
```

method that is simulated by the keepers to see if any work actually
needs to be performed. This method does does not actually need to be
executable, and since it is only ever simulated it can consume lots of gas.

_To ensure that it is never called, you may want to add the
cannotExecute modifier from KeeperBase to your implementation of this
method._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| checkData | bytes | specified in the upkeep registration so it is always the same for a registered upkeep. This can easily be broken down into specific arguments using `abi.decode`, so multiple upkeeps can be registered on the same contract and easily differentiated by the contract. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepNeeded | bool | boolean to indicate whether the keeper should call performUpkeep or not. |
| performData | bytes | bytes that the keeper should call performUpkeep with, if upkeep is needed. If you would like to encode data to decode later, try `abi.encode`. |

### performUpkeep

```solidity
function performUpkeep(bytes performData) external
```

method that is actually executed by the keepers, via the registry.
The data returned by the checkUpkeep simulation will be passed into
this method to actually be executed.

_The input to this method should not be trusted, and the caller of the
method should not even be restricted to any single registry. Anyone should
be able call it, and the input should be validated, there is no guarantee
that the data passed in is the performData returned from checkUpkeep. This
could happen due to malicious keepers, racing keepers, or simply a state
change while the performUpkeep transaction is waiting for confirmation.
Always validate the data passed in._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| performData | bytes | is the data which was passed back from the checkData simulation. If it is encoded, it can easily be decoded into other types by calling `abi.decode`. This data should not be trusted, and should be validated against the contract's current state. |

### setOracleAddress

```solidity
function setOracleAddress(address oracleAddress) external
```

### mockFulfillRequest

```solidity
function mockFulfillRequest(bytes32 requestId, bytes result, bytes err) external
```

## Types32Array

### remove

```solidity
function remove(uint32[] uint32Array, uint256 index) internal
```

_Remove a uint32 element from the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uint32Array | uint32[] | The array of uint32 |
| index | uint256 |  |

## TypesBytesArray

### remove

```solidity
function remove(bytes[] bytesArray, uint256 index) internal
```

_Remove a bytes element from the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| bytesArray | bytes[] | The array of bytes |
| index | uint256 | The index of the element to remove |

## TypesWithdrawalArray

### remove

```solidity
function remove(struct ICasimirManager.Withdrawal[] withdrawals, uint256 index) internal
```

_Remove a withdrawal from the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawals | struct ICasimirManager.Withdrawal[] | The array of withdrawals |
| index | uint256 | The index of the withdrawal to remove |

## TypesAddress

### send

```solidity
function send(address user, uint256 amount) internal
```

_Send ETH to a user_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user address |
| amount | uint256 | The amount of stake to send |

## IDepositContract

### DepositEvent

```solidity
event DepositEvent(bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)
```

A processed deposit event.

### deposit

```solidity
function deposit(bytes pubkey, bytes withdrawal_credentials, bytes signature, bytes32 deposit_data_root) external payable
```

Submit a Phase 0 DepositData object.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pubkey | bytes | A BLS12-381 public key. |
| withdrawal_credentials | bytes | Commitment to a public key for withdrawals. |
| signature | bytes | A BLS12-381 signature. |
| deposit_data_root | bytes32 | The SHA-256 hash of the SSZ-encoded DepositData object. Used as a protection against malformed input. |

### get_deposit_root

```solidity
function get_deposit_root() external view returns (bytes32)
```

Query the current deposit root hash.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The deposit root hash. |

### get_deposit_count

```solidity
function get_deposit_count() external view returns (bytes)
```

Query the current deposit count.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | The deposit count encoded as a little endian 64-bit number. |

## ISSVNetwork

### OperatorAdded

```solidity
event OperatorAdded(uint64 operatorId, address owner, bytes publicKey, uint256 fee)
```

_Emitted when a new operator has been added._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | operator's ID. |
| owner | address | Operator's ethereum address that can collect fees. |
| publicKey | bytes | Operator's public key. Will be used to encrypt secret shares of validators keys. |
| fee | uint256 | Operator's fee. |

### OperatorRemoved

```solidity
event OperatorRemoved(uint64 operatorId)
```

_Emitted when operator has been removed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | operator's ID. |

### OperatorWhitelistUpdated

```solidity
event OperatorWhitelistUpdated(uint64 operatorId, address whitelisted)
```

_Emitted when the whitelist of an operator is updated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | operator's ID. |
| whitelisted | address | operator's new whitelisted address. |

### ValidatorAdded

```solidity
event ValidatorAdded(address owner, uint64[] operatorIds, bytes publicKey, bytes shares, struct ISSVNetworkCore.Cluster cluster)
```

_Emitted when the validator has been added._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address |  |
| operatorIds | uint64[] | The operator ids list. |
| publicKey | bytes | The public key of a validator. |
| shares | bytes | snappy compressed shares(a set of encrypted and public shares). |
| cluster | struct ISSVNetworkCore.Cluster | All the cluster data. |

### ValidatorRemoved

```solidity
event ValidatorRemoved(address owner, uint64[] operatorIds, bytes publicKey, struct ISSVNetworkCore.Cluster cluster)
```

_Emitted when the validator is removed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address |  |
| operatorIds | uint64[] | The operator ids list. |
| publicKey | bytes | The public key of a validator. |
| cluster | struct ISSVNetworkCore.Cluster | All the cluster data. |

### OperatorFeeDeclared

```solidity
event OperatorFeeDeclared(address owner, uint64 operatorId, uint256 blockNumber, uint256 fee)
```

### OperatorFeeCancellationDeclared

```solidity
event OperatorFeeCancellationDeclared(address owner, uint64 operatorId)
```

### OperatorFeeExecuted

```solidity
event OperatorFeeExecuted(address owner, uint64 operatorId, uint256 blockNumber, uint256 fee)
```

_Emitted when an operator's fee is updated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | Operator's owner. |
| operatorId | uint64 |  |
| blockNumber | uint256 | from which block number. |
| fee | uint256 | updated fee value. |

### ClusterLiquidated

```solidity
event ClusterLiquidated(address owner, uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster)
```

### ClusterReactivated

```solidity
event ClusterReactivated(address owner, uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster)
```

### OperatorFeeIncreaseLimitUpdated

```solidity
event OperatorFeeIncreaseLimitUpdated(uint64 value)
```

### DeclareOperatorFeePeriodUpdated

```solidity
event DeclareOperatorFeePeriodUpdated(uint64 value)
```

### ExecuteOperatorFeePeriodUpdated

```solidity
event ExecuteOperatorFeePeriodUpdated(uint64 value)
```

### LiquidationThresholdPeriodUpdated

```solidity
event LiquidationThresholdPeriodUpdated(uint64 value)
```

### MinimumLiquidationCollateralUpdated

```solidity
event MinimumLiquidationCollateralUpdated(uint256 value)
```

### NetworkFeeUpdated

```solidity
event NetworkFeeUpdated(uint256 oldFee, uint256 newFee)
```

_Emitted when the network fee is updated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oldFee | uint256 | The old fee |
| newFee | uint256 | The new fee |

### NetworkEarningsWithdrawn

```solidity
event NetworkEarningsWithdrawn(uint256 value, address recipient)
```

_Emitted when transfer fees are withdrawn._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | The amount of tokens withdrawn. |
| recipient | address | The recipient address. |

### ClusterWithdrawn

```solidity
event ClusterWithdrawn(address owner, uint64[] operatorIds, uint256 value, struct ISSVNetworkCore.Cluster cluster)
```

### OperatorWithdrawn

```solidity
event OperatorWithdrawn(address owner, uint64 operatorId, uint256 value)
```

### ClusterDeposited

```solidity
event ClusterDeposited(address owner, uint64[] operatorIds, uint256 value, struct ISSVNetworkCore.Cluster cluster)
```

### FeeRecipientAddressUpdated

```solidity
event FeeRecipientAddressUpdated(address owner, address recipientAddress)
```

### initialize

```solidity
function initialize(string initialVersion_, contract IERC20 token_, uint64 operatorMaxFeeIncrease_, uint64 declareOperatorFeePeriod_, uint64 executeOperatorFeePeriod_, uint64 minimumBlocksBeforeLiquidation_, uint256 minimumLiquidationCollateral_) external
```

_Initializes the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initialVersion_ | string |  |
| token_ | contract IERC20 | The network token. |
| operatorMaxFeeIncrease_ | uint64 | The step limit to increase the operator fee |
| declareOperatorFeePeriod_ | uint64 | The period an operator needs to wait before they can approve their fee. |
| executeOperatorFeePeriod_ | uint64 | The length of the period in which an operator can approve their fee. |
| minimumBlocksBeforeLiquidation_ | uint64 |  |
| minimumLiquidationCollateral_ | uint256 |  |

### registerOperator

```solidity
function registerOperator(bytes publicKey, uint256 fee) external returns (uint64)
```

_Registers a new operator._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| publicKey | bytes | Operator's public key. Used to encrypt secret shares of validators keys. |
| fee | uint256 | operator's fee. When fee is set to zero (mostly for private operators), it can not be increased. |

### removeOperator

```solidity
function removeOperator(uint64 operatorId) external
```

_Removes an operator._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator's id. |

### setOperatorWhitelist

```solidity
function setOperatorWhitelist(uint64 operatorId, address whitelisted) external
```

### declareOperatorFee

```solidity
function declareOperatorFee(uint64 operatorId, uint256 fee) external
```

### executeOperatorFee

```solidity
function executeOperatorFee(uint64 operatorId) external
```

### cancelDeclaredOperatorFee

```solidity
function cancelDeclaredOperatorFee(uint64 operatorId) external
```

### reduceOperatorFee

```solidity
function reduceOperatorFee(uint64 operatorId, uint256 fee) external
```

### setFeeRecipientAddress

```solidity
function setFeeRecipientAddress(address feeRecipientAddress) external
```

### registerValidator

```solidity
function registerValidator(bytes publicKey, uint64[] operatorIds, bytes sharesEncrypted, uint256 amount, struct ISSVNetworkCore.Cluster cluster) external
```

### removeValidator

```solidity
function removeValidator(bytes publicKey, uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster) external
```

### liquidate

```solidity
function liquidate(address owner, uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster) external
```

### reactivate

```solidity
function reactivate(uint64[] operatorIds, uint256 amount, struct ISSVNetworkCore.Cluster cluster) external
```

### deposit

```solidity
function deposit(address owner, uint64[] operatorIds, uint256 amount, struct ISSVNetworkCore.Cluster cluster) external
```

### withdrawOperatorEarnings

```solidity
function withdrawOperatorEarnings(uint64 operatorId, uint256 tokenAmount) external
```

### withdrawOperatorEarnings

```solidity
function withdrawOperatorEarnings(uint64 operatorId) external
```

### withdraw

```solidity
function withdraw(uint64[] operatorIds, uint256 tokenAmount, struct ISSVNetworkCore.Cluster cluster) external
```

### updateNetworkFee

```solidity
function updateNetworkFee(uint256 fee) external
```

### withdrawNetworkEarnings

```solidity
function withdrawNetworkEarnings(uint256 amount) external
```

### updateOperatorFeeIncreaseLimit

```solidity
function updateOperatorFeeIncreaseLimit(uint64 newOperatorMaxFeeIncrease) external
```

### updateDeclareOperatorFeePeriod

```solidity
function updateDeclareOperatorFeePeriod(uint64 newDeclareOperatorFeePeriod) external
```

### updateExecuteOperatorFeePeriod

```solidity
function updateExecuteOperatorFeePeriod(uint64 newExecuteOperatorFeePeriod) external
```

### updateLiquidationThresholdPeriod

```solidity
function updateLiquidationThresholdPeriod(uint64 blocks) external
```

### updateMinimumLiquidationCollateral

```solidity
function updateMinimumLiquidationCollateral(uint256 amount) external
```

## ISSVNetworkCore

### Validator

```solidity
struct Validator {
  address owner;
  bool active;
}
```

### Snapshot

```solidity
struct Snapshot {
  uint64 block;
  uint64 index;
  uint64 balance;
}
```

### Operator

```solidity
struct Operator {
  address owner;
  uint64 fee;
  uint32 validatorCount;
  struct ISSVNetworkCore.Snapshot snapshot;
}
```

### OperatorFeeChangeRequest

```solidity
struct OperatorFeeChangeRequest {
  uint64 fee;
  uint64 approvalBeginTime;
  uint64 approvalEndTime;
}
```

### Cluster

```solidity
struct Cluster {
  uint32 validatorCount;
  uint64 networkFeeIndex;
  uint64 index;
  uint256 balance;
  bool active;
}
```

### DAO

```solidity
struct DAO {
  uint32 validatorCount;
  uint64 balance;
  uint64 block;
}
```

### Network

```solidity
struct Network {
  uint64 networkFee;
  uint64 networkFeeIndex;
  uint64 networkFeeIndexBlockNumber;
}
```

### CallerNotOwner

```solidity
error CallerNotOwner()
```

### CallerNotWhitelisted

```solidity
error CallerNotWhitelisted()
```

### FeeTooLow

```solidity
error FeeTooLow()
```

### FeeExceedsIncreaseLimit

```solidity
error FeeExceedsIncreaseLimit()
```

### NoFeeDelcared

```solidity
error NoFeeDelcared()
```

### ApprovalNotWithinTimeframe

```solidity
error ApprovalNotWithinTimeframe()
```

### OperatorDoesNotExist

```solidity
error OperatorDoesNotExist()
```

### InsufficientBalance

```solidity
error InsufficientBalance()
```

### ValidatorAlreadyExists

```solidity
error ValidatorAlreadyExists()
```

### ValidatorDoesNotExist

```solidity
error ValidatorDoesNotExist()
```

### ClusterNotLiquidatable

```solidity
error ClusterNotLiquidatable()
```

### InvalidPublicKeyLength

```solidity
error InvalidPublicKeyLength()
```

### InvalidOperatorIdsLength

```solidity
error InvalidOperatorIdsLength()
```

### ValidatorOwnedByOtherAddress

```solidity
error ValidatorOwnedByOtherAddress()
```

### ClusterAlreadyEnabled

```solidity
error ClusterAlreadyEnabled()
```

### ClusterIsLiquidated

```solidity
error ClusterIsLiquidated()
```

### ClusterDoesNotExists

```solidity
error ClusterDoesNotExists()
```

### IncorrectClusterState

```solidity
error IncorrectClusterState()
```

### UnsortedOperatorsList

```solidity
error UnsortedOperatorsList()
```

### NewBlockPeriodIsBelowMinimum

```solidity
error NewBlockPeriodIsBelowMinimum()
```

### ExceedValidatorLimit

```solidity
error ExceedValidatorLimit()
```

### TokenTransferFailed

```solidity
error TokenTransferFailed()
```

### SameFeeChangeNotAllowed

```solidity
error SameFeeChangeNotAllowed()
```

### FeeIncreaseNotAllowed

```solidity
error FeeIncreaseNotAllowed()
```

## IWETH9

### deposit

```solidity
function deposit() external payable
```

Deposit ether to get wrapped ether

### withdraw

```solidity
function withdraw(uint256) external
```

Withdraw wrapped ether to get ether

