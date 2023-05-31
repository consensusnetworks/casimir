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

### finalizableWithdrawnPoolCount

```solidity
uint256 finalizableWithdrawnPoolCount
```

Exited pool count

### onlyOracle

```solidity
modifier onlyOracle()
```

_Validate the caller is the manager oracle_

### onlyUpkeep

```solidity
modifier onlyUpkeep()
```

_Validate the caller is the upkeep contract_

### validateDeposit

```solidity
modifier validateDeposit()
```

_Validate a deposit_

### validDistribution

```solidity
modifier validDistribution(uint256 amount)
```

_Validate a distribution_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount to validate |

### constructor

```solidity
constructor(address _oracleAddress, address beaconDepositAddress, address functionsAddress, uint32 functionsSubscriptionId, address linkTokenAddress, address ssvNetworkAddress, address ssvTokenAddress, address swapFactoryAddress, address swapRouterAddress, address wethTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oracleAddress | address | The manager oracle address |
| beaconDepositAddress | address | The Beacon deposit address |
| functionsAddress | address | The Chainlink functions oracle address |
| functionsSubscriptionId | uint32 | The Chainlink functions subscription ID |
| linkTokenAddress | address | The Chainlink token address |
| ssvNetworkAddress | address | The SSV network address |
| ssvTokenAddress | address | The SSV token address |
| swapFactoryAddress | address | The Uniswap factory address |
| swapRouterAddress | address | The Uniswap router address |
| wethTokenAddress | address | The WETH contract address |

### receive

```solidity
receive() external payable
```

Redirect users to the deposit function

### depositStake

```solidity
function depositStake() external payable
```

Deposit user stake

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 withdrawnExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeBalance | uint256 | The active balance |
| sweptBalance | uint256 | The swept balance |
| activatedDeposits | uint256 | The count of activated deposits |
| withdrawnExits | uint256 | The count of withdrawn exits |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of stake to withdraw |

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
function initiatePoolDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount) external
```

Initiate the next ready pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | The deposit data root |
| publicKey | bytes | The validator public key |
| signature | bytes | The signature |
| withdrawalCredentials | bytes | The withdrawal credentials |
| operatorIds | uint64[] | The operator IDs |
| shares | bytes | The operator shares |
| cluster | struct ISSVNetworkCore.Cluster |  |
| feeAmount | uint256 | The fee amount |

### completePoolDeposits

```solidity
function completePoolDeposits(uint256 count) external
```

Complete a given count of the next pending pools

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of pools to complete |

### requestPoolUnexpectedExitReports

```solidity
function requestPoolUnexpectedExitReports(uint256 count) external
```

Request a given count of pool unexpected exit reports

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of pool unexpected exit reports |

### requestPoolSlashedExitReports

```solidity
function requestPoolSlashedExitReports(uint256 count) external
```

Request a given count of pool slashed exit reports

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of pool slashed exit reports |

### requestPoolWithdrawnExitReports

```solidity
function requestPoolWithdrawnExitReports(uint256 count) external
```

Request a given count of pool exit completions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of pool exits to complete |

### reportPoolUnexpectedExit

```solidity
function reportPoolUnexpectedExit(uint32 poolId) external
```

Report a pool unexpected exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

### reportPoolSlash

```solidity
function reportPoolSlash(uint32 poolId) external
```

Report a pool slash

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

### completePoolExit

