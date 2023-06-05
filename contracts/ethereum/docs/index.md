# Solidity API

## CasimirManager

### finalizableCompletedExits

```solidity
uint256 finalizableCompletedExits
```

Exited pool count

### onlyPool

```solidity
modifier onlyPool(uint32 poolId)
```

_Validate the caller is the authorized pool_

### onlyOracle

```solidity
modifier onlyOracle()
```

_Validate the caller is the manager oracle_

### onlyRegistry

```solidity
modifier onlyRegistry()
```

_Validate the caller is the registry_

### onlyUpkeep

```solidity
modifier onlyUpkeep()
```

_Validate the caller is the upkeep contract_

### validDeposit

```solidity
modifier validDeposit()
```

_Validate a deposit_

### validWithdrawal

```solidity
modifier validWithdrawal(uint256 amount)
```

_Validate a withdrawal_

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
constructor(address _oracleAddress, address beaconDepositAddress, address linkFunctionsAddress, address linkRegistrarAddress, uint32 linkSubscriptionId, address linkTokenAddress, address ssvNetworkAddress, address ssvNetworkViewsAddress, address ssvTokenAddress, address swapFactoryAddress, address swapRouterAddress, address wethTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oracleAddress | address | The manager oracle address |
| beaconDepositAddress | address | The Beacon deposit address |
| linkFunctionsAddress | address | The Chainlink functions oracle address |
| linkRegistrarAddress | address | The Chainlink keeper registrar address |
| linkSubscriptionId | uint32 | The Chainlink functions subscription ID |
| linkTokenAddress | address | The Chainlink token address |
| ssvNetworkAddress | address | The SSV network address |
| ssvNetworkViewsAddress | address | The SSV network views address |
| ssvTokenAddress | address | The SSV token address |
| swapFactoryAddress | address | The Uniswap factory address |
| swapRouterAddress | address | The Uniswap router address |
| wethTokenAddress | address | The WETH contract address |

### receive

```solidity
receive() external payable
```

Receive and deposit validator tips

### depositStake

```solidity
function depositStake() external payable
```

Deposit user stake

### depositRewards

```solidity
function depositRewards() external payable
```

Deposit a given amount of rewards

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

Deposit exited balance from a given pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

Deposit recovered balance for a given pool from an operator

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeBalance | uint256 | The active balance |
| sweptBalance | uint256 | The swept balance |
| activatedDeposits | uint256 | The count of activated deposits |
| completedExits | uint256 | The count of withdrawn exits |

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
```

Compound rewards given a list of pool IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | The list of pool IDs |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of stake to withdraw |

### fulfillWithdrawals

```solidity
function fulfillWithdrawals(uint256 count) external
```

Fulfill a given count of pending withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of withdrawals to complete |

### initiateDeposit

```solidity
function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount) external
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

### activateDeposits

```solidity
function activateDeposits(uint256 count) external
```

Activate a given count of the next pending pools

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of pools to activate |

### requestForcedExitReports

```solidity
function requestForcedExitReports(uint256 count) external
```

Request reports for a given count of pools forced to exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of pools forced to exit |

### requestCompletedExitReports

```solidity
function requestCompletedExitReports(uint256 count) external
```

Request reports for a given count of completed exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of completed exits |

### reportForcedExit

```solidity
function reportForcedExit(uint32 poolId) external
```

Report a pool unexpected exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 poolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Report a completed exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The staked pool index |
| blamePercents | uint32[] | The operator blame percents (0 if balance is 32 ether) |
| cluster | struct ISSVNetworkCore.Cluster | The SSV cluster snapshot |

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

### getReservedFeeBalance

```solidity
function getReservedFeeBalance() public view returns (uint256)
```

Get the reserved fee balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | reservedFeeBalance The reserved fee balance |

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

### getLatestActiveRewardBalance

```solidity
function getLatestActiveRewardBalance() public view returns (int256)
```

Get the latest active reward balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 | latestActiveRewardBalance The latest active reward balance |

### getFinalizableExitedBalance

```solidity
function getFinalizableExitedBalance() public view returns (uint256)
```

Get the finalizable exited balance of the current reporting period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | finalizableExitedBalance The finalizable exited balance of the current reporting period |

