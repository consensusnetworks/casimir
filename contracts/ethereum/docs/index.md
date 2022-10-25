# Solidity API

## SSVManager

### UserAccount

```solidity
struct UserAccount {
  mapping(address => bool) poolAddressLookup;
  address[] poolAddresses;
}
```

### users

```solidity
mapping(address => struct SSVManager.UserAccount) users
```

All users who have deposited to pools

### depositFee

```solidity
uint256 depositFee
```

Current deposit fee

### openPools

```solidity
address[] openPools
```

Pools accepting deposits

### stakedPools

```solidity
address[] stakedPools
```

Pools completed and staked

### PoolDeposit

```solidity
event PoolDeposit(address userAddress, address poolAddress, uint256 depositAmount, uint256 depositTime)
```

Event signaling a user deposit to a pool

### constructor

```solidity
constructor() public
```

### deposit

```solidity
function deposit() external payable
```

Deposit to the pool manager

### deployPool

```solidity
function deployPool(bytes32 _salt) private returns (address)
```

_Deploys a new pool contract_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the newly deployed pool contract |

### getDepositFee

```solidity
function getDepositFee() external view returns (uint256)
```

Get the current deposit fee

### getOpenPools

```solidity
function getOpenPools() external view returns (address[])
```

Get all open pools

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of all open pools |

### getStakedPools

```solidity
function getStakedPools() external view returns (address[])
```

Get all the staked pools

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of all the staked pools |

### getPoolsForUser

```solidity
function getPoolsForUser(address userAddress) external view returns (address[])
```

Get the pools for a given user

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of pools for a given user |

### getUserBalanceForPool

```solidity
function getUserBalanceForPool(address userAddress, address poolAddress) external view returns (uint256)
```

Get the given user's balance for the given pool

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The given user's balance for the given pool |

### getBalanceForPool

```solidity
function getBalanceForPool(address poolAddress) external view returns (uint256)
```

Get the given pool's balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The given pool's balance |

## SSVPool

### userBalances

```solidity
mapping(address => uint256) userBalances
```

All user balances

### constructor

```solidity
constructor() public
```

### deposit

```solidity
function deposit(address userAddress) external payable
```

Deposit to the pool

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The user address of the depositor |

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

Get the total pool balance

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total pool balance |

### getUserBalance

```solidity
function getUserBalance(address userAddress) external view returns (uint256)
```

Get a given user's pool balance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The user address to look up |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The user's pool balance |

## SSVPoolInterface

### deposit

```solidity
function deposit(address userAddress) external payable
```

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

### getUserBalance

```solidity
function getUserBalance(address userAddress) external view returns (uint256)
```

