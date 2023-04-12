# Solidity API

## CasimirAutomation

### constructor

```solidity
constructor(address casimirManagerAddress, address linkFeedAddress) public
```

Constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| casimirManagerAddress | address | The manager contract address |
| linkFeedAddress | address | The chainlink feed contract address |

### checkUpkeep

```solidity
function checkUpkeep(bytes checkData) external view returns (bool upkeepNeeded, bytes performData)
```

Check if the upkeep is needed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| checkData | bytes | The data to check the upkeep |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepNeeded | bool | True if the upkeep is needed |
| performData | bytes | The data to perform the upkeep |

### performUpkeep

```solidity
function performUpkeep(bytes performData) external
```

Perform the upkeep

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| performData | bytes | The data to perform the upkeep |

### validateUpkeep

```solidity
function validateUpkeep() public view returns (bool upkeepNeeded)
```

Validate if the upkeep is needed

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| upkeepNeeded | bool | True if the upkeep is needed |

### getBeaconStake

```solidity
function getBeaconStake() public view returns (int256)
```

Get the latest total manager stake on beacon reported from chainlink PoR feed

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 | The latest total manager stake on beacon |

### getPoRAddressListLength

```solidity
function getPoRAddressListLength() external view returns (uint256)
```

Get total number of addresses in the list.

### getPoRAddressList

```solidity
function getPoRAddressList(uint256 startIndex, uint256 endIndex) external view returns (string[])
```

Get a batch of human-readable addresses from the address list. The requested batch size can be greater
than the actual address list size, in which the full address list will be returned.

_Due to limitations of gas usage in off-chain calls, we need to support fetching the addresses in batches.
EVM addresses need to be converted to human-readable strings. The address strings need to be in the same format
that would be used when querying the balance of that address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The index of the first address in the batch. |
| endIndex | uint256 | The index of the last address in the batch. If `endIndex > getPoRAddressListLength()-1`, endIndex need to default to `getPoRAddressListLength()-1`. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | Array of addresses as strings. |

## CasimirManager

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

### Token

```solidity
enum Token {
  LINK,
  SSV,
  WETH
}
```

### casimirAutomation

```solidity
contract CasimirAutomation casimirAutomation
```

Automation contract address

### lastPoolId

```solidity
struct Counters.Counter lastPoolId
```

Last pool ID generated for a new pool

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
function getFees() public pure returns (struct ICasimirManager.Fees)
```

Get the current token fees as percentages

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirManager.Fees | The current token fees as percentages |

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
function getPool(uint32 poolId) external view returns (struct ICasimirManager.Pool)
```

Get a pool by ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolId | uint32 | The pool ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct ICasimirManager.Pool | The pool |

### getAutomationAddress

```solidity
function getAutomationAddress() public view returns (address)
```

Get the automation address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The automation address |

## Functions

### DEFAULT_BUFFER_SIZE

```solidity
uint256 DEFAULT_BUFFER_SIZE
```

### Location

```solidity
enum Location {
  Inline,
  Remote
}
```

### CodeLanguage

```solidity
enum CodeLanguage {
  JavaScript
}
```

### Request

```solidity
struct Request {
  enum Functions.Location codeLocation;
  enum Functions.Location secretsLocation;
  enum Functions.CodeLanguage language;
  string source;
  bytes secrets;
  string[] args;
}
```

### EmptySource

```solidity
error EmptySource()
```

### EmptyUrl

```solidity
error EmptyUrl()
```

### EmptySecrets

```solidity
error EmptySecrets()
```

### EmptyArgs

```solidity
error EmptyArgs()
```

### NoInlineSecrets

```solidity
error NoInlineSecrets()
```

### encodeCBOR

```solidity
function encodeCBOR(struct Functions.Request self) internal pure returns (bytes)
```

Encodes a Request to CBOR encoded bytes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct Functions.Request | The request to encode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | CBOR encoded bytes |

### initializeRequest

```solidity
function initializeRequest(struct Functions.Request self, enum Functions.Location location, enum Functions.CodeLanguage language, string source) internal pure
```

Initializes a Chainlink Functions Request

_Sets the codeLocation and code on the request_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct Functions.Request | The uninitialized request |
| location | enum Functions.Location | The user provided source code location |
| language | enum Functions.CodeLanguage | The programming language of the user code |
| source | string | The user provided source code or a url |

### initializeRequestForInlineJavaScript

```solidity
function initializeRequestForInlineJavaScript(struct Functions.Request self, string javaScriptSource) internal pure
```

