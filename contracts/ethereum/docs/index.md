# Solidity API

## CasimirMultisig

### owners

```solidity
address[] owners
```

### isOwner

```solidity
mapping(address => bool) isOwner
```

### confirmationsRequired

```solidity
uint256 confirmationsRequired
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
struct ICasimirMultisig.OwnerChange[] ownerChanges
```

### transactions

```solidity
struct ICasimirMultisig.Transaction[] transactions
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
constructor(address[] _owners) public
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
function submitTransaction(address to, uint256 value, bytes data) public returns (uint256 transactionIndex)
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

### adjustConfirmationsRequired

```solidity
function adjustConfirmationsRequired() internal
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
function getOwnerChange(uint256 changeId) public view returns (address owner, bool add, bool executed, uint256 confirmations)
```

### getTransactionCount

```solidity
function getTransactionCount() public view returns (uint256)
```

### getTransaction

```solidity
function getTransaction(uint256 transactionIndex) public view returns (address to, uint256 value, bytes data, bool executed, uint256 confirmations)
```

## ICasimirMultisig

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
  uint256 confirmations;
}
```

### Transaction

```solidity
struct Transaction {
  address to;
  uint256 value;
  bytes data;
  bool executed;
  uint256 confirmations;
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
function submitTransaction(address to, uint256 value, bytes data) external returns (uint256 transactionIndex)
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
function getOwnerChange(uint256 changeId) external view returns (address owner, bool add, bool executed, uint256 confirmations)
```

### getTransactionCount

```solidity
function getTransactionCount() external view returns (uint256)
```

### getTransaction

```solidity
function getTransaction(uint256 transactionIndex) external view returns (address to, uint256 value, bytes data, bool executed, uint256 confirmations)
```

## CasimirManager

### upkeepRegistrationMinimum

```solidity
uint256 upkeepRegistrationMinimum
```

Minimum balance for upkeep registration (0.1 LINK)

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

### onlyOracleOrRegistry

```solidity
modifier onlyOracleOrRegistry()
```

_Validate the caller is the oracle or registry_

### onlyOracleOrUpkeep

```solidity
modifier onlyOracleOrUpkeep()
```

_Validate the caller is the oracle or upkeep_

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
constructor(address _oracleAddress, address beaconDepositAddress, address linkFunctionsAddress, address linkRegistrarAddress, address linkRegistryAddress, address linkTokenAddress, address ssvNetworkAddress, address ssvNetworkViewsAddress, address ssvTokenAddress, address swapFactoryAddress, address swapRouterAddress, address wethTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oracleAddress | address | The manager oracle address |
| beaconDepositAddress | address | The Beacon deposit address |
| linkFunctionsAddress | address | The Chainlink functions oracle address |
| linkRegistrarAddress | address | The Chainlink keeper registrar address |
| linkRegistryAddress | address | The Chainlink keeper registry address |
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

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

### depositClusterBalance

```solidity
function depositClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, bool processed) external
```

Deposit to a cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | The operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | The SSV cluster snapshot |
| feeAmount | uint256 | The fee amount to deposit |
| processed | bool | Whether the fee amount is already processed |

### depositUpkeepBalance

```solidity
function depositUpkeepBalance(uint256 feeAmount, bool processed) external
```

Deposit to the upkeep balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | The fee amount to deposit |
| processed | bool | Whether the fee amount is already processed |

### depositReservedFees

```solidity
function depositReservedFees() external payable
```

Deposit reserved fees

### withdrawReservedFees

```solidity
function withdrawReservedFees(uint256 amount) external
```

Withdraw a given amount of reserved fees

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of fees to withdraw |

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
function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, bool processed) external
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
| cluster | struct ISSVNetworkCore.Cluster | The SSV cluster snapshot |
| feeAmount | uint256 | The fee amount to deposit |
| processed | bool |  |

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

Request reports a given count of forced exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of forced exits |

### requestCompletedExitReports

```solidity
function requestCompletedExitReports(uint256 count) external
```

Request reports for a given count of completed exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of completed exits |

