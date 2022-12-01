# Solidity API

## SSVManager

### _lastPoolId

```solidity
struct Counters.Counter _lastPoolId
```

Pool ID generator

### swapFee

```solidity
uint24 swapFee
```

Uniswap 0.3% fee tier

### swapRouter

```solidity
contract ISwapRouter swapRouter
```

Uniswap ISwapRouter

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

### Balance

```solidity
struct Balance {
  uint256 stake;
  uint256 rewards;
}
```

### Pool

```solidity
struct Pool {
  struct SSVManager.Balance balance;
  mapping(address => struct SSVManager.Balance) userBalances;
}
```

### User

```solidity
struct User {
  mapping(uint256 => bool) poolIdLookup;
  uint256[] poolIds;
}
```

### tokens

```solidity
mapping(enum SSVManager.Token => address) tokens
```

Token addresses

### users

```solidity
mapping(address => struct SSVManager.User) users
```

All users who have deposited to pools

### pools

```solidity
mapping(uint256 => struct SSVManager.Pool) pools
```

SSV pools

### openPoolIds

```solidity
uint256[] openPoolIds
```

Pool IDs of pools accepting deposits

### stakedPoolIds

```solidity
uint256[] stakedPoolIds
```

Pool IDs of pools completed and staked

### ManagerDeposit

```solidity
event ManagerDeposit(address userAddress, uint256 depositAmount, uint256 depositTime)
```

Event signaling a user deposit to the manager

### PoolStake

```solidity
event PoolStake(address userAddress, uint256 poolId, uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount, uint256 stakeTime)
```

Event signaling a user stake to a pool

### constructor

```solidity
constructor(address swapRouterAddress, address linkTokenAddress, address ssvTokenAddress, address wethTokenAddress) public
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
| [0] | uint256 | The LINK and SSV fee amounts, and remaining stake amount after fees |
| [1] | uint256 |  |
| [2] | uint256 |  |

### wrap

```solidity
function wrap(uint256 amount) private
```

_Deposit WETH to use ETH in swaps_

### swap

```solidity
function swap(address tokenIn, address tokenOut, uint256 amountIn) private returns (uint256)
```

_Swap one token-in for another token-out_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of token-out |

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

### getOpenPoolIds

```solidity
function getOpenPoolIds() external view returns (uint256[])
```

Get all open pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | An array of all open pool IDs |

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint256[])
```

Get all the staked pool IDs

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | An array of all the staked pool IDs |

### getPoolsForUser

```solidity
function getPoolsForUser(address userAddress) external view returns (uint256[])
```

Get the pools for a given user

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | An array of pools for a given user |

### getPoolUserBalance

```solidity
function getPoolUserBalance(address userAddress, uint256 poolId) external view returns (struct SSVManager.Balance)
```

Get a pool user balance by pool ID

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Balance | The pool user balance |

### getPoolBalance

```solidity
function getPoolBalance(uint256 poolId) external view returns (struct SSVManager.Balance)
```

Get a pool balance by pool ID

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Balance | The pool balance |

## IWETH9

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256 _amount) external
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