Initializes a Chainlink Functions Request

_Simplified version of initializeRequest for PoC_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct Functions.Request | The uninitialized request |
| javaScriptSource | string | The user provided JS code (must not be empty) |

### addRemoteSecrets

```solidity
function addRemoteSecrets(struct Functions.Request self, bytes encryptedSecretsURLs) internal pure
```

Adds Remote user encrypted secrets to a Request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct Functions.Request | The initialized request |
| encryptedSecretsURLs | bytes | Encrypted comma-separated string of URLs pointing to off-chain secrets |

### addArgs

```solidity
function addArgs(struct Functions.Request self, string[] args) internal pure
```

Adds args for the user run function

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | struct Functions.Request | The initialized request |
| args | string[] | The array of args (must not be empty) |

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

## FunctionsBillingRegistryInterface

### RequestBilling

```solidity
struct RequestBilling {
  uint64 subscriptionId;
  address client;
  uint32 gasLimit;
  uint256 gasPrice;
}
```

### FulfillResult

```solidity
enum FulfillResult {
  USER_SUCCESS,
  USER_ERROR,
  INVALID_REQUEST_ID
}
```

### getRequestConfig

```solidity
function getRequestConfig() external view returns (uint32, address[])
```

Get configuration relevant for making requests

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | uint32 global max for request gas limit |
| [1] | address[] | address[] list of registered DONs |

### getRequiredFee

```solidity
function getRequiredFee(bytes data, struct FunctionsBillingRegistryInterface.RequestBilling billing) external view returns (uint96)
```

Determine the charged fee that will be paid to the Registry owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| billing | struct FunctionsBillingRegistryInterface.RequestBilling | The request's billing configuration |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint96 | fee Cost in Juels (1e18) of LINK |

### estimateCost

```solidity
function estimateCost(uint32 gasLimit, uint256 gasPrice, uint96 donFee, uint96 registryFee) external view returns (uint96)
```

Estimate the total cost to make a request: gas re-imbursement, plus DON fee, plus Registry fee

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| gasLimit | uint32 | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| gasPrice | uint256 | The request's billing configuration |
| donFee | uint96 | Fee charged by the DON that is paid to Oracle Node |
| registryFee | uint96 | Fee charged by the DON that is paid to Oracle Node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint96 | costEstimate Cost in Juels (1e18) of LINK |

### startBilling

```solidity
function startBilling(bytes data, struct FunctionsBillingRegistryInterface.RequestBilling billing) external returns (bytes32)
```

Initiate the billing process for an Functions request

_Only callable by a node that has been approved on the Registry_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| billing | struct FunctionsBillingRegistryInterface.RequestBilling | Billing configuration for the request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | requestId - A unique identifier of the request. Can be used to match a request to a response in fulfillRequest. |

### fulfillAndBill

```solidity
function fulfillAndBill(bytes32 requestId, bytes response, bytes err, address transmitter, address[31] signers, uint8 signerCount, uint256 reportValidationGas, uint256 initialGas) external returns (enum FunctionsBillingRegistryInterface.FulfillResult)
```

Finalize billing process for an Functions request by sending a callback to the Client contract and then charging the subscription

_Only callable by a node that has been approved on the Registry
simulated offchain to determine if sufficient balance is present to fulfill the request_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestId | bytes32 | identifier for the request that was generated by the Registry in the beginBilling commitment |
| response | bytes | response data from DON consensus |
| err | bytes | error from DON consensus |
| transmitter | address | the Oracle who sent the report |
| signers | address[31] | the Oracles who had a part in generating the report |
| signerCount | uint8 | the number of signers on the report |
| reportValidationGas | uint256 | the amount of gas used for the report validation. Cost is split by all fulfillments on the report. |
| initialGas | uint256 | the initial amount of gas that should be used as a baseline to charge the single fulfillment for execution cost |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum FunctionsBillingRegistryInterface.FulfillResult | result fulfillment result |

### getSubscriptionOwner

```solidity
function getSubscriptionOwner(uint64 subscriptionId) external view returns (address owner)
```

Gets subscription owner.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| subscriptionId | uint64 | - ID of the subscription |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | - owner of the subscription. |

## FunctionsClientInterface

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

## FunctionsOracleInterface

### getRegistry

```solidity
function getRegistry() external view returns (address)
```

Gets the stored billing registry address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | registryAddress The address of Chainlink Functions billing registry contract |

### setRegistry