```solidity
function completePoolExit(uint256 poolIndex, uint256 finalEffectiveBalance, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Complete a pool exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The staked pool index |
| finalEffectiveBalance | uint256 | The final effective balance |
| blamePercents | uint32[] | The operator blame percents (0 if balance is 32 ether) |
| cluster | struct ISSVNetworkCore.Cluster | The SSV cluster snapshot |

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

### setFunctionsAddress

```solidity
function setFunctionsAddress(address functionsAddress) external
```

Update the functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| functionsAddress | address | New functions oracle address |

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

### getTotalStake

```solidity
function getTotalStake() public view returns (uint256 totalStake)
```

Get the total stake

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalStake | uint256 | The total stake |

### getBufferedBalance

```solidity
function getBufferedBalance() public view returns (uint256 bufferedBalance)
```

Get the buffered balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bufferedBalance | uint256 | The buffered balance |

### getReadyBalance

```solidity
function getReadyBalance() public view returns (uint256 readyBalance)
```

Get the ready balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| readyBalance | uint256 | The ready balance |

### getPendingBalance

```solidity
function getPendingBalance() public view returns (uint256 pendingBalance)
```

Get the pending balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pendingBalance | uint256 | The pending balance |

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() public view returns (uint256)
```

Get the withdrawable balanace

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | withdrawableBalance The withdrawable balanace |

### getReservedFees

```solidity
function getReservedFees() public view returns (uint256)
```

Get the reserved fees

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | reservedFees The reserved fees |

### getSweptBalance

```solidity
function getSweptBalance() public view returns (uint256 balance)
```

Get the swept balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | The swept balance |

### getExpectedEffectiveBalance

```solidity
function getExpectedEffectiveBalance() public view returns (uint256 expectedEffectiveBalance)
```

Get the expected effective balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| expectedEffectiveBalance | uint256 | The expected effective balance |

### getReportPeriod

```solidity
function getReportPeriod() public view returns (uint32)
```

Get the report period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | reportPeriod The report period |

### getLatestActiveBalance

```solidity
function getLatestActiveBalance() public view returns (uint256)
```

Get the latest active balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | latestActiveBalance The latest active balance |

### getLatestActiveBalanceAfterFees

```solidity
function getLatestActiveBalanceAfterFees() public view returns (uint256)
```

Get the latest active balance after fees

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | latestActiveBalanceAfterFees The latest active balance after fees |

### getLatestActiveRewards

```solidity
function getLatestActiveRewards() public view returns (int256)
```

Get the latest active rewards

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 | latestRewards The latest active rewards |

### getReportFinalizableWithdrawnBalance

```solidity
function getReportFinalizableWithdrawnBalance() public view returns (uint256)
```

Get the finalizable withdrawn balance of the current reporting period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | reportFinalizableWithdrawnBalance The finalizable withdrawn balance of the current reporting period |

### getFinalizableWithdrawnPoolCount

```solidity
function getFinalizableWithdrawnPoolCount() public view returns (uint256)
```

Get the finalizable withdrawn pool count of the current reporting period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | finalizableWithdrawnPoolCount The finalizable withdrawn pool count of the current reporting period |

### getPendingWithdrawalQueue

```solidity
function getPendingWithdrawalQueue() public view returns (struct ICasimirManager.Withdrawal[])
```

Get the pending withdrawal queue

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirManager.Withdrawal[] | pendingWithdrawalQueue The pending withdrawal queue |

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) public view returns (bool)
```

Get the eligibility of a pending withdrawal

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | pendingWithdrawalEligibility The eligibility of a pending withdrawal |

### getPendingWithdrawals

```solidity
function getPendingWithdrawals() public view returns (uint256)
```

Get the total pending withdrawals

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | pendingWithdrawals The total pending withdrawals |

### getPendingWithdrawalCount

```solidity
function getPendingWithdrawalCount() public view returns (uint256)
```

Get the total pending withdrawal count

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | pendingWithdrawalCount The total pending withdrawal count |

### getFeePercent

```solidity
function getFeePercent() public view returns (uint32)
```

Get the total fee percentage

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | feePercent The total fee percentage |

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256)
```

Get the count of active pools

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | depositedPoolCount The count of active pools |

### getExitingPoolCount

```solidity
function getExitingPoolCount() external view returns (uint256)
```

Get the count of exiting pools

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | exitingPoolCount The count of exiting pools |

### getReadyPoolIds

```solidity
function getReadyPoolIds() external view returns (uint32[])
```

Get the ready pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | readyPoolIds The ready pool IDs |

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