### requestReshares

```solidity
function requestReshares(uint64 operatorId) external
```

Request reshares for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### reportForcedExits

```solidity
function reportForcedExits(uint32[] poolIds) external
```

Report pool forced (unrequested) exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[] | The pool IDs |

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

### reportReshare

```solidity
function reportReshare(uint32 poolId, uint64[] operatorIds, uint64[] oldOperatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, struct ISSVNetworkCore.Cluster cluster, struct ISSVNetworkCore.Cluster oldCluster, uint256 feeAmount, bool processed) external
```

Report a reshare

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| operatorIds | uint64[] | The operator IDs |
| oldOperatorIds | uint64[] | The old operator IDs |
| newOperatorId | uint64 | The new operator ID |
| oldOperatorId | uint64 | The old operator ID |
| shares | bytes | The operator shares |
| cluster | struct ISSVNetworkCore.Cluster | The SSV cluster snapshot |
| oldCluster | struct ISSVNetworkCore.Cluster | The old SSV cluster snapshot |
| feeAmount | uint256 | The fee amount to deposit |
| processed | bool | Whether the fee amount is already processed |

### withdrawUpkeepBalance

```solidity
function withdrawUpkeepBalance() external
```

Cancel upkeep and withdraw the upkeep balance

### withdrawLINKBalance

```solidity
function withdrawLINKBalance(uint256 amount) external
```

Withdraw a given amount from the LINK balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount to withdraw |

### withdrawSSVBalance

```solidity
function withdrawSSVBalance(uint256 amount) external
```

Withdraw a given amount from the SSV balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount to withdraw |

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

### totalStake

```solidity
function totalStake() public view returns (uint256 totalStake)
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

### latestActiveBalance

```solidity
function latestActiveBalance() public view returns (uint256)
```

Get the latest active balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | latestActiveBalance The latest active balance |

### latestActiveBalanceAfterFees

```solidity
function latestActiveBalanceAfterFees() public view returns (uint256)
```

Get the latest active balance after fees

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | latestActiveBalanceAfterFees The latest active balance after fees |

### finalizableCompletedExits

```solidity
function finalizableCompletedExits() public view returns (uint256)
```

Get the finalizable completed exit count of the current reporting period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | finalizableCompletedExits The finalizable completed exit count of the current reporting period |

### reportPeriod

```solidity
function reportPeriod() public view returns (uint256)
```

Get the report period

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | reportPeriod The report period |

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) public view returns (bool)
```

Get the eligibility of a pending withdrawal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | The index of the pending withdrawal |
| period | uint256 | The period to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | pendingWithdrawalEligibility The eligibility of a pending withdrawal |

### requestedWithdrawalBalance

```solidity
function requestedWithdrawalBalance() public view returns (uint256)
```

Get the total pending user withdrawal amount

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | requestedWithdrawalBalance The total pending user withdrawal amount |

### requestedWithdrawals

```solidity
function requestedWithdrawals() public view returns (uint256)
```

Get the total pending withdrawal count

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | requestedWithdrawals The total pending withdrawal count |

### feePercent

```solidity
function feePercent() public view returns (uint32)
```

Get the total fee percentage

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | feePercent The total fee percentage |

### requestedExits

```solidity
function requestedExits() external view returns (uint256)
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

### prepoolBalance

```solidity
function prepoolBalance() external view returns (uint256)
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

### getUpkeepId

```solidity
function getUpkeepId() external view returns (uint256)
```

Get the upkeep ID

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | upkeepId The upkeep ID |

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address upkeepAddress)
```

Get the upkeep address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepAddress | address | The upkeep address |

### getUpkeepBalance

```solidity
function getUpkeepBalance() external view returns (uint256 upkeepBalance)
```

Get the upkeep balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepBalance | uint256 | The upkeep balance |

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

### setReshares

```solidity
function setReshares(uint256 reshares) external
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

### onlyOwnerOrPool

```solidity
modifier onlyOwnerOrPool(uint32 poolId)
```

