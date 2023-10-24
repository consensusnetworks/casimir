# @casimir/ethereum

Solidity contracts for decentralized staking on Ethereum

## Development

**All testing and development commands should be run from the repository root.**

See the [@casimir/ethereum section in the repository root README.md](https://github.com/consensusnetworks/casimir/blob/master/README.md#casimirethereum) for testing and development instructions.

Build the contracts (without any tests or development environment).

```zsh
# From the repository root
npm run build --workspace @casimir/ethereum
```

To directly run any script in the [@casimir/ethereum package.json](https://github.com/consensusnetworks/casimir/blob/master/contracts/ethereum/package.json), use the `--workspace @casimir/ethereum` flag.

```zsh
# From the repository root
npm run <script> --workspace @casimir/ethereum
```

## Contracts

Casimir v1 contains five internal contracts with interfaces and uses a suite of vendor contracts from Chainlink, OpenZeppelin, SSV, and Uniswap. A Hardhat environment is configured in [hardhat.config.ts](https://github.com/consensusnetworks/casimir/blob/master/contracts/ethereum/hardhat.config.ts).

**Internal Contracts:**

Internal contracts and interfaces are located in [src/v1](src/v1).

| Contract | Description |
| --- | --- |
| CasimirManager | Accepts and distributes deposits |
| CasimirPool | Accepts deposits and stakes a validator |
| CasimirRegistry | Manages operator registration and collateral |
| CasimirUpkeep | Automates and handles reports |
| CasimirViews | Provides complex off-chain-only call methods |

**Internal Libraries:**

Internal library source code is located in [src/v1/lib](src/v1/libraries).

| Library | Description |
| --- | --- |
| Types | Defines internal types |

**Vendor Contracts:**

Vendor contracts and interfaces are located in the [src/v1/vendor](./src/v1/vendor) directory, or they are imported directly from installed libraries.

| Contract | Description |
| --- | --- |
| AutomationRegistry | Provides upkeep funding operators |
| DepositContract | Accepts Beacon deposits |
| ERC20 | Standardizes tokens |
| FunctionsClient | Calls Chainlink Functions |
| KeeperRegistrar | Provides upkeep registration |
| Math | Provides math helpers |
| Ownable | Provides ownable access control |
| ReentrancyGuard | Secures against reentrancy |
| SSVNetwork | Registers SSV validators |
| SSVNetworkCore | Provides base SSV logic and types |
| SSVViews | Provides read-only access to SSV network state |
| SwapRouter | Routes token swaps |
| UniswapV3Factory | Provides access to Uniswap V3 pools |
| UniswapV3PoolState | Provides access to Uniswap V3 pool state |
| WETH | Wraps ETH for swapping |

**Mock Contracts:**

Mock (development-only) contracts and interfaces are located in the [src/mock](./src/v1/mock) directory.

| Contract | Description |
| --- | --- |
| FunctionsBillingRegistry | Handles billing for Chainlink Functions |
| FunctionsOracle | Make Chainlink Functions requests |
| FunctionsOracleFactory | Deploy Chainlink Functions oracle |

## Future Development

Casimir will receive ongoing development and maintenance to improve the user experience and security of the protocol. The development and release of proposal solutions will be rigorously reviewed and voted on by the Casimir DAO. The following is a list of planned improvements proposals.

**Improvement Proposals:**

| Proposal | Description | Result |
| --- | --- | --- |
| CIP-1 | Trigger validator exits in manager using [SSV voluntary exits](https://github.com/bloxapp/SIPs/blob/voluntary_exit/sips/voluntary_exit.md) | Improves decentralization by allowing validators to be exited without relying on the DAO oracle |
| CIP-2 | Trigger DKG operations without oracle or messenger server using RockX's p2p solution for [SSV DKG](https://github.com/bloxapp/SIPs/blob/main/sips/dkg.md) | Improves decentralization by allowing DKG operations to be triggered without relying on the DAO oracle or messenger server |
| CIP-3 | Create an opt-in or alternative staking provider that integrates Casimir pools with [EigenLayer pods](https://github.com/Layr-Labs/eigenlayer-contracts/blob/master/docs/EigenPods.md) | Improves user staking account functionality and utility for some use cases |
| CIP-4 | Prove validator status reports using [beacon block root in the EVM](https://eips.ethereum.org/EIPS/eip-4788) | Improves decentralization by allowing validator status reports to be verified on-chain |
| CIP-5 | Trigger validator exits in manager using [execution layer triggerable exits](https://eips.ethereum.org/EIPS/eip-7002) | Improves decentralization by allowing validators to be exited without relying on the DAO oracle or node operators |
