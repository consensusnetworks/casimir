# Solidity API

## CasimirCore

### onlyAddress

```solidity
function onlyAddress(address checkAddress) internal pure
```

_Validate an address is not the zero address_

## CasimirFactory

### managerBeaconAddress

```solidity
address managerBeaconAddress
```

Manager beacon address

### poolBeaconAddress

```solidity
address poolBeaconAddress
```

Pool beacon address

### registryBeaconAddress

```solidity
address registryBeaconAddress
```

Registry beacon address

### upkeepBeaconAddress

```solidity
address upkeepBeaconAddress
```

Upkeep beacon address

### viewsBeaconAddress

```solidity
address viewsBeaconAddress
```

Views beacon address

### constructor

```solidity
constructor(address managerBeaconAddress_, address poolBeaconAddress_, address registryBeaconAddress_, address upkeepBeaconAddress_, address viewsBeaconAddress_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerBeaconAddress_ | address | Manager beacon address |
| poolBeaconAddress_ | address | Pool beacon address |
| registryBeaconAddress_ | address | Registry beacon address |
| upkeepBeaconAddress_ | address | Upkeep beacon address |
| viewsBeaconAddress_ | address | Views beacon address |

### initialize

```solidity
function initialize() public
```

Initialize the contract

### deployManager

```solidity
function deployManager(address daoOracleAddress, address functionsOracleAddress, struct ICasimirCore.Strategy strategy) external
```

Deploy a new manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| daoOracleAddress | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCore.Strategy | Staking strategy configuration |

### getManagerConfig

```solidity
function getManagerConfig(uint32 managerId) external view returns (struct ICasimirCore.ManagerConfig)
```

Get manager config

### getManagerIds

```solidity
function getManagerIds() external view returns (uint32[])
```

Get the manager IDs

### getOwner

```solidity
function getOwner() external view returns (address)
```

Get the owner address

## CasimirManager

### lockPeriod

```solidity
uint256 lockPeriod
```

User stake lock period

### userFee

```solidity
uint32 userFee
```

User stake fee percentage

### eigenStake

```solidity
bool eigenStake
```

Whether eigen stake is enabled

### liquidStake

```solidity
bool liquidStake
```

Whether liquid stake is enabled

### reportPeriod

```solidity
uint32 reportPeriod
```

Current report period

### functionsId

```solidity
uint64 functionsId
```

Chainlink functions subscription ID

### upkeepId

```solidity
uint256 upkeepId
```

Chainlink upkeep subscription ID

### latestBeaconBalance

```solidity
uint256 latestBeaconBalance
```

Latest beacon chain balance

### finalizableActivations

```solidity
uint256 finalizableActivations
```

Fully reported activations in the current period

### finalizableCompletedExits

```solidity
uint256 finalizableCompletedExits
```

Fully reported completed exits in the current period

### requestedWithdrawalBalance

```solidity
uint256 requestedWithdrawalBalance
```

Requested withdrawal balance

### reservedFeeBalance

```solidity
uint256 reservedFeeBalance
```

Reserved fee balance

### requestedExits

```solidity
uint256 requestedExits
```

Requested exit count

### constructor

```solidity
constructor(contract IFunctionsBillingRegistry functionsBillingRegistry_, contract IKeeperRegistrar keeperRegistrar_, contract IAutomationRegistry keeperRegistry_, contract LinkTokenInterface linkToken_, contract ISSVClusters ssvNetwork_, contract IERC20Upgradeable ssvToken_, contract IUniswapV3Factory swapFactory_, contract ISwapRouter swapRouter_, contract IWETH9 wethToken_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| functionsBillingRegistry_ | contract IFunctionsBillingRegistry | Chainlink functions billing registry contract |
| keeperRegistrar_ | contract IKeeperRegistrar | Chainlink keeper registrar contract |
| keeperRegistry_ | contract IAutomationRegistry | Chainlink keeper registry contract |
| linkToken_ | contract LinkTokenInterface | Chainlink token contract |
| ssvNetwork_ | contract ISSVClusters | SSV network contract |
| ssvToken_ | contract IERC20Upgradeable | SSV token contract |
| swapFactory_ | contract IUniswapV3Factory | Uniswap factory contract |
| swapRouter_ | contract ISwapRouter | Uniswap router contract |
| wethToken_ | contract IWETH9 | WETH9 token contract |

### initialize

```solidity
function initialize(address daoOracleAddress_, address functionsOracleAddress, struct ICasimirCore.Strategy strategy) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| daoOracleAddress_ | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCore.Strategy | Staking strategy configuration |

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
function depositRewards(uint32 poolId) external payable
```

Deposit pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

Deposit pool exited balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

Deposit pool operator recovered balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositClusterBalance

```solidity
function depositClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to a cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositFunctionsBalance

```solidity
function depositFunctionsBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the functions balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositUpkeepBalance

```solidity
function depositUpkeepBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the upkeep balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
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

Withdraw reserved fees

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### rebalanceStake

```solidity
function rebalanceStake(uint256 beaconBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconBalance | uint256 | Beacon chain balance |
| sweptBalance | uint256 | Swept balance |
| activatedDeposits | uint256 | Activated deposit count |
| completedExits | uint256 | Withdrawn exit count |

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
```

Compound pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | Pool IDs |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Withdrawal amount |

### fulfillWithdrawals

```solidity
function fulfillWithdrawals(uint256 count) external
```

Fulfill pending withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | Withdrawal count |

### initiatePool

```solidity
function initiatePool(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares) external
```

Initiate the next ready pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| publicKey | bytes | Validator public key |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |
| operatorIds | uint64[] | Operator IDs |
| shares | bytes | Operator shares |

### activatePool

```solidity
function activatePool(uint256 pendingPoolIndex, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Activate a pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pendingPoolIndex | uint256 | Pending pool index |
| cluster | struct ISSVNetworkCore.Cluster | SSV cluster |
| feeAmount | uint256 | Fee amount |
| minTokenAmount | uint256 | Minimum token amount |
| processed | bool | Whether the fee has been processed |

### resharePool

```solidity
function resharePool(uint32 poolId, uint64[] operatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, struct ISSVNetworkCore.Cluster cluster, struct ISSVNetworkCore.Cluster oldCluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Report a reshare

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |
| operatorIds | uint64[] | Operator IDs |
| newOperatorId | uint64 | New operator ID |
| oldOperatorId | uint64 | Old operator ID |
| shares | bytes | Operator shares |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| oldCluster | struct ISSVNetworkCore.Cluster | Old cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### reportForcedExits

```solidity
function reportForcedExits(uint32[] poolIds) external
```

Report forced exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[] | Pool IDs |

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 stakedPoolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Report a completed exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakedPoolIndex | uint256 | Staked pool index |
| blamePercents | uint32[] | Operator blame percents (0 if balance is 32 ether) |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |

### withdrawClusterBalance

```solidity
function withdrawClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 amount) external
```

Withdraw cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| amount | uint256 | Amount to withdraw |

### cancelFunctions

```solidity
function cancelFunctions() external
```

Cancel the Chainlink functions subscription

### cancelUpkeep

```solidity
function cancelUpkeep() external
```

Cancel the Chainlink upkeep subscription

### withdrawLINKBalance

```solidity
function withdrawLINKBalance(uint256 amount) external
```

Withdraw LINK balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### withdrawSSVBalance

```solidity
function withdrawSSVBalance(uint256 amount) external
```

Withdraw SSV balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool pendingWithdrawalEligibility)
```

Get the eligibility of a pending withdrawal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | Index of the pending withdrawal |
| period | uint256 | Period to check |

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

Get the pending pool IDs

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get the staked pool IDs

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address poolAddress)
```

Get a pool address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address registryAddress)
```

Get the registry address

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address upkeepAddress)
```

Get the upkeep address

### getUserStake

```solidity
function getUserStake(address userAddress) public view returns (uint256 userStake)
```

Get user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | User address |

### getTotalStake

```solidity
function getTotalStake() public view returns (uint256 totalStake)
```

Get the total stake (buffered + beacon - requested withdrawals)

### getBufferedBalance

```solidity
function getBufferedBalance() public view returns (uint256 bufferedBalance)
```

Get the buffered balance (prepool + exited + ready)

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() public view returns (uint256 withdrawableBalance)
```

Get the withdrawable balance (prepool + exited)

## CasimirPool

### publicKey

```solidity
bytes publicKey
```

Validator public key

### reshares

```solidity
uint256 reshares
```

Reshare count

### status

```solidity
enum ICasimirCore.PoolStatus status
```

Pool status

### constructor

```solidity
constructor(contract IDepositContract depositContract_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositContract_ | contract IDepositContract | Beacon deposit contract |

### initialize

```solidity
function initialize(contract ICasimirRegistry registry_, uint64[] operatorIds_, uint32 poolId_, bytes publicKey_, bytes shares_) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| registry_ | contract ICasimirRegistry | Registry contract |
| operatorIds_ | uint64[] | The operator IDs |
| poolId_ | uint32 | Pool ID |
| publicKey_ | bytes | The validator public key |
| shares_ | bytes |  |

### depositStake

```solidity
function depositStake(bytes32 depositDataRoot, bytes signature, bytes withdrawalCredentials) external payable
```

Deposit pool stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |

### depositRewards

```solidity
function depositRewards() external
```

Deposit pool rewards

### setOperatorIds

```solidity
function setOperatorIds(uint64[] newOperatorIds) external
```

Set the operator IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOperatorIds | uint64[] | New operator IDs |

### setReshares

```solidity
function setReshares(uint256 newReshares) external
```

Set the reshare count

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newReshares | uint256 | New reshare count |

### setStatus

```solidity
function setStatus(enum ICasimirCore.PoolStatus newStatus) external
```

Set the pool status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newStatus | enum ICasimirCore.PoolStatus | New status |

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

Withdraw pool balance to the manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blamePercents | uint32[] | Operator loss blame percents |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get the pool operator IDs

### getRegistration

```solidity
function getRegistration() external view returns (struct ICasimirCore.PoolRegistration)
```

Get the pool registration

## CasimirRegistry

### minCollateral

```solidity
uint256 minCollateral
```

Minimum collateral per operator per pool

### privateOperators

```solidity
bool privateOperators
```

Whether private operators are enabled

### verifiedOperators

```solidity
bool verifiedOperators
```

Whether verified operators are enabled

### constructor

