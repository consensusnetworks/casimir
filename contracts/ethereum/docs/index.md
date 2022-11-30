# Solidity API

## SSVManager

### Token

```solidity
enum Token {
  LINK,
  SSV,
  WETH
}
```

### Fees

```solidity
struct Fees {
  uint256 LINK;
  uint256 SSV;
}
```

### UserAccount

```solidity
struct UserAccount {
  mapping(address => bool) poolAddressLookup;
  address[] poolAddresses;
}
```

### tokens

```solidity
mapping(enum SSVManager.Token => address) tokens
```

Token addresses

### users

```solidity
mapping(address => struct SSVManager.UserAccount) users
```

All users who have deposited to pools

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
constructor(address linkTokenAddress, address ssvTokenAddress, address wethTokenAddress) public
```

### deposit

```solidity
function deposit() external payable
```

Deposit to the pool manager

### processFees

```solidity
function processFees(uint256 depositAmount) private returns (uint256, uint256, uint256)
```

_Process fees from deposit_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The remaining deposit amount after fees |
| [1] | uint256 |  |
| [2] | uint256 |  |

### swap

```solidity
function swap(address tokenIn, address tokenOut, uint256 amountIn) private returns (uint256)
```

_Swap one token for another_

### deployPool

```solidity
function deployPool(bytes32 _salt) private returns (address)
```

_Deploy a new pool contract_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the newly deployed pool contract |

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
function getLINKFee() public pure returns (uint256)
```

Get the LINK fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The LINK fee percentage to charge on each deposit |

### getSSVFee

```solidity
function getSSVFee() public pure returns (uint256)
```

Get the SSV fee percentage to charge on each deposit

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The SSV fee percentage to charge on each deposit |

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

## ISSVPool

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

## WETH9

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### Approval

```solidity
event Approval(address src, address guy, uint256 wad)
```

### Transfer

```solidity
event Transfer(address src, address dst, uint256 wad)
```

### Deposit

```solidity
event Deposit(address dst, uint256 wad)
```

### Withdrawal

```solidity
event Withdrawal(address src, uint256 wad)
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### allowance

```solidity
mapping(address => mapping(address => uint256)) allowance
```

### 

```solidity
undefined() external payable
```

### 

```solidity
undefined() public payable
```

### 

```solidity
undefined(uint256 wad) public
```

### 

```solidity
undefined() public view returns (uint256)
```

### 

```solidity
undefined(address guy, uint256 wad) public returns (bool)
```

### 

```solidity
undefined(address dst, uint256 wad) public returns (bool)
```

### 

```solidity
undefined(address src, address dst, uint256 wad) public returns (bool)
```