```solidity
function setRegistry(address registryAddress) external
```

Sets the stored billing registry address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| registryAddress | address | The new address of Chainlink Functions billing registry contract |

### getDONPublicKey

```solidity
function getDONPublicKey() external view returns (bytes)
```

Returns the DON's secp256k1 public key that is used to encrypt secrets

_All nodes on the DON have the corresponding private key
needed to decrypt the secrets encrypted with the public key_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | publicKey the DON's public key |

### setDONPublicKey

```solidity
function setDONPublicKey(bytes donPublicKey) external
```

Sets DON's secp256k1 public key used to encrypt secrets

_Used to rotate the key_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| donPublicKey | bytes | The new public key |

### setNodePublicKey

```solidity
function setNodePublicKey(address node, bytes publicKey) external
```

Sets a per-node secp256k1 public key used to encrypt secrets for that node

_Callable only by contract owner and DON members_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | address | node's address |
| publicKey | bytes | node's public key |

### deleteNodePublicKey

```solidity
function deleteNodePublicKey(address node) external
```

Deletes node's public key

_Callable only by contract owner or the node itself_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | address | node's address |

### getAllNodePublicKeys

```solidity
function getAllNodePublicKeys() external view returns (address[], bytes[])
```

Return two arrays of equal size containing DON members' addresses and their corresponding
public keys (or empty byte arrays if per-node key is not defined)

### getRequiredFee

```solidity
function getRequiredFee(bytes data, struct FunctionsBillingRegistryInterface.RequestBilling billing) external view returns (uint96)
```

Determine the fee charged by the DON that will be split between signing Node Operators for servicing the request

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| billing | struct FunctionsBillingRegistryInterface.RequestBilling | The request's billing configuration |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint96 | fee Cost in Juels (1e18) of LINK |

### estimateCost

```solidity
function estimateCost(uint64 subscriptionId, bytes data, uint32 gasLimit, uint256 gasPrice) external view returns (uint96)
```

Estimate the total cost that will be charged to a subscription to make a request: gas re-imbursement, plus DON fee, plus Registry fee

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| subscriptionId | uint64 | A unique subscription ID allocated by billing system, a client can make requests from different contracts referencing the same subscription |
| data | bytes | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| gasLimit | uint32 | Gas limit for the fulfillment callback |
| gasPrice | uint256 |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint96 | billedCost Cost in Juels (1e18) of LINK |

### sendRequest

```solidity
function sendRequest(uint64 subscriptionId, bytes data, uint32 gasLimit) external returns (bytes32)
```

Sends a request (encoded as data) using the provided subscriptionId

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| subscriptionId | uint64 | A unique subscription ID allocated by billing system, a client can make requests from different contracts referencing the same subscription |
| data | bytes | Encoded Chainlink Functions request data, use FunctionsClient API to encode a request |
| gasLimit | uint32 | Gas limit for the fulfillment callback |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | requestId A unique request identifier (unique per DON) |

## Buffer

_A library for working with mutable byte buffers in Solidity.

Byte buffers are mutable and expandable, and provide a variety of primitives
for appending to them. At any time you can fetch a bytes object containing the
current contents of the buffer. The bytes object should not be stored between
operations, as it may change due to resizing of the buffer._

### buffer

```solidity
struct buffer {
  bytes buf;
  uint256 capacity;
}
```

### init

```solidity
function init(struct Buffer.buffer buf, uint256 capacity) internal pure returns (struct Buffer.buffer)
```

_Initializes a buffer with an initial capacity._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to initialize. |
| capacity | uint256 | The number of bytes of space to allocate the buffer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The buffer, for chaining. |

### fromBytes

```solidity
function fromBytes(bytes b) internal pure returns (struct Buffer.buffer)
```

_Initializes a new buffer from an existing bytes object.
     Changes to the buffer may mutate the original value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| b | bytes | The bytes object to initialize the buffer with. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | A new buffer. |

### truncate

```solidity
function truncate(struct Buffer.buffer buf) internal pure returns (struct Buffer.buffer)
```

_Sets buffer length to 0._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to truncate. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer, for chaining.. |

### append

```solidity
function append(struct Buffer.buffer buf, bytes data, uint256 len) internal pure returns (struct Buffer.buffer)
```

_Appends len bytes of a byte string to a buffer. Resizes if doing so would exceed
     the capacity of the buffer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to append to. |
| data | bytes | The data to append. |
| len | uint256 | The number of bytes to copy. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer, for chaining. |

### append