```solidity
constructor(contract ISSVViews ssvViews_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| ssvViews_ | contract ISSVViews | SSV views contract |

### initialize

```solidity
function initialize(uint256 minCollateral_, bool privateOperators_, bool verifiedOperators_) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minCollateral_ | uint256 | Minimum collateral per operator per pool |
| privateOperators_ | bool | Whether private operators are enabled |
| verifiedOperators_ | bool | Whether verified operators are enabled |

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

Register an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

Deposit operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### requestWithdrawal

```solidity
function requestWithdrawal(uint64 operatorId, uint256 amount) external
```

Request to withdraw operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| amount | uint256 | Amount to withdraw |

### requestDeactivation

```solidity
function requestDeactivation(uint64 operatorId) external
```

Request operator deactivation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

Add a pool to an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

Remove a pool from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |
| blameAmount | uint256 | Amount to recover from collateral |

### getOperator

```solidity
function getOperator(uint64 operatorId) external view returns (struct ICasimirCore.Operator operator)
```

Get an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get all previously registered operator IDs

## CasimirUpkeep

### compoundStake

```solidity
bool compoundStake
```

Whether compound stake is enabled

### constructor

```solidity
constructor() public
```

_Constructor_

### initialize

```solidity
function initialize(address factoryAddress, address functionsOracleAddress, bool compoundStake_) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| factoryAddress | address | Factory address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| compoundStake_ | bool | Whether compound stake is enabled |

### performUpkeep

```solidity
function performUpkeep(bytes) external
```

Perform the upkeep

### setFunctionsOracle

```solidity
function setFunctionsOracle(address newFunctionsOracleAddress) external
```

Set a new Chainlink functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newFunctionsOracleAddress | address | New Chainlink functions oracle address |

### setFunctionsRequest

```solidity
function setFunctionsRequest(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit) external
```

Set a new Chainlink functions request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newRequestSource | string | New Chainlink functions source code |
| newRequestArgs | string[] | New Chainlink functions arguments |
| newFulfillGasLimit | uint32 | New Chainlink functions fulfill gas limit |

### checkUpkeep

```solidity
function checkUpkeep(bytes) public view returns (bool upkeepNeeded, bytes checkData)
```

Check if the upkeep is needed

### fulfillRequest

```solidity
function fulfillRequest(bytes32 requestId, bytes response, bytes executionError) internal
```

_Callback that is invoked once the DON has resolved the request or hit an error_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | Request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the DON |
| executionError | bytes | Aggregated error from the code execution |

## CasimirViews

### constructor

```solidity
constructor() public
```

_Constructor_

### initialize

```solidity
function initialize(address managerAddress) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerAddress | address | Manager address |

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5] compoundablePoolIds)
```

Get the next five compoundable pool IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256 depositedPoolCount)
```

Get the deposited pool count

### getDepositedPoolPublicKeys

```solidity
function getDepositedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[])
```

Get the deposited pool public keys

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolStatuses

```solidity
function getDepositedPoolStatuses(uint256 startIndex, uint256 endIndex) external view returns (enum ICasimirCore.PoolStatus[])
```

Get the deposited pool statuses

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getOperators

```solidity
function getOperators(uint256 startIndex, uint256 endIndex) external view returns (struct ICasimirCore.Operator[])
```

Get operators

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getPoolConfig

```solidity
function getPoolConfig(uint32 poolId) external view returns (struct ICasimirCore.PoolConfig poolConfig)
```

Get pool config

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128 sweptBalance)
```

Get the swept balance (in gwei)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

## CasimirCoreDev

### onlyAddress

```solidity
function onlyAddress(address checkAddress) internal pure
```

_Validate an address is not the zero address_

## CasimirFactoryDev

### managerBeaconAddress

```solidity
address managerBeaconAddress
```

Manager beacon address

### poolBeaconAddress

```solidity
address poolBeaconAddress
```

Pool beacon address

### registryBeaconAddress

```solidity
address registryBeaconAddress
```

Registry beacon address

### upkeepBeaconAddress

```solidity
address upkeepBeaconAddress
```

Upkeep beacon address

### viewsBeaconAddress

```solidity
address viewsBeaconAddress
```

Views beacon address

### constructor

```solidity
constructor(address managerBeaconAddress_, address poolBeaconAddress_, address registryBeaconAddress_, address upkeepBeaconAddress_, address viewsBeaconAddress_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerBeaconAddress_ | address | Manager beacon address |
| poolBeaconAddress_ | address | Pool beacon address |
| registryBeaconAddress_ | address | Registry beacon address |
| upkeepBeaconAddress_ | address | Upkeep beacon address |
| viewsBeaconAddress_ | address | Views beacon address |

### initialize

```solidity
function initialize() public
```

Initialize the contract

### deployManager

```solidity
function deployManager(address daoOracleAddress, address functionsOracleAddress, struct ICasimirCoreDev.Strategy strategy) external
```

Deploy a new manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| daoOracleAddress | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCoreDev.Strategy | Staking strategy configuration |

### getManagerConfig

```solidity
function getManagerConfig(uint32 managerId) external view returns (struct ICasimirCoreDev.ManagerConfig)
```

Get manager config

### getManagerIds

```solidity
function getManagerIds() external view returns (uint32[])
```

Get the manager IDs

### getOwner

```solidity
function getOwner() external view returns (address)
```

Get the owner address

## CasimirManagerDev

### lockPeriod

```solidity
uint256 lockPeriod
```

User stake lock period

### userFee

```solidity
uint32 userFee
```

User stake fee percentage

### eigenStake

```solidity
bool eigenStake
```

Whether eigen stake is enabled

### liquidStake

```solidity
bool liquidStake
```

Whether liquid stake is enabled

### reportPeriod

```solidity
uint32 reportPeriod
```

Current report period

### functionsId

```solidity
uint64 functionsId
```

Chainlink functions subscription ID

### upkeepId

```solidity
uint256 upkeepId
```

Chainlink upkeep subscription ID

### latestBeaconBalance

```solidity
uint256 latestBeaconBalance
```

Latest beacon chain balance

### finalizableActivations

```solidity
uint256 finalizableActivations
```

Fully reported activations in the current period

### finalizableCompletedExits

```solidity
uint256 finalizableCompletedExits
```

Fully reported completed exits in the current period

### requestedWithdrawalBalance

```solidity
uint256 requestedWithdrawalBalance
```

Requested withdrawal balance

### reservedFeeBalance

```solidity
uint256 reservedFeeBalance
```

Reserved fee balance

### requestedExits

```solidity
uint256 requestedExits
```

Requested exit count

### constructor

```solidity
constructor(contract IFunctionsBillingRegistry functionsBillingRegistry_, contract IKeeperRegistrar keeperRegistrar_, contract IAutomationRegistry keeperRegistry_, contract LinkTokenInterface linkToken_, contract ISSVClusters ssvNetwork_, contract IERC20Upgradeable ssvToken_, contract IUniswapV3Factory swapFactory_, contract ISwapRouter swapRouter_, contract IWETH9 wethToken_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| functionsBillingRegistry_ | contract IFunctionsBillingRegistry | Chainlink functions billing registry contract |
| keeperRegistrar_ | contract IKeeperRegistrar | Chainlink keeper registrar contract |
| keeperRegistry_ | contract IAutomationRegistry | Chainlink keeper registry contract |
| linkToken_ | contract LinkTokenInterface | Chainlink token contract |
| ssvNetwork_ | contract ISSVClusters | SSV network contract |
| ssvToken_ | contract IERC20Upgradeable | SSV token contract |
| swapFactory_ | contract IUniswapV3Factory | Uniswap factory contract |
| swapRouter_ | contract ISwapRouter | Uniswap router contract |
| wethToken_ | contract IWETH9 | WETH9 token contract |

### initialize

```solidity
function initialize(address daoOracleAddress_, address functionsOracleAddress, struct ICasimirCoreDev.Strategy strategy) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| daoOracleAddress_ | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCoreDev.Strategy | Staking strategy configuration |

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
function depositRewards(uint32 poolId) external payable
```

Deposit pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

Deposit pool exited balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

Deposit pool operator recovered balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositClusterBalance

```solidity
function depositClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to a cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositFunctionsBalance

```solidity
function depositFunctionsBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the functions balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositUpkeepBalance

```solidity
function depositUpkeepBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the upkeep balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
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

Withdraw reserved fees

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### rebalanceStake

```solidity
function rebalanceStake(uint256 beaconBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconBalance | uint256 | Beacon chain balance |
| sweptBalance | uint256 | Swept balance |
| activatedDeposits | uint256 | Activated deposit count |
| completedExits | uint256 | Withdrawn exit count |

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
```

Compound pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | Pool IDs |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Withdrawal amount |

### fulfillWithdrawals

```solidity
function fulfillWithdrawals(uint256 count) external
```

Fulfill pending withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | Withdrawal count |

### initiatePool

```solidity
function initiatePool(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares) external
```

Initiate the next ready pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| publicKey | bytes | Validator public key |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |
| operatorIds | uint64[] | Operator IDs |
| shares | bytes | Operator shares |

### activatePool

```solidity
function activatePool(uint256 pendingPoolIndex, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Activate a pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pendingPoolIndex | uint256 | Pending pool index |
| cluster | struct ISSVNetworkCore.Cluster | SSV cluster |
| feeAmount | uint256 | Fee amount |
| minTokenAmount | uint256 | Minimum token amount |
| processed | bool | Whether the fee has been processed |

### resharePool

```solidity
function resharePool(uint32 poolId, uint64[] operatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, struct ISSVNetworkCore.Cluster cluster, struct ISSVNetworkCore.Cluster oldCluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Report a reshare

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |
| operatorIds | uint64[] | Operator IDs |
| newOperatorId | uint64 | New operator ID |
| oldOperatorId | uint64 | Old operator ID |
| shares | bytes | Operator shares |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| oldCluster | struct ISSVNetworkCore.Cluster | Old cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### reportForcedExits

```solidity
function reportForcedExits(uint32[] poolIds) external
```

Report forced exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[] | Pool IDs |

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 stakedPoolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Report a completed exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakedPoolIndex | uint256 | Staked pool index |
| blamePercents | uint32[] | Operator blame percents (0 if balance is 32 ether) |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |

### withdrawClusterBalance

```solidity
function withdrawClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 amount) external
```

Withdraw cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| amount | uint256 | Amount to withdraw |

### cancelFunctions

```solidity
function cancelFunctions() external
```

Cancel the Chainlink functions subscription

### cancelUpkeep

```solidity
function cancelUpkeep() external
```

Cancel the Chainlink upkeep subscription

### withdrawLINKBalance

```solidity
function withdrawLINKBalance(uint256 amount) external
```

Withdraw LINK balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### withdrawSSVBalance

```solidity
function withdrawSSVBalance(uint256 amount) external
```

Withdraw SSV balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool pendingWithdrawalEligibility)
```

Get the eligibility of a pending withdrawal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | Index of the pending withdrawal |
| period | uint256 | Period to check |

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

Get the pending pool IDs

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get the staked pool IDs

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address poolAddress)
```

Get a pool address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address registryAddress)
```

Get the registry address

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address upkeepAddress)
```

