# Solidity API

## SSVManager

### Balance

```solidity
struct Balance {
  uint256 rewards;
  uint256 stake;
}
```

### DepositFunds

```solidity
struct DepositFunds {
  uint256 linkAmount;
  uint256 ssvAmount;
  uint256 stakeAmount;
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
  uint256 depositAmount;
  uint32[] operatorIds;
  mapping(address => uint256) userStakes;
  bytes validatorPublicKey;
}
```

### PoolUserDetails

```solidity
struct PoolUserDetails {
  struct SSVManager.Balance balance;
  struct SSVManager.Balance userBalance;
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
  mapping(uint32 => bool) poolIdLookup;
  uint32[] poolIds;
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

Pool ID generator

### ManagerDeposit

```solidity
event ManagerDeposit(address userAddress, uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount, uint256 depositTime)
```

Event signaling a user deposit to the manager

### PoolStake

```solidity
event PoolStake(address userAddress, uint32 poolId, uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount, uint256 stakeTime)
```

Event signaling a user stake to a pool

### ValidatorActivated

```solidity
event ValidatorActivated(uint32 poolId, uint32[] operatorIds, bytes publicKey)
```

Event signaling a validator activation

### ValidatorAdded

```solidity
event ValidatorAdded(uint32[] operatorIds, bytes publicKey)
```

Event signaling a validator registration

### constructor

```solidity
constructor(address beaconDepositAddress, address linkFeedAddress, address linkTokenAddress, address ssvNetworkAddress, address ssvTokenAddress, address swapRouterAddress, address wethTokenAddress) public
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
| swapRouterAddress | address | The Uniswap router address |
| wethTokenAddress | address | The WETH contract address |

### deposit

```solidity
function deposit() external payable
```

Deposit to the pool manager

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

### getActiveValidatorPublicKeys

```solidity
function getActiveValidatorPublicKeys() external view returns (bytes[])
```

Get active validator public keys

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes[] | A list of active validator public keys |

### getInactiveValidatorPublicKeys

```solidity
function getInactiveValidatorPublicKeys() external view returns (bytes[])
```

Get inactive validator public keys

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes[] | A list of inactive validator public keys |

### getOpenPoolIds

```solidity
function getOpenPoolIds() external view returns (uint32[])
```

Get a list of all open pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all open pool IDs |

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

Get a list of all staked pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of all staked pool IDs |

### getUserPoolIds

```solidity
function getUserPoolIds(address userAddress) external view returns (uint32[])
```

Get a list of a user's pool IDs by user address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of a user's pool IDs |

### getPoolUserDetails

```solidity
function getPoolUserDetails(uint32 poolId, address userAddress) external view returns (struct SSVManager.PoolUserDetails)
```

### getPoolUserBalance

```solidity
function getPoolUserBalance(uint32 poolId, address userAddress) public view returns (struct SSVManager.Balance)
```

Get a user's balance in a pool by user address and pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| userAddress | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Balance | A user's balance in a pool |

### getPoolUserRewards

```solidity
function getPoolUserRewards(uint32 poolId, address userAddress) public view returns (uint256)
```

Get a user's rewards in a pool by user address and pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| userAddress | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | A user's rewards in a pool |

### getPoolUserStake

```solidity
function getPoolUserStake(uint32 poolId, address userAddress) public view returns (uint256)
```

Get a user's stake in a pool by user address and pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |
| userAddress | address | The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | A user's stake in a pool |

### getPoolBalance

```solidity
function getPoolBalance(uint32 poolId) public view returns (struct SSVManager.Balance)
```

Get a pool's balance by pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Balance | The pool's balance |

### getPoolValidatorPublicKey

```solidity
function getPoolValidatorPublicKey(uint32 poolId) external view returns (bytes)
```

Get a pool's validator public key by pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | The pool's validator public key |

### getPoolOperatorIds

```solidity
function getPoolOperatorIds(uint32 poolId) external view returns (uint32[])
```

Get a pool's operators by pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | The pool's operators |

### getLatestBalance

```solidity
function getLatestBalance(uint32 poolId, bytes validatorPublicKey) public view returns (int256)
```

Get the latest balance for a validator (PoR)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 |  |
| validatorPublicKey | bytes | The validator address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 | The latest balance |

### getPoRAddressListLength

```solidity
function getPoRAddressListLength() external view returns (uint256)
```

Get the length of the PoR (active) address list

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The length of the PoR address list |

### getPoRAddressList

```solidity
function getPoRAddressList(uint256 startIndex, uint256 endIndex) external view returns (string[])
```

Get a slice of the PoR address list as strings

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The list start index |
| endIndex | uint256 | The list end index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | The slice of the PoR address list as strings |

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

## IPoRAddressList

This interface enables Chainlink nodes to get the list addresses to be used in a PoR feed. A single
contract that implements this interface can only store an address list for a single PoR feed.

_All functions in this interface are expected to be called off-chain, so gas usage is not a big concern.
This makes it possible to store addresses in optimized data types and convert them to human-readable strings
in `getPoRAddressList()`._

### getPoRAddressListLength

```solidity
function getPoRAddressListLength() external view returns (uint256)
```

Get total number of addresses in the list.

### getPoRAddressList

```solidity
function getPoRAddressList(uint256 startIndex, uint256 endIndex) external view returns (string[])
```

Get a batch of human-readable addresses from the address list.

_Due to limitations of gas usage in off-chain calls, we need to support fetching the addresses in batches.
EVM addresses need to be converted to human-readable strings. The address strings need to be in the same format
that would be used when querying the balance of that address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The index of the first address in the batch. |
| endIndex | uint256 | The index of the last address in the batch. If `endIndex > getPoRAddressListLength()-1`, endIndex need to default to `getPoRAddressListLength()-1`. If `endIndex < startIndex`, the result would be an empty array. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | Array of addresses as strings. |

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