_Validate the caller is owner or the authorized pool_

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

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

Add a pool to an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |
| poolId | uint32 | The pool ID |

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

Remove a pool from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |
| poolId | uint32 | The pool ID |
| blameAmount | uint256 | The amount to recover from collateral |

### requestDeregistration

```solidity
function requestDeregistration(uint64 operatorId) external
```

Request deregistration for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

### getOperatorCollateral

```solidity
function getOperatorCollateral(uint64 operatorId) external view returns (int256 collateral)
```

Get the collateral of an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| collateral | int256 | The collateral |

### getOperatorEligibility

```solidity
function getOperatorEligibility(uint64 operatorId) external view returns (bool eligibility)
```

Get the eligibility of an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| eligibility | bool | The eligibility |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get the operator IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64[] | operatorIds The operator IDs |

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
constructor(address linkFunctionsAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| linkFunctionsAddress | address | The functions oracle contract address |

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
function setRequest(uint32 _fulfillGasLimit, uint64 _linkSubscriptionId, bytes _requestCBOR) external
```

Set the bytes representing the CBOR-encoded Functions.Request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _fulfillGasLimit | uint32 | Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function |
| _linkSubscriptionId | uint64 | The functions billing subscription ID used to pay for Functions requests |
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

## CasimirViews

### constructor

```solidity
constructor(address managerAddress, address registryAddress) public
```

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5] poolIds)
```

Get the next five compoundable pool IDs

_Should be called off-chain_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The start index |
| endIndex | uint256 | The end index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | The next five compoundable pool IDs |

### getEligibleOperatorIds

```solidity
function getEligibleOperatorIds(uint256 startIndex, uint256 endIndex) external view returns (uint64[] activeOperatorIds)
```

Get the active operator IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The start index |
| endIndex | uint256 | The end index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeOperatorIds | uint64[] | The active operator IDs |

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) public view returns (uint256 balance)
```

Get the swept balance

_Should be called off-chain_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The start index |
| endIndex | uint256 | The end index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | The swept balance |

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
  uint256 actionPeriodTimestamp;
  uint256 actionCount;
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

### ResharesRequested

```solidity
event ResharesRequested(uint64 operatorId)
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

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

### depositReservedFees

```solidity
function depositReservedFees() external payable
```

### depositClusterBalance

```solidity
function depositClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, bool processed) external
```

### depositUpkeepBalance

```solidity
function depositUpkeepBalance(uint256 feeAmount, bool processed) external
```

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
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
function initiateDeposit(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, bool processed) external
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

### requestReshares

```solidity
function requestReshares(uint64 operatorId) external
```

### reportForcedExits

```solidity
function reportForcedExits(uint32[] poolIds) external
```

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 poolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

### reportReshare

```solidity
function reportReshare(uint32 poolId, uint64[] operatorIds, uint64[] oldOperatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, struct ISSVNetworkCore.Cluster cluster, struct ISSVNetworkCore.Cluster oldCluster, uint256 feeAmount, bool processed) external
```

### withdrawLINKBalance

```solidity
function withdrawLINKBalance(uint256 amount) external
```

### withdrawSSVBalance

```solidity
function withdrawSSVBalance(uint256 amount) external
```

### setFunctionsAddress

```solidity
function setFunctionsAddress(address functionsAddress) external
```

### feePercent

```solidity
function feePercent() external view returns (uint32)
```

### requestedExits

```solidity
function requestedExits() external view returns (uint256)
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

### totalStake

```solidity
function totalStake() external view returns (uint256)
```

### getBufferedBalance

```solidity
function getBufferedBalance() external view returns (uint256)
```

### getExpectedEffectiveBalance

```solidity
function getExpectedEffectiveBalance() external view returns (uint256)
```

### finalizableCompletedExits

```solidity
function finalizableCompletedExits() external view returns (uint256)
```

### latestActiveBalance

```solidity
function latestActiveBalance() external view returns (uint256)
```

### latestActiveBalanceAfterFees

```solidity
function latestActiveBalanceAfterFees() external view returns (uint256)
```

### reportPeriod

```solidity
function reportPeriod() external view returns (uint256)
```

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool)
```

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() external view returns (uint256)
```

### prepoolBalance

```solidity
function prepoolBalance() external view returns (uint256)
```

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

### requestedWithdrawalBalance

```solidity
function requestedWithdrawalBalance() external view returns (uint256)
```

### requestedWithdrawals

```solidity
function requestedWithdrawals() external view returns (uint256)
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