Get the upkeep address

### getUserStake

```solidity
function getUserStake(address userAddress) public view returns (uint256 userStake)
```

Get user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | User address |

### getTotalStake

```solidity
function getTotalStake() public view returns (uint256 totalStake)
```

Get the total stake (buffered + beacon - requested withdrawals)

### getBufferedBalance

```solidity
function getBufferedBalance() public view returns (uint256 bufferedBalance)
```

Get the buffered balance (prepool + exited + ready)

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() public view returns (uint256 withdrawableBalance)
```

Get the withdrawable balance (prepool + exited)

## CasimirPoolDev

### publicKey

```solidity
bytes publicKey
```

Validator public key

### reshares

```solidity
uint256 reshares
```

Reshare count

### status

```solidity
enum ICasimirCoreDev.PoolStatus status
```

Pool status

### constructor

```solidity
constructor(contract IDepositContract depositContract_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositContract_ | contract IDepositContract | Beacon deposit contract |

### initialize

```solidity
function initialize(contract ICasimirRegistryDev registry_, uint64[] operatorIds_, uint32 poolId_, bytes publicKey_, bytes shares_) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| registry_ | contract ICasimirRegistryDev | Registry contract |
| operatorIds_ | uint64[] | The operator IDs |
| poolId_ | uint32 | Pool ID |
| publicKey_ | bytes | The validator public key |
| shares_ | bytes |  |

### depositStake

```solidity
function depositStake(bytes32 depositDataRoot, bytes signature, bytes withdrawalCredentials) external payable
```

Deposit pool stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |

### depositRewards

```solidity
function depositRewards() external
```

Deposit pool rewards

### setOperatorIds

```solidity
function setOperatorIds(uint64[] newOperatorIds) external
```

Set the operator IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOperatorIds | uint64[] | New operator IDs |

### setReshares

```solidity
function setReshares(uint256 newReshares) external
```

Set the reshare count

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newReshares | uint256 | New reshare count |

### setStatus

```solidity
function setStatus(enum ICasimirCoreDev.PoolStatus newStatus) external
```

Set the pool status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newStatus | enum ICasimirCoreDev.PoolStatus | New status |

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

Withdraw pool balance to the manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blamePercents | uint32[] | Operator loss blame percents |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get the pool operator IDs

### getRegistration

```solidity
function getRegistration() external view returns (struct ICasimirCoreDev.PoolRegistration)
```

Get the pool registration

## CasimirRegistryDev

### minCollateral

```solidity
uint256 minCollateral
```

Minimum collateral per operator per pool

### privateOperators

```solidity
bool privateOperators
```

Whether private operators are enabled

### verifiedOperators

```solidity
bool verifiedOperators
```

Whether verified operators are enabled

### constructor

```solidity
constructor(contract ISSVViews ssvViews_) public
```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| ssvViews_ | contract ISSVViews | SSV views contract |

### initialize

```solidity
function initialize(uint256 minCollateral_, bool privateOperators_, bool verifiedOperators_) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minCollateral_ | uint256 | Minimum collateral per operator per pool |
| privateOperators_ | bool | Whether private operators are enabled |
| verifiedOperators_ | bool | Whether verified operators are enabled |

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

Register an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

Deposit operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### requestWithdrawal

```solidity
function requestWithdrawal(uint64 operatorId, uint256 amount) external
```

Request to withdraw operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| amount | uint256 | Amount to withdraw |

### requestDeactivation

```solidity
function requestDeactivation(uint64 operatorId) external
```

Request operator deactivation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

Add a pool to an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

Remove a pool from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |
| blameAmount | uint256 | Amount to recover from collateral |

### getOperator

```solidity
function getOperator(uint64 operatorId) external view returns (struct ICasimirCoreDev.Operator operator)
```

Get an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get all previously registered operator IDs

## CasimirUpkeepDev

### compoundStake

```solidity
bool compoundStake
```

Whether compound stake is enabled

### constructor

```solidity
constructor() public
```

_Constructor_

### initialize

```solidity
function initialize(address factoryAddress, address functionsOracleAddress, bool compoundStake_) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| factoryAddress | address | Factory address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| compoundStake_ | bool | Whether compound stake is enabled |

### performUpkeep

```solidity
function performUpkeep(bytes) external
```

Perform the upkeep

### setFunctionsOracle

```solidity
function setFunctionsOracle(address newFunctionsOracleAddress) external
```

Set a new Chainlink functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newFunctionsOracleAddress | address | New Chainlink functions oracle address |

### setFunctionsRequest

```solidity
function setFunctionsRequest(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit) external
```

Set a new Chainlink functions request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newRequestSource | string | New Chainlink functions source code |
| newRequestArgs | string[] | New Chainlink functions arguments |
| newFulfillGasLimit | uint32 | New Chainlink functions fulfill gas limit |

### checkUpkeep

```solidity
function checkUpkeep(bytes) public view returns (bool upkeepNeeded, bytes checkData)
```

Check if the upkeep is needed

### fulfillRequest

```solidity
function fulfillRequest(bytes32 requestId, bytes response, bytes executionError) internal
```

_Callback that is invoked once the DON has resolved the request or hit an error_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | Request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the DON |
| executionError | bytes | Aggregated error from the code execution |

## CasimirViewsDev

### constructor

```solidity
constructor() public
```

_Constructor_

### initialize

```solidity
function initialize(address managerAddress) public
```

Initialize the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerAddress | address | Manager address |

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5] compoundablePoolIds)
```

Get the next five compoundable pool IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256 depositedPoolCount)
```

Get the deposited pool count

### getDepositedPoolPublicKeys

```solidity
function getDepositedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[])
```

Get the deposited pool public keys

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolStatuses

```solidity
function getDepositedPoolStatuses(uint256 startIndex, uint256 endIndex) external view returns (enum ICasimirCoreDev.PoolStatus[])
```

Get the deposited pool statuses

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getOperators

```solidity
function getOperators(uint256 startIndex, uint256 endIndex) external view returns (struct ICasimirCoreDev.Operator[])
```

Get operators

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getPoolConfig

```solidity
function getPoolConfig(uint32 poolId) external view returns (struct ICasimirCoreDev.PoolConfig poolConfig)
```

Get pool config

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128 sweptBalance)
```

Get the swept balance (in gwei)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

## ICasimirCoreDev

### ManagerConfig

```solidity
struct ManagerConfig {
  address managerAddress;
  address registryAddress;
  address upkeepAddress;
  address viewsAddress;
  struct ICasimirCoreDev.Strategy strategy;
}
```

### Operator

```solidity
struct Operator {
  uint64 id;
  bool active;
  uint256 collateral;
  uint256 poolCount;
  bool resharing;
}
```

### PoolConfig

```solidity
struct PoolConfig {
  address poolAddress;
  uint256 balance;
  uint64[] operatorIds;
  bytes publicKey;
  uint256 reshares;
  enum ICasimirCoreDev.PoolStatus status;
}
```

### PoolRegistration

```solidity
struct PoolRegistration {
  uint64[] operatorIds;
  bytes publicKey;
  bytes shares;
  enum ICasimirCoreDev.PoolStatus status;
}
```

### PoolStatus

```solidity
enum PoolStatus {
  READY,
  PENDING,
  ACTIVE,
  EXITING_FORCED,
  EXITING_REQUESTED,
  WITHDRAWN
}
```

### Strategy

```solidity
struct Strategy {
  uint256 minCollateral;
  uint256 lockPeriod;
  uint32 userFee;
  bool compoundStake;
  bool eigenStake;
  bool liquidStake;
  bool privateOperators;
  bool verifiedOperators;
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
  address userAddress;
  uint256 amount;
  uint256 period;
}
```

### InvalidAddress

```solidity
error InvalidAddress()
```

### InvalidAmount

```solidity
error InvalidAmount()
```

### PoolAlreadyInitiated

```solidity
error PoolAlreadyInitiated()
```

### PoolAlreadyWithdrawn

```solidity
error PoolAlreadyWithdrawn()
```

### PoolMaxReshared

```solidity
error PoolMaxReshared()
```

### PoolNotActive

```solidity
error PoolNotActive()
```

### PoolNotPending

```solidity
error PoolNotPending()
```

### PoolNotExiting

```solidity
error PoolNotExiting()
```

### TransferFailed

```solidity
error TransferFailed()
```

### Unauthorized

```solidity
error Unauthorized()
```

## ICasimirFactoryDev

### FunctionsRequestSet

```solidity
event FunctionsRequestSet(uint32 managerId, string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit)
```

### FunctionsOracleSet

```solidity
event FunctionsOracleSet(uint32 managerId, address newFunctionsOracleAddress)
```

### ManagerDeployed

```solidity
event ManagerDeployed(uint32 managerId)
```

### ReservedFeesWithdrawn

```solidity
event ReservedFeesWithdrawn(uint32 managerId, uint256 amount)
```

### deployManager

```solidity
function deployManager(address daoOracleAddress, address functionsOracleAddress, struct ICasimirCoreDev.Strategy strategy) external
```

Deploy a new manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| daoOracleAddress | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCoreDev.Strategy | Staking strategy configuration |

### managerBeaconAddress

```solidity
function managerBeaconAddress() external view returns (address)
```

Manager beacon address

### poolBeaconAddress

```solidity
function poolBeaconAddress() external view returns (address)
```

Pool beacon address

### registryBeaconAddress

```solidity
function registryBeaconAddress() external view returns (address)
```

Registry beacon address

### upkeepBeaconAddress

```solidity
function upkeepBeaconAddress() external view returns (address)
```

Upkeep beacon address

### viewsBeaconAddress