```solidity
function append(struct Buffer.buffer buf, bytes data) internal pure returns (struct Buffer.buffer)
```

_Appends a byte string to a buffer. Resizes if doing so would exceed
     the capacity of the buffer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to append to. |
| data | bytes | The data to append. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer, for chaining. |

### appendUint8

```solidity
function appendUint8(struct Buffer.buffer buf, uint8 data) internal pure returns (struct Buffer.buffer)
```

_Appends a byte to the buffer. Resizes if doing so would exceed the
     capacity of the buffer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to append to. |
| data | uint8 | The data to append. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer, for chaining. |

### appendBytes20

```solidity
function appendBytes20(struct Buffer.buffer buf, bytes20 data) internal pure returns (struct Buffer.buffer)
```

_Appends a bytes20 to the buffer. Resizes if doing so would exceed
     the capacity of the buffer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to append to. |
| data | bytes20 | The data to append. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer, for chhaining. |

### appendBytes32

```solidity
function appendBytes32(struct Buffer.buffer buf, bytes32 data) internal pure returns (struct Buffer.buffer)
```

_Appends a bytes32 to the buffer. Resizes if doing so would exceed
     the capacity of the buffer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to append to. |
| data | bytes32 | The data to append. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer, for chaining. |

### appendInt

```solidity
function appendInt(struct Buffer.buffer buf, uint256 data, uint256 len) internal pure returns (struct Buffer.buffer)
```

_Appends a byte to the end of the buffer. Resizes if doing so would
     exceed the capacity of the buffer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| buf | struct Buffer.buffer | The buffer to append to. |
| data | uint256 | The data to append. |
| len | uint256 | The number of bytes to write (right-aligned). |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Buffer.buffer | The original buffer. |

## CBOR

_A library for populating CBOR encoded payload in Solidity.

https://datatracker.ietf.org/doc/html/rfc7049

The library offers various write* and start* methods to encode values of different types.
The resulted buffer can be obtained with data() method.
Encoding of primitive types is staightforward, whereas encoding of sequences can result
in an invalid CBOR if start/write/end flow is violated.
For the purpose of gas saving, the library does not verify start/write/end flow internally,
except for nested start/end pairs._

### CBORBuffer

```solidity
struct CBORBuffer {
  struct Buffer.buffer buf;
  uint256 depth;
}
```

### create

```solidity
function create(uint256 capacity) internal pure returns (struct CBOR.CBORBuffer cbor)
```

### data

```solidity
function data(struct CBOR.CBORBuffer buf) internal pure returns (bytes)
```

### writeUInt256

```solidity
function writeUInt256(struct CBOR.CBORBuffer buf, uint256 value) internal pure
```

### writeInt256

```solidity
function writeInt256(struct CBOR.CBORBuffer buf, int256 value) internal pure
```

### writeUInt64

```solidity
function writeUInt64(struct CBOR.CBORBuffer buf, uint64 value) internal pure
```

### writeInt64

```solidity
function writeInt64(struct CBOR.CBORBuffer buf, int64 value) internal pure
```

### writeBytes

```solidity
function writeBytes(struct CBOR.CBORBuffer buf, bytes value) internal pure
```

### writeString

```solidity
function writeString(struct CBOR.CBORBuffer buf, string value) internal pure
```

### writeBool

```solidity
function writeBool(struct CBOR.CBORBuffer buf, bool value) internal pure
```

### writeNull

```solidity
function writeNull(struct CBOR.CBORBuffer buf) internal pure
```

### writeUndefined

```solidity
function writeUndefined(struct CBOR.CBORBuffer buf) internal pure
```

### startArray

```solidity
function startArray(struct CBOR.CBORBuffer buf) internal pure
```

### startFixedArray

```solidity
function startFixedArray(struct CBOR.CBORBuffer buf, uint64 length) internal pure
```

### startMap

```solidity
function startMap(struct CBOR.CBORBuffer buf) internal pure
```

### startFixedMap

```solidity
function startFixedMap(struct CBOR.CBORBuffer buf, uint64 length) internal pure
```

### endSequence

```solidity
function endSequence(struct CBOR.CBORBuffer buf) internal pure
```

### writeKVString

```solidity
function writeKVString(struct CBOR.CBORBuffer buf, string key, string value) internal pure
```

### writeKVBytes

```solidity
function writeKVBytes(struct CBOR.CBORBuffer buf, string key, bytes value) internal pure
```

### writeKVUInt256

```solidity
function writeKVUInt256(struct CBOR.CBORBuffer buf, string key, uint256 value) internal pure
```