### getUpkeepId

```solidity
function getUpkeepId() external view returns (uint256)
```

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address)
```

### getUpkeepBalance

```solidity
function getUpkeepBalance() external view returns (uint256 upkeepBalance)
```

## ICasimirPool

### PoolConfig

```solidity
struct PoolConfig {
  uint32 poolId;
  bytes publicKey;
  uint64[] operatorIds;
  uint256 reshares;
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

### setReshares

```solidity
function setReshares(uint256 reshares) external
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
  bool resharing;
  int256 collateral;
  uint256 poolCount;
  mapping(uint32 => bool) pools;
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

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

### getOperatorCollateral

```solidity
function getOperatorCollateral(uint64 operatorId) external view returns (int256)
```

### getOperatorEligibility

```solidity
function getOperatorEligibility(uint64 operatorId) external view returns (bool eligibility)
```

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
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

## ICasimirViews

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5])
```

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint256)
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

## CasimirManager

### Token

```solidity
enum Token {
  LINK,
  SSV,
  WETH
}
```

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

### depositStake

```solidity
function depositStake() external payable
```

Deposit user stake

### rebalanceStake

```solidity
function rebalanceStake(uint256 activeBalance, uint256 sweptRewards, uint256 sweptExits, uint32 completedDeposits, uint32 completedExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeBalance | uint256 | The active consensus balance |
| sweptRewards | uint256 | The swept consensus rewards |
| sweptExits | uint256 | The swept consensus exits |
| completedDeposits | uint32 | The completed deposit count |
| completedExits | uint32 | The completed exit count |

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

### requestPoolExits

```solidity
function requestPoolExits(uint256 count) external
```

Request a given count of staked pool exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The number of exits to request |

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
function completePoolExit(uint256 poolIndex, uint256 validatorIndex, uint256 finalEffectiveBalance, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Complete a pool exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The staked pool index |
| validatorIndex | uint256 | The staked validator (internal) index |
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

### getStake

```solidity
function getStake() public view returns (uint256 stake)
```

Get the manager stake

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| stake | uint256 | The manager stake |

### getBufferedBalance

```solidity
function getBufferedBalance() public view returns (uint256 bufferedBalance)
```

Get the manager buffered (execution) balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bufferedBalance | uint256 | The manager buffered (execution) balance |

### getPendingDeposits

```solidity
function getPendingDeposits() public view returns (uint256 pendingDeposits)
```

Get the manager pending (consensus) deposits

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pendingDeposits | uint256 | The manager pending (consensus) deposits |

### getExitedBalance

```solidity
function getExitedBalance() public view returns (uint256)
```

Get the manager exited (execution) balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | exitedBalance The manager exited (execution) balance |

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

### getActiveDeposits

```solidity
function getActiveDeposits() public view returns (uint256 activeDeposits)
```

Get the manager active (consensus) deposits

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| activeDeposits | uint256 | The manager active (consensus) deposits |

### latestActiveBalance

```solidity
function latestActiveBalance() public view returns (uint256)
```

Get the latest manager active (consensus) balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | activeBalance The latest manager active (consensus) balance |

### latestActiveBalanceAfterFees

```solidity
function latestActiveBalanceAfterFees() public view returns (uint256)
```

Get the manager latest active (consensus) balance after fees

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | activeBalanceAfterFees The manager latest active (consensus) balance after fees |

### requestedWithdrawals

```solidity
function requestedWithdrawals() public view returns (uint256)
```

Get the total pending withdrawals

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | pendingWithdrawals The total pending withdrawals |

### getPendingWithdrawalQueue

```solidity
function getPendingWithdrawalQueue() public view returns (struct ICasimirManager.Withdrawal[])
```

Get the pending withdrawal queue

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirManager.Withdrawal[] | pendingWithdrawalQueue The pending withdrawal queue |

### feePercent

```solidity
function feePercent() public view returns (uint32)
```

Get the total fee percentage

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | feePercent The total fee percentage |

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

## CasimirRegistry

### requiredCollateral

```solidity
uint256 requiredCollateral
```

### minimumCollateralDeposit

```solidity
uint256 minimumCollateralDeposit
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