```solidity
function viewsBeaconAddress() external view returns (address)
```

Views beacon address

### getManagerConfig

```solidity
function getManagerConfig(uint32 managerId) external view returns (struct ICasimirCoreDev.ManagerConfig)
```

Get manager config

### getManagerIds

```solidity
function getManagerIds() external view returns (uint32[])
```

Get the manager IDs

### getOwner

```solidity
function getOwner() external view returns (address)
```

Get the owner address

## ICasimirManagerDev

### ClusterBalanceDeposited

```solidity
event ClusterBalanceDeposited(uint256 amount)
```

### PoolActivated

```solidity
event PoolActivated(uint32 poolId)
```

### PoolInitiated

```solidity
event PoolInitiated(uint32 poolId)
```

### InitiationRequested

```solidity
event InitiationRequested(uint32 poolId)
```

### PoolReshared

```solidity
event PoolReshared(uint32 poolId)
```

### ExitRequested

```solidity
event ExitRequested(uint32 poolId)
```

### ForcedExitsReported

```solidity
event ForcedExitsReported(uint32[] poolIds)
```

### LINKBalanceWithdrawn

```solidity
event LINKBalanceWithdrawn(uint256 amount)
```

### ExitedBalanceDeposited

```solidity
event ExitedBalanceDeposited(uint32 poolId, uint256 amount)
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

### RecoveredBalanceDeposited

```solidity
event RecoveredBalanceDeposited(uint32 poolId, uint256 amount)
```

### ReservedFeesDeposited

```solidity
event ReservedFeesDeposited(uint256 amount)
```

### ReservedFeesWithdrawn

```solidity
event ReservedFeesWithdrawn(uint256 amount)
```

### RewardsDeposited

```solidity
event RewardsDeposited(uint256 amount)
```

### SSVBalanceWithdrawn

```solidity
event SSVBalanceWithdrawn(uint256 amount)
```

### TipsDeposited

```solidity
event TipsDeposited(uint256 amount)
```

### FunctionsBalanceDeposited

```solidity
event FunctionsBalanceDeposited(uint256 amount)
```

### UpkeepBalanceDeposited

```solidity
event UpkeepBalanceDeposited(uint256 amount)
```

### FunctionsCancelled

```solidity
event FunctionsCancelled()
```

### UpkeepCancelled

```solidity
event UpkeepCancelled()
```

### WithdrawalFulfilled

```solidity
event WithdrawalFulfilled(address sender, uint256 amount)
```

### WithdrawalRequested

```solidity
event WithdrawalRequested(address sender, uint256 amount)
```

### WithdrawalInitiated

```solidity
event WithdrawalInitiated(address sender, uint256 amount)
```

### ForcedExitAlreadyReported

```solidity
error ForcedExitAlreadyReported()
```

### InsufficientLiquidity

```solidity
error InsufficientLiquidity()
```

### NoReadyPools

```solidity
error NoReadyPools()
```

### depositStake

```solidity
function depositStake() external payable
```

Deposit user stake

### depositRewards

```solidity
function depositRewards(uint32 poolId) external payable
```

Deposit pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

Deposit pool exited balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

Deposit pool operator recovered balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositReservedFees

```solidity
function depositReservedFees() external payable
```

Deposit reserved fees

### depositClusterBalance

```solidity
function depositClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to a cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositFunctionsBalance

```solidity
function depositFunctionsBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the functions balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositUpkeepBalance

```solidity
function depositUpkeepBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the upkeep balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### rebalanceStake

```solidity
function rebalanceStake(uint256 beaconBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconBalance | uint256 | Beacon chain balance |
| sweptBalance | uint256 | Swept balance |
| activatedDeposits | uint256 | Activated deposit count |
| completedExits | uint256 | Withdrawn exit count |

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
```

Compound pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | Pool IDs |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Withdrawal amount |

### fulfillWithdrawals

```solidity
function fulfillWithdrawals(uint256 count) external
```

Fulfill pending withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | Withdrawal count |

### initiatePool

```solidity
function initiatePool(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares) external
```

Initiate the next ready pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| publicKey | bytes | Validator public key |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |
| operatorIds | uint64[] | Operator IDs |
| shares | bytes | Operator shares |

### withdrawReservedFees

```solidity
function withdrawReservedFees(uint256 amount) external
```

Withdraw reserved fees

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### activatePool

```solidity
function activatePool(uint256 pendingPoolIndex, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Activate a pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pendingPoolIndex | uint256 | Pending pool index |
| cluster | struct ISSVNetworkCore.Cluster | SSV cluster |
| feeAmount | uint256 | Fee amount |
| minTokenAmount | uint256 | Minimum token amount |
| processed | bool | Whether the fee has been processed |

### resharePool

```solidity
function resharePool(uint32 poolId, uint64[] operatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, struct ISSVNetworkCore.Cluster cluster, struct ISSVNetworkCore.Cluster oldCluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Report a reshare

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |
| operatorIds | uint64[] | Operator IDs |
| newOperatorId | uint64 | New operator ID |
| oldOperatorId | uint64 | Old operator ID |
| shares | bytes | Operator shares |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| oldCluster | struct ISSVNetworkCore.Cluster | Old cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### reportForcedExits

```solidity
function reportForcedExits(uint32[] poolIds) external
```

Report forced exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[] | Pool IDs |

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 stakedPoolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Report a completed exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakedPoolIndex | uint256 | Staked pool index |
| blamePercents | uint32[] | Operator blame percents (0 if balance is 32 ether) |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |

### withdrawClusterBalance

```solidity
function withdrawClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 amount) external
```

Withdraw cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| amount | uint256 | Amount to withdraw |

### withdrawLINKBalance

```solidity
function withdrawLINKBalance(uint256 amount) external
```

Withdraw LINK balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### withdrawSSVBalance

```solidity
function withdrawSSVBalance(uint256 amount) external
```

Withdraw SSV balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### cancelFunctions

```solidity
function cancelFunctions() external
```

Cancel the Chainlink functions subscription

### cancelUpkeep

```solidity
function cancelUpkeep() external
```

Cancel the Chainlink upkeep subscription

### lockPeriod

```solidity
function lockPeriod() external view returns (uint256)
```

User stake lock period

### userFee

```solidity
function userFee() external view returns (uint32)
```

User stake fee percentage

### eigenStake

```solidity
function eigenStake() external view returns (bool)
```

Whether eigen stake is enabled

### liquidStake

```solidity
function liquidStake() external view returns (bool)
```

Whether liquid stake is enabled

### functionsId

```solidity
function functionsId() external view returns (uint64)
```

Chainlink functions subscription ID

### upkeepId

```solidity
function upkeepId() external view returns (uint256)
```

Chainlink upkeep subscription ID

### latestBeaconBalance

```solidity
function latestBeaconBalance() external view returns (uint256)
```

Latest beacon chain balance

### reservedFeeBalance

```solidity
function reservedFeeBalance() external view returns (uint256)
```

Reserved fee balance

### requestedWithdrawalBalance

```solidity
function requestedWithdrawalBalance() external view returns (uint256)
```

Requested withdrawal balance

### requestedExits

```solidity
function requestedExits() external view returns (uint256)
```

Requested exit count

### finalizableActivations

```solidity
function finalizableActivations() external view returns (uint256)
```

Fully reported activations in the current period

### finalizableCompletedExits

```solidity
function finalizableCompletedExits() external view returns (uint256)
```

Fully reported completed exits in the current period

### reportPeriod

```solidity
function reportPeriod() external view returns (uint32)
```

Current report period

### getTotalStake

```solidity
function getTotalStake() external view returns (uint256)
```

Get the total stake (buffered + beacon - requested withdrawals)

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

Get the pending pool IDs

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get the staked pool IDs

### getBufferedBalance

```solidity
function getBufferedBalance() external view returns (uint256)
```

Get the buffered balance (prepool + exited + ready)

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool)
```

Get the eligibility of a pending withdrawal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | Index of the pending withdrawal |
| period | uint256 | Period to check |

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() external view returns (uint256)
```

Get the withdrawable balance (prepool + exited)

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

Get user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | User address |

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address)
```

Get a pool address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address)
```

