# Solidity API

## CasimirManager

### upkeepRegistrationMinimum

```solidity
uint256 upkeepRegistrationMinimum
```

Minimum balance for upkeep registration (0.1 LINK)

### feePercent

```solidity
uint32 feePercent
```

Total fee percentage

### reportPeriod

```solidity
uint32 reportPeriod
```

Current report period

### upkeepId

```solidity
uint256 upkeepId
```

Upkeep ID

### latestActiveBalance

```solidity
uint256 latestActiveBalance
```

Latest active balance

### finalizableCompletedExits

```solidity
uint256 finalizableCompletedExits
```

Exited pool count

### requestedWithdrawalBalance

```solidity
uint256 requestedWithdrawalBalance
```

Total pending withdrawal amount

### requestedExits

```solidity
uint256 requestedExits
```

Exiting pool count

### onlyPool

```solidity
modifier onlyPool(uint32 poolId)
```

_Validate the caller is the authorized pool_

### onlyOracle

```solidity
modifier onlyOracle()
```

_Validate the caller is the oracle_

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

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) public view returns (bool pendingWithdrawalEligibility)
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
| pendingWithdrawalEligibility | bool | The eligibility of a pending withdrawal |

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

Pool capacity

### id

```solidity
uint32 id
```

Pool ID

### publicKey

```solidity
bytes publicKey
```

Validator public key

### reshares

```solidity
uint256 reshares
```

Reshares

### status

```solidity
enum ICasimirPool.PoolStatus status
```

Status

### constructor

```solidity
constructor(address registryAddress, uint32 _id, bytes _publicKey, uint64[] _operatorIds) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryAddress | address | The registry address |
| _id | uint32 | The pool ID |
| _publicKey | bytes | The validator public key |
| _operatorIds | uint64[] | The operator IDs |

### depositRewards

```solidity
function depositRewards() external
```

Deposit rewards from a pool to the manager

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

Withdraw balance from a pool to the manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blamePercents | uint32[] | The operator loss blame percents |

### setOperatorIds

```solidity
function setOperatorIds(uint64[] _operatorIds) external
```

Set the operator IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _operatorIds | uint64[] | The operator IDs |

### setReshares

```solidity
function setReshares(uint256 _reshares) external
```

Set the reshare count

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _reshares | uint256 | The reshare count |

### setStatus

```solidity
function setStatus(enum ICasimirPool.PoolStatus _status) external
```

Set the pool status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _status | enum ICasimirPool.PoolStatus | The pool status |

### getDetails

```solidity
function getDetails() external view returns (struct ICasimirPool.PoolDetails poolDetails)
```

Get the pool details

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolDetails | struct ICasimirPool.PoolDetails | The pool details |

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

Get the pool balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | balance The pool balance |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get the operator IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint64[] | operatorIds The operator IDs |

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

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| ssvNetworkViewsAddress | address | The SSV network views address |

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

### requestWithdrawal

```solidity
function requestWithdrawal(uint64 operatorId, uint256 amount) external
```

Request to withdraw collateral from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |
| amount | uint256 | The amount to withdraw |

### requestDeregistration

```solidity
function requestDeregistration(uint64 operatorId) external
```

Request deregistration for an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

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

### getOperator

```solidity
function getOperator(uint64 operatorId) external view returns (struct ICasimirRegistry.Operator operator)
```

Get an operator by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | The operator ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | struct ICasimirRegistry.Operator | The operator |

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
uint32 reportPeriod
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

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerAddress | address | The manager address |
| registryAddress | address | The registry address |

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

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256 depositedPoolCount)
```

Get the deposited pool count

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositedPoolCount | uint256 | The deposited pool count |

### getOperators

```solidity
function getOperators(uint256 startIndex, uint256 endIndex) external view returns (struct ICasimirRegistry.Operator[])
```

Get operators

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The start index |
| endIndex | uint256 | The end index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirRegistry.Operator[] | operators The operators |

### getPoolDetails

```solidity
function getPoolDetails(uint32 poolId) external view returns (struct ICasimirPool.PoolDetails poolDetails)
```

Get a pool's details by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolDetails | struct ICasimirPool.PoolDetails | The pool details |

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) public view returns (uint128 sweptBalance)
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
| sweptBalance | uint128 | The swept balance |

### getValidatorPublicKeys

```solidity
function getValidatorPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[])
```

Get the validator public keys

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The start index |
| endIndex | uint256 | The end index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes[] | validatorPublicKeys The validator public keys |

## ICasimirManager

### Token

```solidity
enum Token {
  LINK,
  SSV,
  WETH
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

### upkeepId

```solidity
function upkeepId() external view returns (uint256)
```

### latestActiveBalance

```solidity
function latestActiveBalance() external view returns (uint256)
```

### feePercent

```solidity
function feePercent() external view returns (uint32)
```

### requestedWithdrawalBalance

```solidity
function requestedWithdrawalBalance() external view returns (uint256)
```

### requestedExits

```solidity
function requestedExits() external view returns (uint256)
```

### finalizableCompletedExits

```solidity
function finalizableCompletedExits() external view returns (uint256)
```

### reportPeriod

```solidity
function reportPeriod() external view returns (uint32)
```

### getTotalStake

```solidity
function getTotalStake() external view returns (uint256)
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

### getBufferedBalance

```solidity
function getBufferedBalance() external view returns (uint256)
```

### getExpectedEffectiveBalance

```solidity
function getExpectedEffectiveBalance() external view returns (uint256)
```

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool)
```

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() external view returns (uint256)
```

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address)
```

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address)
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

### PoolDetails

```solidity
struct PoolDetails {
  uint32 id;
  uint256 balance;
  bytes publicKey;
  uint64[] operatorIds;
  uint256 reshares;
  enum ICasimirPool.PoolStatus status;
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

### id

```solidity
function id() external view returns (uint32)
```

### publicKey

```solidity
function publicKey() external view returns (bytes)
```

### reshares

```solidity
function reshares() external view returns (uint256)
```

### status

```solidity
function status() external view returns (enum ICasimirPool.PoolStatus)
```

### getDetails

```solidity
function getDetails() external view returns (struct ICasimirPool.PoolDetails)
```

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

## ICasimirRegistry

### Operator

```solidity
struct Operator {
  uint64 id;
  bool active;
  bool resharing;
  int256 collateral;
  uint256 poolCount;
}
```

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

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

### requestWithdrawal

```solidity
function requestWithdrawal(uint64 operatorId, uint256 amount) external
```

### requestDeregistration

```solidity
function requestDeregistration(uint64 operatorId) external
```

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

### getOperator

```solidity
function getOperator(uint64 operatorId) external view returns (struct ICasimirRegistry.Operator)
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

## ICasimirViews

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5])
```

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256 depositedPoolCount)
```

### getOperators

```solidity
function getOperators(uint256 startIndex, uint256 endIndex) external view returns (struct ICasimirRegistry.Operator[])
```

### getPoolDetails

```solidity
function getPoolDetails(uint32 poolId) external view returns (struct ICasimirPool.PoolDetails)
```

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128)
```

### getValidatorPublicKeys

```solidity
function getValidatorPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[])
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

