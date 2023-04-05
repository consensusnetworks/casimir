# Solidity API

## Counter

### counter

```solidity
uint256 counter
```

Public counter variable

### interval

```solidity
uint256 interval
```

Use an interval in seconds and a timestamp to slow execution of Upkeep

### lastTimeStamp

```solidity
uint256 lastTimeStamp
```

### constructor

```solidity
constructor(uint256 updateInterval) public
```

### checkUpkeep

```solidity
function checkUpkeep(bytes) external view returns (bool upkeepNeeded, bytes checkData)
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

### validateUpkeep

```solidity
function validateUpkeep() public view returns (bool)
```

## SSVManager

### ProcessedDeposit

```solidity
struct ProcessedDeposit {
  uint256 ethAmount;
  uint256 linkAmount;
  uint256 ssvAmount;
}
```

### Fees

```solidity
struct Fees {
  uint32 LINK;
  uint32 SSV;
}
```

### Pool

```solidity
struct Pool {
  uint256 deposits;
  uint32[] operatorIds;
  bytes validatorPublicKey;
}
```

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
  uint256 distributionSum0;
}
```

### Validator

```solidity
struct Validator {
  bytes32 depositDataRoot;
  uint32[] operatorIds;
  bytes[] sharesEncrypted;
  bytes[] sharesPublicKeys;
  bytes signature;
  bytes withdrawalCredentials;
}
```

### lastPoolId

```solidity
struct Counters.Counter lastPoolId
```

Last pool ID generated for a new pool

### scaleFactor

```solidity
uint256 scaleFactor
```

Scale factor for each reward to stake ratio

### distributionSum

```solidity
uint256 distributionSum
```

Sum of scaled reward to stake ratios (arbitrary intial value required)

### ManagerDistribution

```solidity
event ManagerDistribution(address userAddress, uint256 ethAmount, uint256 depositTime)
```

Event signaling a user deposit to the pool manager

### PoolDeposit

```solidity
event PoolDeposit(address userAddress, uint32 poolId, uint256 ethAmount, uint256 depositTime)
```

Event signaling a user deposit to a pool

### PoolStaked

```solidity
event PoolStaked(uint32 poolId, bytes publicKey, uint32[] operatorIds)
```

Event signaling a pool validator activation

### ValidatorAdded

```solidity
event ValidatorAdded(bytes publicKey, uint32[] operatorIds)
```

Event signaling a validator registration

### constructor

```solidity
constructor(address beaconDepositAddress, address linkFeedAddress, address linkTokenAddress, address ssvNetworkAddress, address ssvTokenAddress, address swapFactoryAddress, address swapRouterAddress, address wethTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beaconDepositAddress | address | The Beacon deposit address |
| linkFeedAddress | address | The Chainlink data feed address |
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

_Production will use oracle reporting balance increases, but receive is used for mocking rewards_

### deposit

```solidity
function deposit() external payable
```

Deposit user stake to the pool manager

### withdraw

```solidity
function withdraw(uint256 amount) external
```

Withdraw user stake from the pool manager

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of ETH to withdraw |

### getFees

```solidity
function getFees() public pure returns (struct SSVManager.Fees)
```

Get the current token fees as percentages

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Fees | The current token fees as percentages |

### getLINKFee

```solidity
function getLINKFee() public pure returns (uint32)
```

Get the LINK fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | The LINK fee percentage to charge on each deposit |

### getSSVFee

```solidity
function getSSVFee() public pure returns (uint32)
```

Get the SSV fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | The SSV fee percentage to charge on each deposit |

### addValidator

```solidity
function addValidator(bytes32 depositDataRoot, bytes publicKey, uint32[] operatorIds, bytes[] sharesEncrypted, bytes[] sharesPublicKeys, bytes signature, bytes withdrawalCredentials) public
```

_Add a validator to the pool manager_

### getStakedValidatorPublicKeys

```solidity
function getStakedValidatorPublicKeys() external view returns (bytes[])
```

Get staked validator public keys

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes[] | A list of active validator public keys |

### getReadyValidatorPublicKeys

```solidity
function getReadyValidatorPublicKeys() external view returns (bytes[])
```

Get ready validator public keys

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes[] | A list of inactive validator public keys |

### getReadyPoolIds

```solidity
function getReadyPoolIds() external view returns (uint32[])
```

Get a list of all ready pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all ready pool IDs |

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get a list of all staked pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all staked pool IDs |

### getStake

```solidity
function getStake() public view returns (uint256)
```

Get the current stake of the pool manager

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current stake of the pool manager |

### getReadyDeposits

```solidity
function getReadyDeposits() public view returns (uint256)
```

Get the current ready deposits of the pool manager

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current ready deposits of the pool manager |

### getUserStake

```solidity
function getUserStake(address userAddress) public view returns (uint256)
```

Get the current stake of a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current stake of a user |

### getPool

```solidity
function getPool(uint32 poolId) external view returns (struct SSVManager.Pool)
```

Get a pool by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Pool | The pool |

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

## ISSVToken

### mint

```solidity
function mint(address to, uint256 amount) external
```

Mint tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The target address |
| amount | uint256 | The amount of token to mint |

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