Get the registry address

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address)
```

Get the upkeep address

## ICasimirPoolDev

### OperatorIdsSet

```solidity
event OperatorIdsSet(uint64[] operatorIds)
```

### ResharesSet

```solidity
event ResharesSet(uint256 reshares)
```

### StatusSet

```solidity
event StatusSet(enum ICasimirCoreDev.PoolStatus status)
```

### InvalidDepositAmount

```solidity
error InvalidDepositAmount()
```

### InvalidWithdrawalCredentials

```solidity
error InvalidWithdrawalCredentials()
```

### depositStake

```solidity
function depositStake(bytes32 depositDataRoot, bytes signature, bytes withdrawalCredentials) external payable
```

Deposit pool stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |

### depositRewards

```solidity
function depositRewards() external
```

Deposit pool rewards

### setOperatorIds

```solidity
function setOperatorIds(uint64[] newOperatorIds) external
```

Set the operator IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOperatorIds | uint64[] | New operator IDs |

### setReshares

```solidity
function setReshares(uint256 newReshares) external
```

Set the reshare count

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newReshares | uint256 | New reshare count |

### setStatus

```solidity
function setStatus(enum ICasimirCoreDev.PoolStatus newStatus) external
```

Set the pool status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newStatus | enum ICasimirCoreDev.PoolStatus | New status |

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

Withdraw pool balance to the manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blamePercents | uint32[] | Operator loss blame percents |

### publicKey

```solidity
function publicKey() external view returns (bytes)
```

Validator public key

### reshares

```solidity
function reshares() external view returns (uint256)
```

Reshare count

### status

```solidity
function status() external view returns (enum ICasimirCoreDev.PoolStatus)
```

Pool status

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get the pool operator IDs

### getRegistration

```solidity
function getRegistration() external view returns (struct ICasimirCoreDev.PoolRegistration)
```

Get the pool registration

## ICasimirRegistryDev

### CollateralDeposited

```solidity
event CollateralDeposited(uint64 operatorId, uint256 amount)
```

### DeactivationCompleted

```solidity
event DeactivationCompleted(uint64 operatorId)
```

### DeactivationRequested

```solidity
event DeactivationRequested(uint64 operatorId)
```

### DeregistrationCompleted

```solidity
event DeregistrationCompleted(uint64 operatorId)
```

### OperatorPoolAdded

```solidity
event OperatorPoolAdded(uint64 operatorId, uint32 poolId)
```

### OperatorPoolRemoved

```solidity
event OperatorPoolRemoved(uint64 operatorId, uint32 poolId, uint256 blameAmount)
```

### OperatorRegistered

```solidity
event OperatorRegistered(uint64 operatorId)
```

### WithdrawalFulfilled

```solidity
event WithdrawalFulfilled(uint64 operatorId, uint256 amount)
```

### CollateralInUse

```solidity
error CollateralInUse()
```

### InsufficientCollateral

```solidity
error InsufficientCollateral()
```

### OperatorAlreadyRegistered

```solidity
error OperatorAlreadyRegistered()
```

### OperatorNotActive

```solidity
error OperatorNotActive()
```

### OperatorNotPrivate

```solidity
error OperatorNotPrivate()
```

### OperatorResharing

```solidity
error OperatorResharing()
```

### PoolAlreadyExists

```solidity
error PoolAlreadyExists()
```

### PoolDoesNotExist

```solidity
error PoolDoesNotExist()
```

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

Register an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

Deposit operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### requestWithdrawal

```solidity
function requestWithdrawal(uint64 operatorId, uint256 amount) external
```

Request to withdraw operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| amount | uint256 | Amount to withdraw |

### requestDeactivation

```solidity
function requestDeactivation(uint64 operatorId) external
```

Request operator deactivation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

Add a pool to an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

Remove a pool from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |
| blameAmount | uint256 | Amount to recover from collateral |

### getOperator

```solidity
function getOperator(uint64 operatorId) external view returns (struct ICasimirCoreDev.Operator)
```

Get an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get all previously registered operator IDs

### minCollateral

```solidity
function minCollateral() external view returns (uint256)
```

Minimum collateral per operator per pool

### privateOperators

```solidity
function privateOperators() external view returns (bool)
```

Whether private operators are enabled

### verifiedOperators

```solidity
function verifiedOperators() external view returns (bool)
```

Whether verified operators are enabled

## ICasimirUpkeepDev

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

### ActivationsRequested

```solidity
event ActivationsRequested(uint256 count)
```

### ForcedExitReportsRequested

```solidity
event ForcedExitReportsRequested(uint256 count)
```

### CompletedExitReportsRequested

```solidity
event CompletedExitReportsRequested(uint256 count)
```

### OCRResponse

```solidity
event OCRResponse(bytes32 requestId, bytes result, bytes err)
```

### FunctionsRequestSet

```solidity
event FunctionsRequestSet(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit)
```

### FunctionsOracleAddressSet

```solidity
event FunctionsOracleAddressSet(address newFunctionsOracleAddress)
```

### UpkeepPerformed

```solidity
event UpkeepPerformed(enum ICasimirUpkeepDev.ReportStatus status)
```

### InvalidRequest

```solidity
error InvalidRequest()
```

### UpkeepNotNeeded

```solidity
error UpkeepNotNeeded()
```

### performUpkeep

```solidity
function performUpkeep(bytes) external
```

Perform the upkeep

### setFunctionsRequest

```solidity
function setFunctionsRequest(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit) external
```

Set a new Chainlink functions request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newRequestSource | string | New Chainlink functions source code |
| newRequestArgs | string[] | New Chainlink functions arguments |
| newFulfillGasLimit | uint32 | New Chainlink functions fulfill gas limit |

### setFunctionsOracle

```solidity
function setFunctionsOracle(address newFunctionsOracleAddress) external
```

Set a new Chainlink functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newFunctionsOracleAddress | address | New Chainlink functions oracle address |

### checkUpkeep

```solidity
function checkUpkeep(bytes checkData) external view returns (bool upkeepNeeded, bytes)
```

Check if the upkeep is needed

### compoundStake

```solidity
function compoundStake() external view returns (bool)
```

Whether compound stake is enabled

## ICasimirViewsDev

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5])
```

Get the next five compoundable pool IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256)
```

Get the deposited pool count

### getDepositedPoolPublicKeys

```solidity
function getDepositedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[])
```

Get the deposited pool public keys

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolStatuses

```solidity
function getDepositedPoolStatuses(uint256 startIndex, uint256 endIndex) external view returns (enum ICasimirCoreDev.PoolStatus[])
```

Get the deposited pool statuses

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getOperators

```solidity
function getOperators(uint256 startIndex, uint256 endIndex) external view returns (struct ICasimirCoreDev.Operator[])
```

Get operators

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getPoolConfig

```solidity
function getPoolConfig(uint32 poolId) external view returns (struct ICasimirCoreDev.PoolConfig)
```

Get pool config

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128)
```

Get the swept balance (in gwei)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

## CasimirArrayDev

### IndexOutOfBounds

```solidity
error IndexOutOfBounds()
```

### EmptyArray

```solidity
error EmptyArray()
```

### removeUint32Item

```solidity
function removeUint32Item(uint32[] uint32Array, uint256 index) internal
```

### removeBytesItem

```solidity
function removeBytesItem(bytes[] bytesArray, uint256 index) internal
```

### removeWithdrawalItem

```solidity
function removeWithdrawalItem(struct ICasimirCoreDev.Withdrawal[] withdrawals, uint256 index) internal
```

## CasimirBeaconDev

### createManager

```solidity
function createManager(address managerBeaconAddress, address daoOracleAddress, address functionsOracleAddress, struct ICasimirCoreDev.Strategy strategy) public returns (address managerAddress)
```

Deploy a new manager beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerBeaconAddress | address | Manager beacon address |
| daoOracleAddress | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCoreDev.Strategy | Staking strategy configuration |

### createPool

```solidity
function createPool(address poolBeaconAddress, address registryAddress, uint64[] operatorIds, uint32 poolId, bytes publicKey, bytes shares) public returns (address poolAddress)
```

Deploy a new pool beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolBeaconAddress | address | Pool beacon address |
| registryAddress | address | Registry contract address |
| operatorIds | uint64[] | Operator IDs |
| poolId | uint32 | Pool ID |
| publicKey | bytes | Validator public key |
| shares | bytes | Operator key shares |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolAddress | address | Pool contract address |

### createRegistry

```solidity
function createRegistry(address registryBeaconAddress, uint256 minCollateral, bool privateOperators, bool verifiedOperators) public returns (address registryAddress)
```

Deploy a new registry beacon proxy

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryBeaconAddress | address | Registry beacon address |
| minCollateral | uint256 | Minimum collateral per operator per pool |
| privateOperators | bool | Whether private operators are enabled |
| verifiedOperators | bool | Whether verified operators are enabled |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryAddress | address | Registry address |

### createUpkeep

```solidity
function createUpkeep(address upkeepBeaconAddress, address factoryAddress, address functionsOracleAddress, bool compoundStake) public returns (address upkeepAddress)
```

Deploy a new upkeep beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepBeaconAddress | address | Upkeep beacon address |
| factoryAddress | address | Factory contract address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| compoundStake | bool | Whether to compound stake |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepAddress | address | Upkeep contract address |

### createViews

```solidity
function createViews(address viewsBeaconAddress, address managerAddress) public returns (address viewsAddress)
```

Deploy a new views beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| viewsBeaconAddress | address | Views beacon address |
| managerAddress | address | Manager contract address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| viewsAddress | address | Views contract address |

## FunctionsClient

Contract writers can inherit this contract in order to create Chainlink Functions requests

### s_oracle

```solidity
contract FunctionsOracleInterface s_oracle
```

### s_pendingRequests

```solidity
mapping(bytes32 => address) s_pendingRequests
```

### RequestSent

```solidity
event RequestSent(bytes32 id)
```

### RequestFulfilled

```solidity
event RequestFulfilled(bytes32 id)
```

### SenderIsNotRegistry

```solidity
error SenderIsNotRegistry()
```

### RequestIsAlreadyPending

```solidity
error RequestIsAlreadyPending()
```

### RequestIsNotPending

```solidity
error RequestIsNotPending()
```

### constructor

```solidity
constructor(address oracle) internal
```

### getDONPublicKey

```solidity
function getDONPublicKey() external view returns (bytes)
```

Returns the DON's secp256k1 public key used to encrypt secrets

_All Oracles nodes have the corresponding private key
needed to decrypt the secrets encrypted with the public key_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | publicKey DON's public key |

### estimateCost

```solidity
function estimateCost(struct Functions.Request req, uint64 subscriptionId, uint32 gasLimit, uint256 gasPrice) public view returns (uint96)
```

Estimate the total cost that will be charged to a subscription to make a request: gas re-imbursement, plus DON fee, plus Registry fee

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | struct Functions.Request | The initialized Functions.Request |
| subscriptionId | uint64 | The subscription ID |
| gasLimit | uint32 | gas limit for the fulfillment callback |
| gasPrice | uint256 |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint96 | billedCost Cost in Juels (1e18) of LINK |

### sendRequest

```solidity
function sendRequest(struct Functions.Request req, uint64 subscriptionId, uint32 gasLimit) internal returns (bytes32)
```

Sends a Chainlink Functions request to the stored oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | struct Functions.Request | The initialized Functions.Request |
| subscriptionId | uint64 | The subscription ID |
| gasLimit | uint32 | gas limit for the fulfillment callback |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | requestId The generated request ID |

### fulfillRequest

```solidity
function fulfillRequest(bytes32 requestId, bytes response, bytes err) internal virtual
```

User defined function to handle a response

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the user code |
| err | bytes | Aggregated error from the user code or from the execution pipeline Either response or error parameter will be set, but never both |

### handleOracleFulfillment

```solidity
function handleOracleFulfillment(bytes32 requestId, bytes response, bytes err) external
```

Chainlink Functions response handler called by the designated transmitter node in an OCR round.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The requestId returned by FunctionsClient.sendRequest(). |
| response | bytes | Aggregated response from the user code. |
| err | bytes | Aggregated error either from the user code or from the execution pipeline. Either response or error parameter will be set, but never both. |

### setOracle

```solidity
function setOracle(address oracle) internal
```

Sets the stored Oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracle | address | The address of Functions Oracle contract |

### getChainlinkOracleAddress

```solidity
function getChainlinkOracleAddress() internal view returns (address)
```

Gets the stored address of the oracle contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the oracle contract |

### addExternalRequest

```solidity
function addExternalRequest(address oracleAddress, bytes32 requestId) internal
```

