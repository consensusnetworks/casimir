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

### Balance

```solidity
struct Balance {
  uint256 stake;
  uint256 rewards;
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
  struct SSVManager.Balance balance;
  mapping(address => struct SSVManager.Balance) userBalances;
  string validatorPublicKey;
  uint32[] operatorIds;
}
```

### User

```solidity
struct User {
  mapping(uint32 => bool) poolIdLookup;
  uint32[] poolIds;
}
```

### _lastPoolId

```solidity
struct Counters.Counter _lastPoolId
```

Pool ID generator

### swapRouter

```solidity
contract ISwapRouter swapRouter
```

Uniswap ISwapRouter

### ValidatorInitialized

```solidity
event ValidatorInitialized(uint32 poolId, uint32[] operatorIds, string validatorPublicKey)
```

Event signaling a validator init request fulfillment

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

### constructor

```solidity
constructor(address _linkOracleAddress, address _swapRouterAddress, address _linkTokenAddress, address _ssvTokenAddress, address _wethTokenAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _linkOracleAddress | address | - The Chainlink oracle address |
| _swapRouterAddress | address | - The Uniswap router address |
| _linkTokenAddress | address | - The Chainlink token address |
| _ssvTokenAddress | address | - The SSV token address |
| _wethTokenAddress | address | - The WETH contract address |

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

### requestValidatorInit

```solidity
function requestValidatorInit(uint32 _poolId) public returns (bytes32 _requestId)
```

Get validator init config with operators and deposit data from a DKG ceremony

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requestId | bytes32 | - ID of the request |

### fulfillValidatorInit

```solidity
function fulfillValidatorInit(bytes32 _requestId, uint32 _data) public
```

Receives the response in the form of uint32

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requestId | bytes32 | - id of the request |
| _data | uint32 | - response |

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
function getUserPoolIds(address _userAddress) external view returns (uint32[])
```

Get a list of a user's pool IDs by user address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _userAddress | address | - The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | A list of a user's pool IDs |

### getPoolUserBalance

```solidity
function getPoolUserBalance(uint32 _poolId, address _userAddress) external view returns (struct SSVManager.Balance)
```

Get a user's balance in a pool by user address and pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _poolId | uint32 | - The pool ID |
| _userAddress | address | - The user address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Balance | A user's balance in a pool |

### getPoolBalance

```solidity
function getPoolBalance(uint32 _poolId) external view returns (struct SSVManager.Balance)
```

Get a pool's balance by pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _poolId | uint32 | - The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct SSVManager.Balance | The pool's balance |

### getPoolValidatorPublicKey

```solidity
function getPoolValidatorPublicKey(uint32 _poolId) external view returns (string)
```

Get a pool's validator public key by pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _poolId | uint32 | - The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The pool's validator public key |

### getPoolOperatorIds

```solidity
function getPoolOperatorIds(uint32 _poolId) external view returns (uint32[])
```

Get a pool's operators by pool ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _poolId | uint32 | - The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32[] | The pool's operators |

## IWETH9

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256 _amount) external
```

## MockOracle

Chainlink smart contract developers can use this to test their contracts

### EXPIRY_TIME

```solidity
uint256 EXPIRY_TIME
```

### Request

```solidity
struct Request {
  address callbackAddr;
  bytes4 callbackFunctionId;
}
```

### LinkToken

```solidity
contract LinkTokenInterface LinkToken
```

### OracleRequest

```solidity
event OracleRequest(bytes32 specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)
```

### CancelOracleRequest

```solidity
event CancelOracleRequest(bytes32 requestId)
```

### constructor

```solidity
constructor(address _link) public
```

Deploy with the address of the LINK token

_Sets the LinkToken address for the imported LinkTokenInterface_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _link | address | The address of the LINK token |

### oracleRequest

```solidity
function oracleRequest(address _sender, uint256 _payment, bytes32 _specId, address _callbackAddress, bytes4 _callbackFunctionId, uint256 _nonce, uint256 _dataVersion, bytes _data) external
```

Creates the Chainlink request

_Stores the hash of the params as the on-chain commitment for the request.
Emits OracleRequest event for the Chainlink node to detect._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sender | address | The sender of the request |
| _payment | uint256 | The amount of payment given (specified in wei) |
| _specId | bytes32 | The Job Specification ID |
| _callbackAddress | address | The callback address for the response |
| _callbackFunctionId | bytes4 | The callback function ID for the response |
| _nonce | uint256 | The nonce sent by the requester |
| _dataVersion | uint256 | The specified data version |
| _data | bytes | The CBOR payload of the request |

### fulfillOracleRequest

```solidity
function fulfillOracleRequest(bytes32 _requestId, uint32 _data) external returns (bool)
```

Called by the Chainlink node to fulfill requests

_Given params must hash back to the commitment stored from `oracleRequest`.
Will call the callback address' callback function without bubbling up error
checking in a `require` so that the node can get paid._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requestId | bytes32 | The fulfillment request ID that must match the requester's |
| _data | uint32 | The data to return to the consuming contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Status if the external call was successful |

### cancelOracleRequest

```solidity
function cancelOracleRequest(bytes32 _requestId, uint256 _payment, bytes4, uint256 _expiration) external
```

Allows requesters to cancel requests sent to this oracle contract. Will transfer the LINK
sent for the request back to the requester's address.

_Given params must hash to a commitment stored on the contract in order for the request to be valid
Emits CancelOracleRequest event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requestId | bytes32 | The request ID |
| _payment | uint256 | The amount of payment given (specified in wei) |
|  | bytes4 |  |
| _expiration | uint256 | The time of the expiration for the request |

### getChainlinkToken

```solidity
function getChainlinkToken() public view returns (address)
```

Returns the address of the LINK token

_This is the public implementation for chainlinkTokenAddress, which is
an internal method of the ChainlinkClient contract_

### isValidRequest

```solidity
modifier isValidRequest(bytes32 _requestId)
```

_Reverts if request ID does not exist_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requestId | bytes32 | The given request ID to check in stored `commitments` |

### checkCallbackAddress

```solidity
modifier checkCallbackAddress(address _to)
```

_Reverts if the callback address is the LINK token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The callback address |

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