### getFinalizableCompletedExits

```solidity
function getFinalizableCompletedExits() public view returns (uint256)
```

Get the finalizable completed exit count of the current reporting period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | finalizableCompletedExits The finalizable completed exit count of the current reporting period |

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) public view returns (bool)
```

Get the eligibility of a pending withdrawal

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | pendingWithdrawalEligibility The eligibility of a pending withdrawal |

### getPendingWithdrawalBalance

```solidity
function getPendingWithdrawalBalance() public view returns (uint256)
```

Get the total pending user withdrawal amount

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | requestedWithdrawalBalance The total pending user withdrawal amount |

### getPendingWithdrawals

```solidity
function getPendingWithdrawals() public view returns (uint256)
```

Get the total pending withdrawal count

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | requestedWithdrawals The total pending withdrawal count |

### getFeePercent

```solidity
function getFeePercent() public view returns (uint32)
```

Get the total fee percentage

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | feePercent The total fee percentage |

### getTotalDeposits

```solidity
function getTotalDeposits() external view returns (uint256)
```

Get the count of deposited pools

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | totalDeposits The count of deposited pools |

### getRequestedExits

```solidity
function getRequestedExits() external view returns (uint256)
```

Get the count of pools requested to exit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | requestedExits The count of pools requested to exit |

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

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address)
```

Get a pool's address by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | poolAddress The pool address |

### getPoolDetails

```solidity
function getPoolDetails(uint32 poolId) external view returns (struct ICasimirManager.PoolDetails poolDetails)
```

Get a pool's details by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolDetails | struct ICasimirManager.PoolDetails | The pool details |

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address registryAddress)
```

Get the registry address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryAddress | address | The registry address |

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address upkeepAddress)
```

Get the upkeep address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepAddress | address | The upkeep address |

### getSweptBalance

```solidity
function getSweptBalance() public view returns (uint256 balance)
```

Get the swept balance

_Should be called off-chain_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | The swept balance |

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds() external view returns (uint32[5] poolIds)
```

Get the next five compoundable pool IDs

_Should be called off-chain_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | The next five compoundable pool IDs |

## CasimirPool

### poolCapacity

```solidity
uint256 poolCapacity
```

### constructor

```solidity
constructor(address registryAddress, uint32 poolId, bytes publicKey, uint64[] operatorIds) public
```

### depositRewards

```solidity
function depositRewards() external
```

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

### setOperatorIds

```solidity
function setOperatorIds(uint64[] operatorIds) external
```

### setStatus

```solidity
function setStatus(enum ICasimirPool.PoolStatus status) external
```

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

### getConfig

```solidity
function getConfig() external view returns (struct ICasimirPool.PoolConfig)
```

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

### getPublicKey

```solidity
function getPublicKey() external view returns (bytes)
```

### getStatus

```solidity
function getStatus() external view returns (enum ICasimirPool.PoolStatus)
```

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

### onlyPool

```solidity
modifier onlyPool(uint32 poolId)
```

_Validate the caller is the authorized pool_

### constructor

```solidity
constructor(address ssvNetworkViewsAddress) public
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

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

Deposit collateral for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### withdrawCollateral

```solidity
function withdrawCollateral(uint64 operatorId, uint256 amount) external
```

Withdraw collateral for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |
| amount | uint256 | The amount to withdraw |

### addActivePool

```solidity
function addActivePool(uint32 poolId, uint64 operatorId) external
```

Add an active pool to an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| operatorId | uint64 | The operator ID |

### removeActivePool

```solidity
function removeActivePool(uint32 poolId, uint64 operatorId, uint256 blameAmount) external
```

Remove an active pool from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| operatorId | uint64 | The operator ID |
| blameAmount | uint256 | The amount to recover from collateral |

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

### reportRemainingRequests

```solidity
uint256 reportRemainingRequests
```

Current report remaining request count

### reportRequestBlock

```solidity
uint256 reportRequestBlock
```

Current report block

### reportCompoundablePoolIds

```solidity
uint32[5] reportCompoundablePoolIds
```

Current report compoundable pools

### finalizableCompoundablePoolIds