Allows for a request which was created on another contract to be fulfilled
on this contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleAddress | address | The address of the oracle contract that will fulfill the request |
| requestId | bytes32 | The request ID used for the response |

### recordChainlinkFulfillment

```solidity
modifier recordChainlinkFulfillment(bytes32 requestId)
```

_Reverts if the sender is not the oracle that serviced the request.
Emits RequestFulfilled event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID for fulfillment |

### notPendingRequest

```solidity
modifier notPendingRequest(bytes32 requestId)
```

_Reverts if the request is already pending_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID for fulfillment |

## UpkeepInfo

```solidity
struct UpkeepInfo {
  address target;
  uint32 executeGas;
  bytes checkData;
  uint96 balance;
  address admin;
  uint64 maxValidBlocknumber;
  uint32 lastPerformBlockNumber;
  uint96 amountSpent;
  bool paused;
  bytes offchainConfig;
}
```

## IAutomationRegistry

### getUpkeep

```solidity
function getUpkeep(uint256 id) external view returns (struct UpkeepInfo)
```

### addFunds

```solidity
function addFunds(uint256 id, uint96 amount) external
```

### cancelUpkeep

```solidity
function cancelUpkeep(uint256 id) external
```

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

## IFunctionsBillingRegistry

### getSubscription

```solidity
function getSubscription(uint64 subscriptionId) external view returns (uint96 balance, address owner, address[] consumers)
```

### createSubscription

```solidity
function createSubscription() external returns (uint64)
```

### addConsumer

```solidity
function addConsumer(uint64 subscriptionId, address consumer) external
```

### cancelSubscription

```solidity
function cancelSubscription(uint64 subscriptionId, address receiver) external
```

## IKeeperRegistrar

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
function registerUpkeep(struct IKeeperRegistrar.RegistrationParams requestParams) external returns (uint256)
```

## IWETH9

### deposit

```solidity
function deposit() external payable
```

Deposit ether to get wrapped ether

### withdraw

```solidity
function withdraw(uint256 amount) external
```

Withdraw wrapped ether to get ether

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount of wrapped ether to withdraw |

## ICasimirCore

### ManagerConfig

```solidity
struct ManagerConfig {
  address managerAddress;
  address registryAddress;
  address upkeepAddress;
  address viewsAddress;
  struct ICasimirCore.Strategy strategy;
}
```

### Operator

```solidity
struct Operator {
  uint64 id;
  bool active;
  uint256 collateral;
  uint256 poolCount;
  bool resharing;
}
```

### PoolConfig

```solidity
struct PoolConfig {
  address poolAddress;
  uint256 balance;
  uint64[] operatorIds;
  bytes publicKey;
  uint256 reshares;
  enum ICasimirCore.PoolStatus status;
}
```

### PoolRegistration

```solidity
struct PoolRegistration {
  uint64[] operatorIds;
  bytes publicKey;
  bytes shares;
  enum ICasimirCore.PoolStatus status;
}
```

### PoolStatus

```solidity
enum PoolStatus {
  READY,
  PENDING,
  ACTIVE,
  EXITING_FORCED,
  EXITING_REQUESTED,
  WITHDRAWN
}
```

### Strategy

```solidity
struct Strategy {
  uint256 minCollateral;
  uint256 lockPeriod;
  uint32 userFee;
  bool compoundStake;
  bool eigenStake;
  bool liquidStake;
  bool privateOperators;
  bool verifiedOperators;
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
  address userAddress;
  uint256 amount;
  uint256 period;
}
```

### InvalidAddress

```solidity
error InvalidAddress()
```

### InvalidAmount

```solidity
error InvalidAmount()
```

### PoolAlreadyInitiated

```solidity
error PoolAlreadyInitiated()
```

### PoolAlreadyWithdrawn

```solidity
error PoolAlreadyWithdrawn()
```

### PoolMaxReshared

```solidity
error PoolMaxReshared()
```

### PoolNotActive

```solidity
error PoolNotActive()
```

### PoolNotPending

```solidity
error PoolNotPending()
```

### PoolNotExiting

```solidity
error PoolNotExiting()
```

### TransferFailed

```solidity
error TransferFailed()
```

### Unauthorized

```solidity
error Unauthorized()
```

## ICasimirFactory

### FunctionsRequestSet

```solidity
event FunctionsRequestSet(uint32 managerId, string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit)
```

### FunctionsOracleSet

```solidity
event FunctionsOracleSet(uint32 managerId, address newFunctionsOracleAddress)
```

### ManagerDeployed

```solidity
event ManagerDeployed(uint32 managerId)
```

### ReservedFeesWithdrawn

```solidity
event ReservedFeesWithdrawn(uint32 managerId, uint256 amount)
```

### deployManager

```solidity
function deployManager(address daoOracleAddress, address functionsOracleAddress, struct ICasimirCore.Strategy strategy) external
```

Deploy a new manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| daoOracleAddress | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCore.Strategy | Staking strategy configuration |

### managerBeaconAddress

```solidity
function managerBeaconAddress() external view returns (address)
```

Manager beacon address

### poolBeaconAddress

```solidity
function poolBeaconAddress() external view returns (address)
```

Pool beacon address

### registryBeaconAddress

```solidity
function registryBeaconAddress() external view returns (address)
```

Registry beacon address

### upkeepBeaconAddress

```solidity
function upkeepBeaconAddress() external view returns (address)
```

Upkeep beacon address

### viewsBeaconAddress

```solidity
function viewsBeaconAddress() external view returns (address)
```

Views beacon address

### getManagerConfig

```solidity
function getManagerConfig(uint32 managerId) external view returns (struct ICasimirCore.ManagerConfig)
```

Get manager config

### getManagerIds

```solidity
function getManagerIds() external view returns (uint32[])
```

Get the manager IDs

### getOwner

```solidity
function getOwner() external view returns (address)
```

Get the owner address

## ICasimirManager

### ClusterBalanceDeposited

```solidity
event ClusterBalanceDeposited(uint256 amount)
```

### PoolActivated

```solidity
event PoolActivated(uint32 poolId)
```

### PoolInitiated

```solidity
event PoolInitiated(uint32 poolId)
```

### InitiationRequested

```solidity
event InitiationRequested(uint32 poolId)
```

### PoolReshared

```solidity
event PoolReshared(uint32 poolId)
```

### ExitRequested

```solidity
event ExitRequested(uint32 poolId)
```

### ForcedExitsReported

```solidity
event ForcedExitsReported(uint32[] poolIds)
```

### LINKBalanceWithdrawn

```solidity
event LINKBalanceWithdrawn(uint256 amount)
```

### ExitedBalanceDeposited

```solidity
event ExitedBalanceDeposited(uint32 poolId, uint256 amount)
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

### RecoveredBalanceDeposited

```solidity
event RecoveredBalanceDeposited(uint32 poolId, uint256 amount)
```

### ReservedFeesDeposited

```solidity
event ReservedFeesDeposited(uint256 amount)
```

### ReservedFeesWithdrawn

```solidity
event ReservedFeesWithdrawn(uint256 amount)
```

### RewardsDeposited

```solidity
event RewardsDeposited(uint256 amount)
```

### SSVBalanceWithdrawn

```solidity
event SSVBalanceWithdrawn(uint256 amount)
```

### TipsDeposited

```solidity
event TipsDeposited(uint256 amount)
```

### FunctionsBalanceDeposited

```solidity
event FunctionsBalanceDeposited(uint256 amount)
```

### UpkeepBalanceDeposited

```solidity
event UpkeepBalanceDeposited(uint256 amount)
```

### FunctionsCancelled

```solidity
event FunctionsCancelled()
```

### UpkeepCancelled

```solidity
event UpkeepCancelled()
```

### WithdrawalFulfilled

```solidity
event WithdrawalFulfilled(address sender, uint256 amount)
```

### WithdrawalRequested

```solidity
event WithdrawalRequested(address sender, uint256 amount)
```

### WithdrawalInitiated

```solidity
event WithdrawalInitiated(address sender, uint256 amount)
```

### ForcedExitAlreadyReported

```solidity
error ForcedExitAlreadyReported()
```

### InsufficientLiquidity

```solidity
error InsufficientLiquidity()
```

### NoReadyPools

```solidity
error NoReadyPools()
```

### depositStake

```solidity
function depositStake() external payable
```

Deposit user stake

### depositRewards

```solidity
function depositRewards(uint32 poolId) external payable
```

Deposit pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositExitedBalance

```solidity
function depositExitedBalance(uint32 poolId) external payable
```

Deposit pool exited balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositRecoveredBalance

```solidity
function depositRecoveredBalance(uint32 poolId) external payable
```

Deposit pool operator recovered balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### depositReservedFees

```solidity
function depositReservedFees() external payable
```

Deposit reserved fees

### depositClusterBalance

```solidity
function depositClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to a cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositFunctionsBalance

```solidity
function depositFunctionsBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the functions balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### depositUpkeepBalance