Get the pending pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | pendingPoolIds The pending pool IDs |

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get the staked pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | stakedPoolIds The staked pool IDs |

### getPrepoolBalance

```solidity
function getPrepoolBalance() external view returns (uint256)
```

Get the pre-pool balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | prepoolBalance The pre-pool balance |

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
| [0] | uint32 | ethFeePercent The ETH fee percentage to charge on each deposit |

### getLINKFeePercent

```solidity
function getLINKFeePercent() external view returns (uint32)
```

Get the LINK fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | linkFeePercent The LINK fee percentage to charge on each deposit |

### getSSVFeePercent

```solidity
function getSSVFeePercent() external view returns (uint32)
```

Get the SSV fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | ssvFeePercent The SSV fee percentage to charge on each deposit |

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

### reportPeriod

```solidity
uint256 reportPeriod
```

Current report period

### reportPendingPoolCount

```solidity
uint256 reportPendingPoolCount
```

Current report pending pool count

### reportExitingPoolCount

```solidity
uint256 reportExitingPoolCount
```

Current report exiting pool count

### reportRequestBlock

```solidity
uint256 reportRequestBlock
```

Current report block

### requestCBOR

```solidity
bytes requestCBOR
```

Binary request source code

### fulfillGasLimit

```solidity
uint32 fulfillGasLimit
```

Fulfillment gas limit

### validateRequestId

```solidity
modifier validateRequestId(bytes32 requestId)
```