```solidity
uint32[5] finalizableCompoundablePoolIds
```

Finalizable compoundable pools

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

### constructor

```solidity
constructor(address linkFunctionsAddress, address linkRegistrarAddress, uint64 _linkSubscriptionId, address linkTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| linkFunctionsAddress | address | The functions oracle contract address |
| linkRegistrarAddress | address | The keeper registrar address |
| _linkSubscriptionId | uint64 | The functions subscription ID |
| linkTokenAddress | address | The LINK token address |

### registerUpkeep

```solidity
function registerUpkeep(struct KeeperRegistrarInterface.RegistrationParams params) public
```

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
function setRequest(uint32 _fulfillGasLimit, uint64 linkSubscriptionId, bytes _requestCBOR) external
```

Set the bytes representing the CBOR-encoded Functions.Request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _fulfillGasLimit | uint32 | Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function |
| linkSubscriptionId | uint64 | The functions billing subscription ID used to pay for Functions requests |
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
function encodeResponse(uint128 activeBalance, uint32 activatedDeposits, uint32 completedExits, uint32 slashedExits) external pure returns (bytes)
```

Encode the response for testing

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeBalance | uint128 | Active balance |
| activatedDeposits | uint32 | Count of new deposits |
| completedExits | uint32 | Count of new exits |
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

### Token

```solidity
enum Token {
  LINK,
  SSV,
  WETH
}
```

### PoolDetails

```solidity
struct PoolDetails {
  uint32 id;
  uint256 balance;
  bytes publicKey;
  uint64[] operatorIds;
  enum ICasimirPool.PoolStatus status;
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

### DepositRequested

```solidity
event DepositRequested(uint32 poolId)
```

### DepositInitiated

```solidity
event DepositInitiated(uint32 poolId)
```

### DepositActivated

```solidity
event DepositActivated(uint32 poolId)
```

### ReshareRequested

```solidity
event ReshareRequested(uint32 poolId)
```

### ReshareCompleted

```solidity
event ReshareCompleted(uint32 poolId)
```

### ExitRequested

```solidity
event ExitRequested(uint32 poolId)
```

### ForcedExitReportsRequested

```solidity
event ForcedExitReportsRequested(uint256 count)
```

### SlashedExitReportsRequested

```solidity
event SlashedExitReportsRequested(uint256 count)
```

### CompletedExitReportsRequested

```solidity
event CompletedExitReportsRequested(uint256 count)
```

### ExitCompleted

```solidity
event ExitCompleted(uint32 poolId)
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

### TipsDeposited

```solidity
event TipsDeposited(uint256 amount)
```

### WithdrawalRequested

```solidity
event WithdrawalRequested(address sender, uint256 amount)
```

### WithdrawalInitiated

```solidity
event WithdrawalInitiated(address sender, uint256 amount)
```

### WithdrawalFulfilled

```solidity
event WithdrawalFulfilled(address sender, uint256 amount)
```

### depositStake

```solidity
function depositStake() external payable
```

### depositRewards

```solidity
function depositRewards() external payable
```

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
```

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

### fulfillWithdrawals

```solidity
function fulfillWithdrawals(uint256 count) external
```

### initiateDeposit

```solidity
function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount) external
```

### activateDeposits

```solidity
function activateDeposits(uint256 count) external
```

### requestForcedExitReports

```solidity
function requestForcedExitReports(uint256 count) external
```

### requestCompletedExitReports

```solidity
function requestCompletedExitReports(uint256 count) external
```

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 poolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

### setFunctionsAddress

```solidity
function setFunctionsAddress(address functionsAddress) external
```

### getFeePercent

```solidity
function getFeePercent() external view returns (uint32)
```

### getTotalDeposits

```solidity
function getTotalDeposits() external view returns (uint256)
```

### getRequestedExits

```solidity
function getRequestedExits() external view returns (uint256)
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

### getFinalizableCompletedExits

```solidity
function getFinalizableCompletedExits() external view returns (uint256)
```

### getFinalizableExitedBalance

```solidity
function getFinalizableExitedBalance() external view returns (uint256)
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

### getPendingWithdrawalBalance

```solidity
function getPendingWithdrawalBalance() external view returns (uint256)
```

### getPendingWithdrawals

```solidity
function getPendingWithdrawals() external view returns (uint256)
```

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address)
```

### getPoolDetails

```solidity
function getPoolDetails(uint32 poolId) external view returns (struct ICasimirManager.PoolDetails)
```

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address)
```

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address)
```

## ICasimirPool

### PoolConfig

```solidity
struct PoolConfig {
  uint32 poolId;
  bytes publicKey;
  uint64[] operatorIds;
  enum ICasimirPool.PoolStatus status;
}
```

### PoolStatus

```solidity
enum PoolStatus {
  PENDING,
  ACTIVE,
  EXITING_FORCED,
  EXITING_REQUESTED,
  WITHDRAWN
}
```

### depositRewards

```solidity
function depositRewards() external
```

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

### setOperatorIds

```solidity
function setOperatorIds(uint64[] operatorIds) external
```

### setStatus

```solidity
function setStatus(enum ICasimirPool.PoolStatus status) external
```

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

### getConfig

```solidity
function getConfig() external view returns (struct ICasimirPool.PoolConfig)
```

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

### getPublicKey

```solidity
function getPublicKey() external view returns (bytes)
```

### getStatus

```solidity
function getStatus() external view returns (enum ICasimirPool.PoolStatus)
```

## ICasimirRegistry

### OperatorRegistered

```solidity
event OperatorRegistered(uint64 operatorId)
```

### DeregistrationRequested

```solidity
event DeregistrationRequested(uint64 operatorId)
```

### DeregistrationCompleted

```solidity
event DeregistrationCompleted(uint64 operatorId)
```

### Operator

```solidity
struct Operator {
  bool active;
  int256 collateral;
  uint256 poolCount;
  mapping(uint32 => bool) activePools;
  bool deregistering;
}
```

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

### withdrawCollateral

```solidity
function withdrawCollateral(uint64 operatorId, uint256 amount) external
```

### addActivePool

```solidity
function addActivePool(uint32 poolId, uint64 operatorId) external
```

### removeActivePool

```solidity
function removeActivePool(uint32 poolId, uint64 operatorId, uint256 blameAmount) external
```

### getOperatorCollateral

```solidity
function getOperatorCollateral(uint64 operatorId) external view returns (int256)
```

## ICasimirUpkeep

### RequestType

```solidity
enum RequestType {
  NONE,
  BALANCES,
  DETAILS
}
```

### ReportStatus

```solidity
enum ReportStatus {
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
event UpkeepPerformed(enum ICasimirUpkeep.ReportStatus status)
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

## KeeperRegistrarInterface

### RegistrationParams

```solidity
struct RegistrationParams {
  string name;
  bytes encryptedEmail;
  address upkeepContract;
  uint32 gasLimit;
  address adminAddress;
  bytes checkData;
  bytes offchainConfig;
  uint96 amount;
}
```

### registerUpkeep

```solidity
function registerUpkeep(struct KeeperRegistrarInterface.RegistrationParams requestParams) external returns (uint256)
```

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

### isOwnerChangeConfirmed

```solidity
mapping(uint256 => mapping(address => bool)) isOwnerChangeConfirmed
```

### isTransactionConfirmed

```solidity
mapping(uint256 => mapping(address => bool)) isTransactionConfirmed
```

### ownerChanges

```solidity
struct ICasimirDAO.OwnerChange[] ownerChanges
```

### transactions

```solidity
struct ICasimirDAO.Transaction[] transactions
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### ownerChangeExists

```solidity
modifier ownerChangeExists(uint256 changeId)
```

### ownerChangeNotExecuted

```solidity
modifier ownerChangeNotExecuted(uint256 changeId)
```

### ownerChangeNotConfirmed

```solidity
modifier ownerChangeNotConfirmed(uint256 changeId)
```

### transactionExists

```solidity
modifier transactionExists(uint256 transactionIndex)
```

### transactionNotExecuted

```solidity
modifier transactionNotExecuted(uint256 transactionIndex)
```

### transactionNotConfirmed

```solidity
modifier transactionNotConfirmed(uint256 transactionIndex)
```

### constructor

```solidity
constructor(address[] _owners, uint256 _numConfirmationsRequired) public
```

### receive

```solidity
receive() external payable
```

### submitOwnerChange

```solidity
function submitOwnerChange(address owner, bool add) public
```

### confirmOwnerChange

```solidity
function confirmOwnerChange(uint256 changeId) public
```

### executeOwnerChange

```solidity
function executeOwnerChange(uint256 changeId) public
```

### revokeOwnerChangeConfirmation

```solidity
function revokeOwnerChangeConfirmation(uint256 changeId) public
```

### submitTransaction

```solidity
function submitTransaction(address to, uint256 value, bytes data) public
```

### confirmTransaction

```solidity
function confirmTransaction(uint256 transactionIndex) public
```

### executeTransaction

```solidity
function executeTransaction(uint256 transactionIndex) public
```

### revokeTransactionConfirmation

```solidity
function revokeTransactionConfirmation(uint256 transactionIndex) public
```

### getOwners

```solidity
function getOwners() public view returns (address[])
```

### getOwnerChangeCount

```solidity
function getOwnerChangeCount() public view returns (uint256)
```

### getOwnerChange

```solidity
function getOwnerChange(uint256 changeId) public view returns (address owner, bool add, bool executed, uint256 numConfirmations)
```

### getTransactionCount

```solidity
function getTransactionCount() public view returns (uint256)
```

### getTransaction

```solidity
function getTransaction(uint256 transactionIndex) public view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)
```

## ICasimirDAO

### Deposit

```solidity
event Deposit(address sender, uint256 amount, uint256 balance)
```

### SubmitOwnerChange

```solidity
event SubmitOwnerChange(address owner, uint256 changeId, bool add)
```

### ConfirmOwnerChange

```solidity
event ConfirmOwnerChange(address owner, uint256 changeId)
```

### RevokeOwnerChangeConfirmation

```solidity
event RevokeOwnerChangeConfirmation(address owner, uint256 changeId)
```

### ExecuteOwnerChange

```solidity
event ExecuteOwnerChange(address owner, uint256 changeId)
```

### SubmitTransaction

```solidity
event SubmitTransaction(address owner, uint256 txIndex, address to, uint256 value, bytes data)
```

### ConfirmTransaction

```solidity
event ConfirmTransaction(address owner, uint256 txIndex)
```

### RevokeTransactionConfirmation

```solidity
event RevokeTransactionConfirmation(address owner, uint256 txIndex)
```

### ExecuteTransaction

```solidity
event ExecuteTransaction(address owner, uint256 txIndex)
```

### OwnerChange

```solidity
struct OwnerChange {
  address owner;
  bool add;
  bool executed;
  uint256 numConfirmations;
}
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