### currentReportRequestBlock

```solidity
uint256 currentReportRequestBlock
```

Current report block

### latestSummaryRequestId

```solidity
bytes32 latestSummaryRequestId
```

Latest summary request ID

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
function rebalanceStake(uint256 activeBalance, uint256 sweptRewards, uint256 sweptExits, uint32 completedDeposits, uint32 completedExits) external
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

### requestPoolExits

```solidity
function requestPoolExits(uint256 count) external
```

### completePoolExit

```solidity
function completePoolExit(uint256 poolIndex, uint256 validatorIndex, uint256 finalEffectiveBalance, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

### setFeePercents

```solidity
function setFeePercents(uint32 ethFeePercent, uint32 linkFeePercent, uint32 ssvFeePercent) external
```

### setFunctionsAddress

```solidity
function setFunctionsAddress(address functionsAddress) external
```

### feePercent

```solidity
function feePercent() external view returns (uint32)
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

### getBufferedBalance

```solidity
function getBufferedBalance() external view returns (uint256)
```

### getActiveDeposits

```solidity
function getActiveDeposits() external view returns (uint256)
```

### latestActiveBalance

```solidity
function latestActiveBalance() external view returns (uint256)
```

### latestActiveBalanceAfterFees

```solidity
function latestActiveBalanceAfterFees() external view returns (uint256)
```

### getExitedBalance

```solidity
function getExitedBalance() external view returns (uint256)
```

### getOpenDeposits

```solidity
function getOpenDeposits() external view returns (uint256)
```

### getSweptBalance

```solidity
function getSweptBalance() external view returns (uint256)
```

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

### requestedWithdrawals

```solidity
function requestedWithdrawals() external view returns (uint256)
```

### getPendingWithdrawalQueue

```solidity
function getPendingWithdrawalQueue() external view returns (struct ICasimirManager.Withdrawal[])
```

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

## ICasimirUpkeep

### ReportStatus

```solidity
enum ReportStatus {
  FINALIZED,
  PENDING,
  PROCESSING
}
```

### DetailRequestType

```solidity
enum DetailRequestType {
  NONE,
  EXIT,
  SLASH
}
```

### DetailRequest

```solidity
struct DetailRequest {
  enum ICasimirUpkeep.DetailRequestType requestType;
  uint32 reportDetailIndex;
}
```

### Report

```solidity
struct Report {
  struct ICasimirUpkeep.Summary summary;
  struct ICasimirUpkeep.ExitDetail[] exitDetails;
  struct ICasimirUpkeep.SlashDetail[] slashDetails;
}
```

### Summary

```solidity
struct Summary {
  uint256 activeBalance;
  uint32 completedDeposits;
  uint32 completedExits;
  uint32 slashedExits;
  uint32 dummy;
}
```

### SlashDetail

```solidity
struct SlashDetail {
  uint32 poolId;
  uint256 expectedEffectiveBalance;
  uint32 blockDelay;
  uint32 firstOperatorBlame;
  uint32 secondOperatorBlame;
  uint32 thirdOperatorBlame;
  uint32 fourthOperatorBlame;
}
```

### ExitDetail

```solidity
struct ExitDetail {
  uint32 poolId;
  uint256 finalEffectiveBalance;
  uint32 firstOperatorBlame;
  uint32 secondOperatorBlame;
  uint32 thirdOperatorBlame;
  uint32 fourthOperatorBlame;
  uint32 dummy;
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