### writeKVInt256

```solidity
function writeKVInt256(struct CBOR.CBORBuffer buf, string key, int256 value) internal pure
```

### writeKVUInt64

```solidity
function writeKVUInt64(struct CBOR.CBORBuffer buf, string key, uint64 value) internal pure
```

### writeKVInt64

```solidity
function writeKVInt64(struct CBOR.CBORBuffer buf, string key, int64 value) internal pure
```

### writeKVBool

```solidity
function writeKVBool(struct CBOR.CBORBuffer buf, string key, bool value) internal pure
```

### writeKVNull

```solidity
function writeKVNull(struct CBOR.CBORBuffer buf, string key) internal pure
```

### writeKVUndefined

```solidity
function writeKVUndefined(struct CBOR.CBORBuffer buf, string key) internal pure
```

### writeKVMap

```solidity
function writeKVMap(struct CBOR.CBORBuffer buf, string key) internal pure
```

### writeKVArray

```solidity
function writeKVArray(struct CBOR.CBORBuffer buf, string key) internal pure
```

## MockAggregator

### version

```solidity
uint256 version
```

### description

```solidity
string description
```

### decimals

```solidity
uint8 decimals
```

### latestAnswer

```solidity
int256 latestAnswer
```

### latestTimestamp

```solidity
uint256 latestTimestamp
```

### latestRound

```solidity
uint256 latestRound
```

### getAnswer

```solidity
mapping(uint256 => int256) getAnswer
```

### getTimestamp

```solidity
mapping(uint256 => uint256) getTimestamp
```

### constructor

```solidity
constructor(uint8 _decimals, int256 _initialAnswer) public
```

### updateAnswer

```solidity
function updateAnswer(int256 _answer) public
```

### updateRoundData

```solidity
function updateRoundData(uint80 _roundId, int256 _answer, uint256 _timestamp, uint256 _startedAt) public
```

### getRoundData

```solidity
function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

## MockKeeperRegistry

### registerUpkeep

```solidity
function registerUpkeep(address target, uint32 gasLimit, address admin, bytes checkData, bytes offchainConfig) external view returns (uint256 id)
```

### getState

```solidity
function getState() external pure returns (struct State state, struct OnchainConfig config, address[] signers, address[] transmitters, uint8 f)
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

## OnchainConfig

```solidity
struct OnchainConfig {
  uint32 paymentPremiumPPB;
  uint32 flatFeeMicroLink;
  uint32 checkGasLimit;
  uint24 stalenessSeconds;
  uint16 gasCeilingMultiplier;
  uint96 minUpkeepSpend;
  uint32 maxPerformGas;
  uint32 maxCheckDataSize;
  uint32 maxPerformDataSize;
  uint256 fallbackGasPrice;
  uint256 fallbackLinkPrice;
  address transcoder;
  address registrar;
}
```

## State

```solidity
struct State {
  uint32 nonce;
  uint96 ownerLinkBalance;
  uint256 expectedLinkBalance;
  uint96 totalPremium;
  uint256 numUpkeeps;
  uint32 configCount;
  uint32 latestConfigBlockNumber;
  bytes32 latestConfigDigest;
  uint32 latestEpoch;
  bool paused;
}
```

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

## UpkeepFailureReason

```solidity
enum UpkeepFailureReason {
  NONE,
  UPKEEP_CANCELLED,
  UPKEEP_PAUSED,
  TARGET_CHECK_REVERTED,
  UPKEEP_NOT_NEEDED,
  PERFORM_DATA_EXCEEDS_LIMIT,
  INSUFFICIENT_BALANCE
}
```

## KeeperRegistryBaseInterface

### registerUpkeep

```solidity
function registerUpkeep(address target, uint32 gasLimit, address admin, bytes checkData, bytes offchainConfig) external returns (uint256 id)
```

### cancelUpkeep

```solidity
function cancelUpkeep(uint256 id) external
```

### pauseUpkeep

```solidity
function pauseUpkeep(uint256 id) external
```

### unpauseUpkeep

```solidity
function unpauseUpkeep(uint256 id) external
```

### transferUpkeepAdmin

```solidity
function transferUpkeepAdmin(uint256 id, address proposed) external
```

### acceptUpkeepAdmin

```solidity
function acceptUpkeepAdmin(uint256 id) external
```

### updateCheckData

```solidity
function updateCheckData(uint256 id, bytes newCheckData) external
```

### addFunds