```solidity
function depositUpkeepBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Deposit to the upkeep balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum LINK token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### rebalanceStake

```solidity
function rebalanceStake(uint256 beaconBalance, uint256 sweptBalance, uint256 activatedDeposits, uint256 completedExits) external
```

Rebalance the rewards to stake ratio and redistribute swept rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconBalance | uint256 | Beacon chain balance |
| sweptBalance | uint256 | Swept balance |
| activatedDeposits | uint256 | Activated deposit count |
| completedExits | uint256 | Withdrawn exit count |

### compoundRewards

```solidity
function compoundRewards(uint32[5] poolIds) external
```

Compound pool rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[5] | Pool IDs |

### requestWithdrawal

```solidity
function requestWithdrawal(uint256 amount) external
```

Request to withdraw user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Withdrawal amount |

### fulfillWithdrawals

```solidity
function fulfillWithdrawals(uint256 count) external
```

Fulfill pending withdrawals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | Withdrawal count |

### initiatePool

```solidity
function initiatePool(bytes32 depositDataRoot, bytes publicKey, bytes signature, bytes withdrawalCredentials, uint64[] operatorIds, bytes shares) external
```

Initiate the next ready pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| publicKey | bytes | Validator public key |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |
| operatorIds | uint64[] | Operator IDs |
| shares | bytes | Operator shares |

### withdrawReservedFees

```solidity
function withdrawReservedFees(uint256 amount) external
```

Withdraw reserved fees

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### activatePool

```solidity
function activatePool(uint256 pendingPoolIndex, struct ISSVNetworkCore.Cluster cluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Activate a pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pendingPoolIndex | uint256 | Pending pool index |
| cluster | struct ISSVNetworkCore.Cluster | SSV cluster |
| feeAmount | uint256 | Fee amount |
| minTokenAmount | uint256 | Minimum token amount |
| processed | bool | Whether the fee has been processed |

### resharePool

```solidity
function resharePool(uint32 poolId, uint64[] operatorIds, uint64 newOperatorId, uint64 oldOperatorId, bytes shares, struct ISSVNetworkCore.Cluster cluster, struct ISSVNetworkCore.Cluster oldCluster, uint256 feeAmount, uint256 minTokenAmount, bool processed) external
```

Report a reshare

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |
| operatorIds | uint64[] | Operator IDs |
| newOperatorId | uint64 | New operator ID |
| oldOperatorId | uint64 | Old operator ID |
| shares | bytes | Operator shares |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| oldCluster | struct ISSVNetworkCore.Cluster | Old cluster snapshot |
| feeAmount | uint256 | Fee amount to deposit |
| minTokenAmount | uint256 | Minimum SSV token amount out after processing fees |
| processed | bool | Whether the fee amount is already processed |

### reportForcedExits

```solidity
function reportForcedExits(uint32[] poolIds) external
```

Report forced exits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIds | uint32[] | Pool IDs |

### reportCompletedExit

```solidity
function reportCompletedExit(uint256 stakedPoolIndex, uint32[] blamePercents, struct ISSVNetworkCore.Cluster cluster) external
```

Report a completed exit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakedPoolIndex | uint256 | Staked pool index |
| blamePercents | uint32[] | Operator blame percents (0 if balance is 32 ether) |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |

### withdrawClusterBalance

```solidity
function withdrawClusterBalance(uint64[] operatorIds, struct ISSVNetworkCore.Cluster cluster, uint256 amount) external
```

Withdraw cluster balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorIds | uint64[] | Operator IDs |
| cluster | struct ISSVNetworkCore.Cluster | Cluster snapshot |
| amount | uint256 | Amount to withdraw |

### withdrawLINKBalance

```solidity
function withdrawLINKBalance(uint256 amount) external
```

Withdraw LINK balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### withdrawSSVBalance

```solidity
function withdrawSSVBalance(uint256 amount) external
```

Withdraw SSV balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to withdraw |

### cancelFunctions

```solidity
function cancelFunctions() external
```

Cancel the Chainlink functions subscription

### cancelUpkeep

```solidity
function cancelUpkeep() external
```

Cancel the Chainlink upkeep subscription

### lockPeriod

```solidity
function lockPeriod() external view returns (uint256)
```

User stake lock period

### userFee

```solidity
function userFee() external view returns (uint32)
```

User stake fee percentage

### eigenStake

```solidity
function eigenStake() external view returns (bool)
```

Whether eigen stake is enabled

### liquidStake

```solidity
function liquidStake() external view returns (bool)
```

Whether liquid stake is enabled

### functionsId

```solidity
function functionsId() external view returns (uint64)
```

Chainlink functions subscription ID

### upkeepId

```solidity
function upkeepId() external view returns (uint256)
```

Chainlink upkeep subscription ID

### latestBeaconBalance

```solidity
function latestBeaconBalance() external view returns (uint256)
```

Latest beacon chain balance

### reservedFeeBalance

```solidity
function reservedFeeBalance() external view returns (uint256)
```

Reserved fee balance

### requestedWithdrawalBalance

```solidity
function requestedWithdrawalBalance() external view returns (uint256)
```

Requested withdrawal balance

### requestedExits

```solidity
function requestedExits() external view returns (uint256)
```

Requested exit count

### finalizableActivations

```solidity
function finalizableActivations() external view returns (uint256)
```

Fully reported activations in the current period

### finalizableCompletedExits

```solidity
function finalizableCompletedExits() external view returns (uint256)
```

Fully reported completed exits in the current period

### reportPeriod

```solidity
function reportPeriod() external view returns (uint32)
```

Current report period

### getTotalStake

```solidity
function getTotalStake() external view returns (uint256)
```

Get the total stake (buffered + beacon - requested withdrawals)

### getPendingPoolIds

```solidity
function getPendingPoolIds() external view returns (uint32[])
```

Get the pending pool IDs

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get the staked pool IDs

### getBufferedBalance

```solidity
function getBufferedBalance() external view returns (uint256)
```

Get the buffered balance (prepool + exited + ready)

### getPendingWithdrawalEligibility

```solidity
function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool)
```

Get the eligibility of a pending withdrawal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | Index of the pending withdrawal |
| period | uint256 | Period to check |

### getWithdrawableBalance

```solidity
function getWithdrawableBalance() external view returns (uint256)
```

Get the withdrawable balance (prepool + exited)

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

Get user stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | User address |

### getPoolAddress

```solidity
function getPoolAddress(uint32 poolId) external view returns (address)
```

Get a pool address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getRegistryAddress

```solidity
function getRegistryAddress() external view returns (address)
```

Get the registry address

### getUpkeepAddress

```solidity
function getUpkeepAddress() external view returns (address)
```

Get the upkeep address

## ICasimirPool

### OperatorIdsSet

```solidity
event OperatorIdsSet(uint64[] operatorIds)
```

### ResharesSet

```solidity
event ResharesSet(uint256 reshares)
```

### StatusSet

```solidity
event StatusSet(enum ICasimirCore.PoolStatus status)
```

### InvalidDepositAmount

```solidity
error InvalidDepositAmount()
```

### InvalidWithdrawalCredentials

```solidity
error InvalidWithdrawalCredentials()
```

### depositStake

```solidity
function depositStake(bytes32 depositDataRoot, bytes signature, bytes withdrawalCredentials) external payable
```

Deposit pool stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| depositDataRoot | bytes32 | Deposit data root |
| signature | bytes | Deposit signature |
| withdrawalCredentials | bytes | Validator withdrawal credentials |

### depositRewards

```solidity
function depositRewards() external
```

Deposit pool rewards

### setOperatorIds

```solidity
function setOperatorIds(uint64[] newOperatorIds) external
```

Set the operator IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOperatorIds | uint64[] | New operator IDs |

### setReshares

```solidity
function setReshares(uint256 newReshares) external
```

Set the reshare count

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newReshares | uint256 | New reshare count |

### setStatus

```solidity
function setStatus(enum ICasimirCore.PoolStatus newStatus) external
```

Set the pool status

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newStatus | enum ICasimirCore.PoolStatus | New status |

### withdrawBalance

```solidity
function withdrawBalance(uint32[] blamePercents) external
```

Withdraw pool balance to the manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blamePercents | uint32[] | Operator loss blame percents |

### publicKey

```solidity
function publicKey() external view returns (bytes)
```

Validator public key

### reshares

```solidity
function reshares() external view returns (uint256)
```

Reshare count

### status

```solidity
function status() external view returns (enum ICasimirCore.PoolStatus)
```

Pool status

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get the pool operator IDs

### getRegistration

```solidity
function getRegistration() external view returns (struct ICasimirCore.PoolRegistration)
```

Get the pool registration

## ICasimirRegistry

### CollateralDeposited

```solidity
event CollateralDeposited(uint64 operatorId, uint256 amount)
```

### DeactivationCompleted

```solidity
event DeactivationCompleted(uint64 operatorId)
```

### DeactivationRequested

```solidity
event DeactivationRequested(uint64 operatorId)
```

### DeregistrationCompleted

```solidity
event DeregistrationCompleted(uint64 operatorId)
```

### OperatorPoolAdded

```solidity
event OperatorPoolAdded(uint64 operatorId, uint32 poolId)
```

### OperatorPoolRemoved

```solidity
event OperatorPoolRemoved(uint64 operatorId, uint32 poolId, uint256 blameAmount)
```

### OperatorRegistered

```solidity
event OperatorRegistered(uint64 operatorId)
```

### WithdrawalFulfilled

```solidity
event WithdrawalFulfilled(uint64 operatorId, uint256 amount)
```

### CollateralInUse

```solidity
error CollateralInUse()
```

### InsufficientCollateral

```solidity
error InsufficientCollateral()
```

### OperatorAlreadyRegistered

```solidity
error OperatorAlreadyRegistered()
```

### OperatorNotActive

```solidity
error OperatorNotActive()
```

### OperatorResharing

```solidity
error OperatorResharing()
```

### PoolAlreadyExists

```solidity
error PoolAlreadyExists()
```

### PoolDoesNotExist

```solidity
error PoolDoesNotExist()
```

### registerOperator

```solidity
function registerOperator(uint64 operatorId) external payable
```

Register an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### depositCollateral

```solidity
function depositCollateral(uint64 operatorId) external payable
```

Deposit operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### requestWithdrawal

```solidity
function requestWithdrawal(uint64 operatorId, uint256 amount) external
```

Request to withdraw operator collateral

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| amount | uint256 | Amount to withdraw |

### requestDeactivation

```solidity
function requestDeactivation(uint64 operatorId) external
```

Request operator deactivation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### addOperatorPool

```solidity
function addOperatorPool(uint64 operatorId, uint32 poolId) external
```

Add a pool to an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |

### removeOperatorPool

```solidity
function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external
```

Remove a pool from an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |
| poolId | uint32 | Pool ID |
| blameAmount | uint256 | Amount to recover from collateral |

### getOperator

```solidity
function getOperator(uint64 operatorId) external view returns (struct ICasimirCore.Operator)
```

Get an operator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operatorId | uint64 | Operator ID |

### getOperatorIds

```solidity
function getOperatorIds() external view returns (uint64[])
```

Get all previously registered operator IDs

### minCollateral

```solidity
function minCollateral() external view returns (uint256)
```

Minimum collateral per operator per pool

### privateOperators

```solidity
function privateOperators() external view returns (bool)
```

Whether private operators are enabled

### verifiedOperators

```solidity
function verifiedOperators() external view returns (bool)
```

Whether verified operators are enabled

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

### ActivationsRequested

```solidity
event ActivationsRequested(uint256 count)
```

### ForcedExitReportsRequested

```solidity
event ForcedExitReportsRequested(uint256 count)
```

### CompletedExitReportsRequested

```solidity
event CompletedExitReportsRequested(uint256 count)
```

### OCRResponse

```solidity
event OCRResponse(bytes32 requestId, bytes result, bytes err)
```

### FunctionsRequestSet

```solidity
event FunctionsRequestSet(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit)
```

### FunctionsOracleAddressSet

```solidity
event FunctionsOracleAddressSet(address newFunctionsOracleAddress)
```

### UpkeepPerformed

```solidity
event UpkeepPerformed(enum ICasimirUpkeep.ReportStatus status)
```

### InvalidRequest

```solidity
error InvalidRequest()
```

### UpkeepNotNeeded

```solidity
error UpkeepNotNeeded()
```

### performUpkeep

```solidity
function performUpkeep(bytes) external
```

Perform the upkeep

### setFunctionsRequest

```solidity
function setFunctionsRequest(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit) external
```

Set a new Chainlink functions request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newRequestSource | string | New Chainlink functions source code |
| newRequestArgs | string[] | New Chainlink functions arguments |
| newFulfillGasLimit | uint32 | New Chainlink functions fulfill gas limit |

### setFunctionsOracle

```solidity
function setFunctionsOracle(address newFunctionsOracleAddress) external
```

Set a new Chainlink functions oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newFunctionsOracleAddress | address | New Chainlink functions oracle address |

### checkUpkeep

```solidity
function checkUpkeep(bytes checkData) external view returns (bool upkeepNeeded, bytes)
```

Check if the upkeep is needed

### compoundStake

```solidity
function compoundStake() external view returns (bool)
```

Whether compound stake is enabled

## ICasimirViews

### getCompoundablePoolIds

```solidity
function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5])
```

Get the next five compoundable pool IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolCount

```solidity
function getDepositedPoolCount() external view returns (uint256)
```

Get the deposited pool count

### getDepositedPoolPublicKeys

```solidity
function getDepositedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[])
```

Get the deposited pool public keys

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getDepositedPoolStatuses

```solidity
function getDepositedPoolStatuses(uint256 startIndex, uint256 endIndex) external view returns (enum ICasimirCore.PoolStatus[])
```

Get the deposited pool statuses

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getOperators

```solidity
function getOperators(uint256 startIndex, uint256 endIndex) external view returns (struct ICasimirCore.Operator[])
```

Get operators

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

### getPoolConfig

```solidity
function getPoolConfig(uint32 poolId) external view returns (struct ICasimirCore.PoolConfig)
```

Get pool config

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | Pool ID |

### getSweptBalance

```solidity
function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128)
```

Get the swept balance (in gwei)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | Start index |
| endIndex | uint256 | End index |

## CasimirArray

### IndexOutOfBounds

```solidity
error IndexOutOfBounds()
```

### EmptyArray

```solidity
error EmptyArray()
```

### removeUint32Item

```solidity
function removeUint32Item(uint32[] uint32Array, uint256 index) internal
```

### removeBytesItem

```solidity
function removeBytesItem(bytes[] bytesArray, uint256 index) internal
```

### removeWithdrawalItem

```solidity
function removeWithdrawalItem(struct ICasimirCore.Withdrawal[] withdrawals, uint256 index) internal
```

## CasimirBeacon

### createManager

```solidity
function createManager(address managerBeaconAddress, address daoOracleAddress, address functionsOracleAddress, struct ICasimirCore.Strategy strategy) public returns (address managerAddress)
```

Deploy a new manager beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerBeaconAddress | address | Manager beacon address |
| daoOracleAddress | address | DAO oracle address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| strategy | struct ICasimirCore.Strategy | Staking strategy configuration |

### createPool

```solidity
function createPool(address poolBeaconAddress, address registryAddress, uint64[] operatorIds, uint32 poolId, bytes publicKey, bytes shares) public returns (address poolAddress)
```

Deploy a new pool beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolBeaconAddress | address | Pool beacon address |
| registryAddress | address | Registry contract address |
| operatorIds | uint64[] | Operator IDs |
| poolId | uint32 | Pool ID |
| publicKey | bytes | Validator public key |
| shares | bytes | Operator key shares |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolAddress | address | Pool contract address |

### createRegistry

```solidity
function createRegistry(address registryBeaconAddress, uint256 minCollateral, bool privateOperators, bool verifiedOperators) public returns (address registryAddress)
```

Deploy a new registry beacon proxy

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryBeaconAddress | address | Registry beacon address |
| minCollateral | uint256 | Minimum collateral per operator per pool |
| privateOperators | bool | Whether private operators are enabled |
| verifiedOperators | bool | Whether verified operators are enabled |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryAddress | address | Registry address |

### createUpkeep

```solidity
function createUpkeep(address upkeepBeaconAddress, address factoryAddress, address functionsOracleAddress, bool compoundStake) public returns (address upkeepAddress)
```

Deploy a new upkeep beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepBeaconAddress | address | Upkeep beacon address |
| factoryAddress | address | Factory contract address |
| functionsOracleAddress | address | Chainlink functions oracle address |
| compoundStake | bool | Whether to compound stake |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepAddress | address | Upkeep contract address |

### createViews

```solidity
function createViews(address viewsBeaconAddress, address managerAddress) public returns (address viewsAddress)
```

Deploy a new views beacon proxy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| viewsBeaconAddress | address | Views beacon address |
| managerAddress | address | Manager contract address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| viewsAddress | address | Views contract address |

## FunctionsClient

Contract writers can inherit this contract in order to create Chainlink Functions requests

### s_oracle

```solidity
contract FunctionsOracleInterface s_oracle
```

### s_pendingRequests

```solidity
mapping(bytes32 => address) s_pendingRequests
```

### RequestSent

```solidity
event RequestSent(bytes32 id)
```

### RequestFulfilled

```solidity
event RequestFulfilled(bytes32 id)
```

### SenderIsNotRegistry

```solidity
error SenderIsNotRegistry()
```

### RequestIsAlreadyPending

```solidity
error RequestIsAlreadyPending()
```

### RequestIsNotPending

```solidity
error RequestIsNotPending()
```

### constructor

```solidity
constructor(address oracle) internal
```

### getDONPublicKey

```solidity
function getDONPublicKey() external view returns (bytes)
```

Returns the DON's secp256k1 public key used to encrypt secrets

_All Oracles nodes have the corresponding private key
needed to decrypt the secrets encrypted with the public key_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | publicKey DON's public key |

### estimateCost

```solidity
function estimateCost(struct Functions.Request req, uint64 subscriptionId, uint32 gasLimit, uint256 gasPrice) public view returns (uint96)
```

Estimate the total cost that will be charged to a subscription to make a request: gas re-imbursement, plus DON fee, plus Registry fee

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | struct Functions.Request | The initialized Functions.Request |
| subscriptionId | uint64 | The subscription ID |
| gasLimit | uint32 | gas limit for the fulfillment callback |
| gasPrice | uint256 |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint96 | billedCost Cost in Juels (1e18) of LINK |

### sendRequest

```solidity
function sendRequest(struct Functions.Request req, uint64 subscriptionId, uint32 gasLimit) internal returns (bytes32)
```

Sends a Chainlink Functions request to the stored oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | struct Functions.Request | The initialized Functions.Request |
| subscriptionId | uint64 | The subscription ID |
| gasLimit | uint32 | gas limit for the fulfillment callback |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | requestId The generated request ID |

### fulfillRequest

```solidity
function fulfillRequest(bytes32 requestId, bytes response, bytes err) internal virtual
```

User defined function to handle a response

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID, returned by sendRequest() |
| response | bytes | Aggregated response from the user code |
| err | bytes | Aggregated error from the user code or from the execution pipeline Either response or error parameter will be set, but never both |

### handleOracleFulfillment

```solidity
function handleOracleFulfillment(bytes32 requestId, bytes response, bytes err) external
```

Chainlink Functions response handler called by the designated transmitter node in an OCR round.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The requestId returned by FunctionsClient.sendRequest(). |
| response | bytes | Aggregated response from the user code. |
| err | bytes | Aggregated error either from the user code or from the execution pipeline. Either response or error parameter will be set, but never both. |

### setOracle

```solidity
function setOracle(address oracle) internal
```

Sets the stored Oracle address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracle | address | The address of Functions Oracle contract |

### getChainlinkOracleAddress

```solidity
function getChainlinkOracleAddress() internal view returns (address)
```

Gets the stored address of the oracle contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the oracle contract |

### addExternalRequest

```solidity
function addExternalRequest(address oracleAddress, bytes32 requestId) internal
```

Allows for a request which was created on another contract to be fulfilled
on this contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleAddress | address | The address of the oracle contract that will fulfill the request |
| requestId | bytes32 | The request ID used for the response |

### recordChainlinkFulfillment

```solidity
modifier recordChainlinkFulfillment(bytes32 requestId)
```

_Reverts if the sender is not the oracle that serviced the request.
Emits RequestFulfilled event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID for fulfillment |

### notPendingRequest

```solidity
modifier notPendingRequest(bytes32 requestId)
```

_Reverts if the request is already pending_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | The request ID for fulfillment |

## UpkeepInfo

```solidity
struct UpkeepInfo {
  address target;
  uint32 executeGas;
  bytes checkData;
  uint96 balance;
  address admin;
  uint64 maxValidBlocknumber;
  uint32 lastPerformBlockNumber;
  uint96 amountSpent;
  bool paused;
  bytes offchainConfig;
}
```

## IAutomationRegistry

### getUpkeep

```solidity
function getUpkeep(uint256 id) external view returns (struct UpkeepInfo)
```

### addFunds

```solidity
function addFunds(uint256 id, uint96 amount) external
```

### cancelUpkeep

```solidity
function cancelUpkeep(uint256 id) external
```

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

## IFunctionsBillingRegistry

### getSubscription

```solidity
function getSubscription(uint64 subscriptionId) external view returns (uint96 balance, address owner, address[] consumers)
```

### createSubscription

```solidity
function createSubscription() external returns (uint64)
```

### addConsumer

```solidity
function addConsumer(uint64 subscriptionId, address consumer) external
```

### cancelSubscription

```solidity
function cancelSubscription(uint64 subscriptionId, address receiver) external
```

## IKeeperRegistrar

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
function registerUpkeep(struct IKeeperRegistrar.RegistrationParams requestParams) external returns (uint256)
```

## IWETH9

### deposit

```solidity
function deposit() external payable
```

Deposit ether to get wrapped ether

### withdraw

```solidity
function withdraw(uint256 amount) external
```

Withdraw wrapped ether to get ether

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount of wrapped ether to withdraw |