_Verify a request ID_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID |

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
function checkUpkeep(bytes) public view returns (bool upkeepNeeded, bytes)
```

Check if the upkeep is needed

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepNeeded | bool | True if the upkeep is needed |
| [1] | bytes |  |

### performUpkeep

```solidity
function performUpkeep(bytes) external
```

Perform the upkeep

### fulfillRequest

```solidity
function fulfillRequest(bytes32 requestId, bytes response, bytes _error) internal
```

Callback that is invoked once the DON has resolved the request or hit an error

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the user code |
| _error | bytes | Aggregated error from the user code or from the sweptStake pipeline Either response or error parameter will be set, but never both |

### setOracleAddress

```solidity
function setOracleAddress(address newOracleAddress) external
```

Update the functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOracleAddress | address | New oracle address |

### encodeResponse

```solidity
function encodeResponse(uint128 activeBalance, uint32 activatedDeposits, uint32 withdrawnExits, uint32 slashedExits) external pure returns (bytes)
```

Encode the response for testing

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeBalance | uint128 | Active balance |
| activatedDeposits | uint32 | Count of new deposits |
| withdrawnExits | uint32 | Count of new exits |
| slashedExits | uint32 | Count of new slashedExits |

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
  bool slashed;
  bytes32 depositDataRoot;
  bytes publicKey;
  bytes signature;
  bytes withdrawalCredentials;
  uint64[] operatorIds;
  bytes shares;
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
  uint256 period;
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

### PoolUnexpectedExitReportsRequested

```solidity
event PoolUnexpectedExitReportsRequested(uint256 count)
```

### PoolSlashedExitReportsRequested

```solidity
event PoolSlashedExitReportsRequested(uint256 count)
```

### PoolWithdrawnExitReportsRequested

```solidity
event PoolWithdrawnExitReportsRequested(uint256 count)
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
function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 withdrawnExits) external
```

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

### completePendingWithdrawals

```solidity
function completePendingWithdrawals(uint256 count) external
```

### initiatePoolDeposit

```solidity
function initiatePoolDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount) external
```

### completePoolDeposits

```solidity
function completePoolDeposits(uint256 count) external
```

### requestPoolUnexpectedExitReports

```solidity
function requestPoolUnexpectedExitReports(uint256 count) external
```

### requestPoolSlashedExitReports

```solidity
function requestPoolSlashedExitReports(uint256 count) external
```

### requestPoolWithdrawnExitReports

```solidity
function requestPoolWithdrawnExitReports(uint256 count) external
```

### completePoolExit

```solidity
function completePoolExit(uint256 poolIndex, uint256 finalEffectiveBalance, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

### setFeePercents

```solidity
function setFeePercents(uint32 ethFeePercent, uint32 linkFeePercent, uint32 ssvFeePercent) external
```

### setFunctionsAddress

```solidity
function setFunctionsAddress(address functionsAddress) external
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

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256)
```

### getExitingPoolCount

```solidity
function getExitingPoolCount() external view returns (uint256)
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

### getTotalStake

```solidity
function getTotalStake() external view returns (uint256)
```

### getBufferedBalance

```solidity
function getBufferedBalance() external view returns (uint256)
```

### getExpectedEffectiveBalance

```solidity
function getExpectedEffectiveBalance() external view returns (uint256)
```

### getReportPeriod

```solidity
function getReportPeriod() external view returns (uint32)
```

### getFinalizableWithdrawnPoolCount

```solidity
function getFinalizableWithdrawnPoolCount() external view returns (uint256)
```

### getReportFinalizableWithdrawnBalance

```solidity
function getReportFinalizableWithdrawnBalance() external view returns (uint256)
```

### getLatestActiveBalance

```solidity
function getLatestActiveBalance() external view returns (uint256)
```

### getLatestActiveBalanceAfterFees

```solidity
function getLatestActiveBalanceAfterFees() external view returns (uint256)
```

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool)
```

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() external view returns (uint256)
```

### getPrepoolBalance

```solidity
function getPrepoolBalance() external view returns (uint256)
```

### getSweptBalance

```solidity
function getSweptBalance() external view returns (uint256)
```

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

### getPendingWithdrawalQueue

```solidity
function getPendingWithdrawalQueue() external view returns (struct ICasimirManager.Withdrawal[])
```

### getPendingWithdrawals

```solidity
function getPendingWithdrawals() external view returns (uint256)
```

### getPendingWithdrawalCount

```solidity
function getPendingWithdrawalCount() external view returns (uint256)
```

## ICasimirUpkeep

### Status

```solidity
enum Status {
  FINALIZED,
  REQUESTING,
  PROCESSING
}
```

### OCRResponse

```solidity
event OCRResponse(bytes32 requestId, bytes result, bytes err)
```

### UpkeepPerformed

```solidity
event UpkeepPerformed(enum ICasimirUpkeep.Status status)
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

## CasimirRegistry

### requiredCollateral

```solidity
uint256 requiredCollateral
```

### minimumCollateralDeposit

```solidity
uint256 minimumCollateralDeposit
```

### totalCollateral

```solidity
uint256 totalCollateral
```

### constructor

```solidity
constructor(address managerAddress, address ssvNetworkViewsAddress) public
```

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

Register an operator with the set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### requestOperatorDeregistration

```solidity
function requestOperatorDeregistration(uint64 operatorId) external
```

Request to deregister an operator from the set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### completeOperatorDeregistration

```solidity
function completeOperatorDeregistration(uint64 operatorId) external
```

Deregister an operator from the set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

Deposit collateral for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### setOperatorCollateral

```solidity
function setOperatorCollateral(uint64 operatorId, int256 collateral) external
```

Set the collateral for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |
| collateral | int256 | The collateral |

### getOperatorCollateral

```solidity
function getOperatorCollateral(uint64 operatorId) external view returns (int256)
```

Get the collateral for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 | The collateral |

## ICasimirRegistry

### OperatorRegistered

```solidity
event OperatorRegistered(uint64 operatorId)
```

### OperatorDeregistrationRequested

```solidity
event OperatorDeregistrationRequested(uint64 operatorId)
```

### OperatorDeregistrationCompleted

```solidity
event OperatorDeregistrationCompleted(uint64 operatorId)
```

### Operator

```solidity
struct Operator {
  uint64 id;
  int256 collateral;
  uint256 poolCount;
  bool deregistering;
}
```

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

### requestOperatorDeregistration

```solidity
function requestOperatorDeregistration(uint64 operatorId) external
```

### completeOperatorDeregistration

```solidity
function completeOperatorDeregistration(uint64 operatorId) external
```

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

### setOperatorCollateral

```solidity
function setOperatorCollateral(uint64 operatorId, int256 collateral) external
```

### getOperatorCollateral

```solidity
function getOperatorCollateral(uint64 operatorId) external view returns (int256)
```

## MockFunctionsOracle

### constructor

```solidity
constructor() public
```

### getRegistry

```solidity
function getRegistry() external view returns (address)
```

Returns the address of the registry contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | address The address of the registry contract |

### sendRequest

```solidity
function sendRequest(uint64 _subscriptionId, bytes _data, uint32 _gasLimit) external returns (bytes32 requestId)
```

Sends a request (encoded as data) using the provided subscriptionId

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _subscriptionId | uint64 | A unique subscription ID allocated by billing system, a client can make requests from different contracts referencing the same subscription |
| _data | bytes | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| _gasLimit | uint32 | Gas limit for the fulfillment callback |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | A unique request identifier (unique per DON) |

## CasimirRecipient

### receive

```solidity
receive() external payable
```

## ICasimirRecipient

## CasimirDAO

### owners

```solidity
address[] owners
```

### isOwner

```solidity
mapping(address => bool) isOwner
```

### numConfirmationsRequired

```solidity
uint256 numConfirmationsRequired
```

### isConfirmed

```solidity
mapping(uint256 => mapping(address => bool)) isConfirmed
```

### transactions

```solidity
struct ICasimirDAO.Transaction[] transactions
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### txExists

```solidity
modifier txExists(uint256 _txIndex)
```

### notExecuted

```solidity
modifier notExecuted(uint256 _txIndex)
```

### notConfirmed

```solidity
modifier notConfirmed(uint256 _txIndex)
```

### constructor

```solidity
constructor(address[] _owners, uint256 _numConfirmationsRequired) public
```

### receive

```solidity
receive() external payable
```

### submitTransaction

```solidity
function submitTransaction(address _to, uint256 _value, bytes _data) public
```

### confirmTransaction

```solidity
function confirmTransaction(uint256 _txIndex) public
```

### executeTransaction

```solidity
function executeTransaction(uint256 _txIndex) public
```

### revokeConfirmation

```solidity
function revokeConfirmation(uint256 _txIndex) public
```

### getOwners

```solidity
function getOwners() public view returns (address[])
```

### getTransactionCount

```solidity
function getTransactionCount() public view returns (uint256)
```

### getTransaction

```solidity
function getTransaction(uint256 _txIndex) public view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)
```

## ICasimirDAO

### Deposit

```solidity
event Deposit(address sender, uint256 amount, uint256 balance)
```

### SubmitTransaction

```solidity
event SubmitTransaction(address owner, uint256 txIndex, address to, uint256 value, bytes data)
```

### ConfirmTransaction

```solidity
event ConfirmTransaction(address owner, uint256 txIndex)
```

### RevokeConfirmation

```solidity
event RevokeConfirmation(address owner, uint256 txIndex)
```

### ExecuteTransaction

```solidity
event ExecuteTransaction(address owner, uint256 txIndex)
```

### Transaction

```solidity
struct Transaction {
  address to;
  uint256 value;
  bytes data;
  bool executed;
  uint256 numConfirmations;
}
```

### receive

```solidity
receive() external payable
```

### submitTransaction

```solidity
function submitTransaction(address _to, uint256 _value, bytes _data) external
```

### confirmTransaction

```solidity
function confirmTransaction(uint256 _txIndex) external
```

### executeTransaction

```solidity
function executeTransaction(uint256 _txIndex) external
```

### revokeConfirmation

```solidity
function revokeConfirmation(uint256 _txIndex) external
```

### getOwners

```solidity
function getOwners() external view returns (address[])
```

### getTransactionCount

```solidity
function getTransactionCount() external view returns (uint256)
```

### getTransaction

```solidity
function getTransaction(uint256 _txIndex) external view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)
```

