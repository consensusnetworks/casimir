# @casimir/ethereum

Solidity contracts for decentralized staking on Ethereum

## About

Currlently stakers either need to solo-stake (and have least 32 Ether), or they need to pool their assets in a liquid staking protocol (LSD). While the former choice is a reliably secure choice for Ether holders (if they have solid infrastructure), the latter, LSDs, often present an inherent counterparty risk to the user because of  their centralized control of staking node operators (see [The Risks of LSD](https://notes.ethereum.org/@djrtwo/risks-of-lsd)).

Casimir is designed to offer users the experience and security of solo-staking while pooling their assets. The Casimir contracts seamlessly connect stakers with any amount of Ether to a permissionless registry of high-performing node operators. Casimir aims to minimize counterparty risk for users and improve decentralization in Ethereum staking:

- Validators duties are performed by registered (collateralized) operators running distributed validator technology (DVT)
- Keys are created and reshared using distributed key generation (DKG)
- Automated balance and status reports are carried out by a decentralized oracle network (DON)

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

## Architecture

Casimir distributes user deposits to Ethereum validators operated by SSV. Validator keys are shared with zero-coordination distributed key generation. Chainlink nodes report from the Beacon chain and SSV to sync balances and rewards, manage collateral recovery, and automate validator creation and exits.

```mermaid
graph LR

    subgraph Contracts
        B(Manager Contract)
        C(Beacon Deposit Contract)
        D(SSV Contract)
        H(Functions Contract)
        I(Automation Contract)
    end

    subgraph Oracle Dao
        G(Oracle)
    end
    G --> B

    A((User)) --> B

    B --> C
    B --> D

    C --> E1(Ethereum Validator 1)
    C --> E2(Ethereum Validator 2)

    subgraph Validator 1
        E1 --> F11(SSV Operator 1)
        E1 --> F12(SSV Operator 2)
        E1 --> F13(SSV Operator 3)
        E1 --> F14(SSV Operator 4)
    end
    
    subgraph Validator 2
        E2 --> F21(SSV Operator 5)
        E2 --> F22(SSV Operator 6)
        E2 --> F23(SSV Operator 7)
        E2 --> F24(SSV Operator n)
    end

    I --> B
    H <--> I
    
    subgraph Chainlink
        J1(Chainlink Node 1)
        J2(Chainlink Node 2)
        J3(Chainlink Node 3)
        J4(Chainlink Node n)
    end
    
    J1 --> H
    J2 --> H
    J3 --> H
    J4 --> H

    J1 --> I
    J2 --> I
    J3 --> I
    J4 --> I
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
| AutomationRegistry | Subscribes and funds upkeeps |
| DepositContract | Accepts Beacon deposits |
| ERC20 | Standardizes tokens |
| FunctionsClient | Calls Chainlink Functions |
| KeeperRegistrar | Allows upkeep subscription registration |
| Math | Provides math helpers |
| Ownable | Provides ownable access control |
| ReentrancyGuard | Secures against reentrancy |
| SSVNetwork | Registers SSV validators |
| SSVNetworkCore | Provides base SSV logic and types |
| SSVNetworkViews | Provides read-only access to SSV network state |
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

## Distributed Key Generation

Casimir distributes validator key shares to operators using SSV nodes with [RockX DKG support](https://github.com/RockX-SG/rockx-dkg-cli). The [@casimir/oracle service](https://github.com/consensusnetworks/casimir/blob/master/services/oracle) uses a DKG messenger server to interact with SSV nodes and perform DKG operations. Before running tests, the [@casimir/oracle generate script](https://github.com/consensusnetworks/casimir/blob/master/services/oracle/scripts/generate.ts) is used to pregenerate DKG keys and the [oracle helper scripts](https://github.com/consensusnetworks/casimir/blob/master/contracts/ethereum/helpers/oracle) completes tests with the pregenerated DKG keys. While running the development environment, a local instance of the @casimir/oracle service is used.

## Oracles

The contract uses two oracles to automate the Casimir staking experience and ensure the security of user funds. The [Casimir Beacon oracle](https://github.com/consensusnetworks/casimir/blob/master/services/functions) and the upkeep contract report total validator balance, swept balance, and validator actions once per day using [Chainlink Functions](https://docs.chain.link/chainlink-functions) and [Chainlink Automation](https://docs.chain.link/chainlink-automation/introduction). The [Casimir DAO oracle](https://github.com/consensusnetworks/casimir/blob/master/services/oracle) watches the manager contract events and automatically executes zero-coordination distributed key generation (DKG) operations: validator creation, validator resharing, and validator exiting. The DAO oracle also submits verifiable report details in response to reported validator actions (such as an SSV cluster and operator blame amounts for a completed validator exit).

## Users

Users can deposit any amount of ETH to the manager contract. Their deposits are staked to validators run by SSV operators (see [Operators](#operators)). Rewards are auto-compounded into stake and users can withdraw their principal plus any earned proportion of new stake (or a partial amount of their choice) at any time.

### User Fees

The contract charges a user fee on deposits and rewards to cover operational expenses.

**Fee Distribution Calculation:**

Let:

- $F_t$ be the total fee percentage, which is a sum of the required ETH, LINK, and SSV fees.
- $D$ be the amount of ETH deposited by the user.
- $E$ be the amount of ETH to be allocated for the contract's operations.
- $F_a$ be the ETH amount to be swapped for LINK and SSV to facilitate the contract's functions.

Given the 5% fee, the ETH to be allocated for the contract's operations is calculated as:
$E = D \times \frac{100}{100 + F_t}$

The amount to be converted to LINK and SSV is:
$F_a = D - E$

Where:

- $F_t$ typically equals 5%.
- $D$ is the amount of ETH the user wants to deposit.
- $E$ represents the actual ETH amount that will be added to the contract after deducting the fee.
- $F_a$ is the remaining ETH that will be used to acquire LINK and SSV.

### User Stake

The manager contract adjusts a user's stake based on the change in the total reward-to-stake ratio sum since their last interaction with the contract. Each time new rewards are reported, the ratio sum is updated to include the new rewards-to-stake ratio. The ratio sum is used to calculate a user's current stake, including compounded rewards, at any time.

**Current Stake Calculation:**

Let:

- $S$ be the calculated current stake of the user, including compounded rewards.
- $S_0$ be the initial stake of the user at the time of their last deposit or stake update.
- $R_s$ be the current cumulative sum of reward-to-stake ratios in the contract.
- $R_{s0}$ be the cumulative sum of reward-to-stake ratios at the time the user made their last deposit or update to their stake.

The user's current compounded stake at any time is calculated as:
$S = S_0 \times \frac{R_s}{R_{s0}}$

Where:

- $S$ corresponds to **`users[userAddress].stake`** in the contract.
- $S_0$ also corresponds to **`users[userAddress].stake`** in the contract, but it's accessed before settling the user's current stake.
- $R_s$ is represented by **`stakeRatioSum`** in the contract.
- $R_{s0}$ is represented by **`users[userAddress].stakeRatioSum0`** in the contract.

### User Withdrawals

Users can request a withdrawal of any amount of their stake at any time. If the requested amount is available in the buffered balance (prepooled balance plus withdrawn balance), the withdrawal is fulfilled immediately. Otherwise, the withdrawal is added to the pending withdrawals queue and fulfilled when the requested amount is available (usually within 1-4 days, depending on the amount).

## Operators

Each Casimir validator is run by four selected operators holding the key shares to perform duties with threshold signatures on SSV. Registration is open to any SSV operator (see [Operator Registration](#operator-registration). Operators are selected by an algorithm that ensures high-performance but emphasizes decentralization (see [Operator Selection](#operator-selection)) as user's deposit stake and new validators are required.

### Operator Registration

Operators can join the contract registry with a deposit of 4 ETH for collateral (see [Operator Collateral](#operator-collateral)) and a lightweight SSV node config add-on (see [Operator Onboarding](#operator-onboarding)).

### Operator Selection

Operators are chosen to run validators based on metrics fetched and derived directly from the SSV network. These metrics are mainly unused collateral (1 ETH per operator per validator), SSV performance, Casimir pool count, and requested fees.

If an operator owner would like to deregister their operator and free up their collateral, they can request a reshare via the Casimir registry. Casimir removes the operator from existing operator groups by resharing or exiting. The latter is only required in the case that a validator has already undergone more than two reshares to avoid leaving the full key recoverable outside of the currently selected operators.

### Operator Collateral

Collateral is used to recover lost validator effective balance at the time of completing an exit. An operator must have at least 1 ETH of available collateral (1 ETH collateral becomes unavailable per each validator that an operator joins) to be selected for a new pool validator. When an operator is removed from a pool, either when resharing or after a completed exit, they are held responsible for up to 1 ETH of the validator's effective balance if any is lost below the 32 ETH minimum. The potential nonzero amount an operator owes in this case is called the blame amount.

**Blame Amount Calculation:**

Let:

- $E$ be the total ETH lost, where $0 \leq E \leq 4$.
- $P_i$ be the performance percentage of the $i^{th}$ operator, where $0 \leq P_i \leq 100$ for $i = 1, 2, 3, 4$.
- $B_i$ be the blame amount for the $i^{th}$ operator.

If all operators have equal performance, the blame is evenly distributed:
$B_i = \frac{E}{4} \quad \text{for all } i$

Otherwise, the blame is distributed inversely proportional to performance:
First, calculate the inverse of each performance:
$I_i = 100 - P_i$

Then, the sum of all inverses:
$S = \sum_{i=1}^{4} I_i$

Now, the blame for each operator is:
$B_i = \left( \frac{I_i}{S} \right) \times E$

The blame amounts are submitted by the DAO oracle in response to a completed validator reshare or exit.

### Operator Onboarding

Operators owners will need to [set up an SSV node with RockX](https://github.com/consensusnetworks/ssv-dkg) and register with Casimir. The operators page in the Casimir app guides an owner through the process and provides an easy interface for registration and operator management.

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