```solidity
function addFunds(uint256 id, uint96 amount) external
```

### setUpkeepGasLimit

```solidity
function setUpkeepGasLimit(uint256 id, uint32 gasLimit) external
```

### setUpkeepOffchainConfig

```solidity
function setUpkeepOffchainConfig(uint256 id, bytes config) external
```

### getUpkeep

```solidity
function getUpkeep(uint256 id) external view returns (struct UpkeepInfo upkeepInfo)
```

### getActiveUpkeepIDs

```solidity
function getActiveUpkeepIDs(uint256 startIndex, uint256 maxCount) external view returns (uint256[])
```

### getTransmitterInfo

```solidity
function getTransmitterInfo(address query) external view returns (bool active, uint8 index, uint96 balance, uint96 lastCollected, address payee)
```

### getState

```solidity
function getState() external view returns (struct State state, struct OnchainConfig config, address[] signers, address[] transmitters, uint8 f)
```

## IKeeperRegistry

_The view methods are not actually marked as view in the implementation
but we want them to be easily queried off-chain. Solidity will not compile
if we actually inherit from this interface, so we document it here._

### checkUpkeep

```solidity
function checkUpkeep(uint256 upkeepId) external view returns (bool upkeepNeeded, bytes performData, enum UpkeepFailureReason upkeepFailureReason, uint256 gasUsed, uint256 fastGasWei, uint256 linkNative)
```

## KeeperRegistryExecutableInterface

### checkUpkeep

```solidity
function checkUpkeep(uint256 upkeepId) external returns (bool upkeepNeeded, bytes performData, enum UpkeepFailureReason upkeepFailureReason, uint256 gasUsed, uint256 fastGasWei, uint256 linkNative)
```

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

## ICasimirAutomation

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

### validateUpkeep

```solidity
function validateUpkeep() external view returns (bool upkeepNeeded)
```

### getPoRAddressListLength

```solidity
function getPoRAddressListLength() external view returns (uint256)
```

Get total number of addresses in the list.

### getPoRAddressList

```solidity
function getPoRAddressList(uint256 startIndex, uint256 endIndex) external view returns (string[])
```

Get a batch of human-readable addresses from the address list. The requested batch size can be greater
than the actual address list size, in which the full address list will be returned.

_Due to limitations of gas usage in off-chain calls, we need to support fetching the addresses in batches.
EVM addresses need to be converted to human-readable strings. The address strings need to be in the same format
that would be used when querying the balance of that address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startIndex | uint256 | The index of the first address in the batch. |
| endIndex | uint256 | The index of the last address in the batch. If `endIndex > getPoRAddressListLength()-1`, endIndex need to default to `getPoRAddressListLength()-1`. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | Array of addresses as strings. |

## ICasimirManager

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

### ManagerDistribution

```solidity
event ManagerDistribution(address sender, uint256 ethAmount, uint256 time)
```

### PoolDeposit

```solidity
event PoolDeposit(address sender, uint32 poolId, uint256 amount, uint256 time)
```

### PoolStaked

```solidity
event PoolStaked(uint32 poolId, bytes validatorPublicKey, uint32[] operatorIds)
```

### ValidatorAdded

```solidity
event ValidatorAdded(bytes publicKey, uint32[] operatorIds)
```

### ValidatorRemoved

```solidity
event ValidatorRemoved(bytes publicKey, uint32[] operatorIds)
```

### UserWithdrawal

```solidity
event UserWithdrawal(address sender, uint256 ethAmount, uint256 time)
```

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256 amount) external
```

### getFees

```solidity
function getFees() external view returns (struct ICasimirManager.Fees)
```

### getLINKFee

```solidity
function getLINKFee() external view returns (uint32)
```

### getSSVFee

```solidity
function getSSVFee() external view returns (uint32)
```

### getStakedValidatorPublicKeys

```solidity
function getStakedValidatorPublicKeys() external view returns (bytes[])
```

### getReadyValidatorPublicKeys

```solidity
function getReadyValidatorPublicKeys() external view returns (bytes[])
```

### getReadyPoolIds

```solidity
function getReadyPoolIds() external view returns (uint32[])
```

### getStakedPoolIds

```solidity
function getStakedPoolIds() external view returns (uint32[])
```

### getStake

```solidity
function getStake() external view returns (uint256)
```

### getReadyDeposits

```solidity
function getReadyDeposits() external view returns (uint256)
```

### getUserStake

```solidity
function getUserStake(address userAddress) external view returns (uint256)
```