### submitOwnerChange

```solidity
function submitOwnerChange(address owner, bool add) external
```

### confirmOwnerChange

```solidity
function confirmOwnerChange(uint256 changeId) external
```

### executeOwnerChange

```solidity
function executeOwnerChange(uint256 changeId) external
```

### revokeOwnerChangeConfirmation

```solidity
function revokeOwnerChangeConfirmation(uint256 changeId) external
```

### submitTransaction

```solidity
function submitTransaction(address to, uint256 value, bytes data) external
```

### confirmTransaction

```solidity
function confirmTransaction(uint256 transactionIndex) external
```

### executeTransaction

```solidity
function executeTransaction(uint256 transactionIndex) external
```

### revokeTransactionConfirmation

```solidity
function revokeTransactionConfirmation(uint256 transactionIndex) external
```

### getOwners

```solidity
function getOwners() external view returns (address[])
```

### getOwnerChangeCount

```solidity
function getOwnerChangeCount() external view returns (uint256)
```

### getOwnerChange

```solidity
function getOwnerChange(uint256 changeId) external view returns (address owner, bool add, bool executed, uint256 numConfirmations)
```

### getTransactionCount

```solidity
function getTransactionCount() external view returns (uint256)
```

### getTransaction

```solidity
function getTransaction(uint256 transactionIndex) external view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)
```

## CasimirRecipient

### manager

```solidity
contract ICasimirManager manager
```

### constructor

```solidity
constructor() public
```

### receive

```solidity
receive() external payable
```

## ICasimirRecipient

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

