# @casimir/ethereum

Solidity contracts for decentralized applications

## Contracts

The Casimir Ethereum contracts are configured with a Hardhat development environment in the [hardhat.config.ts](./hardhat.config.ts) file.

### SSV

The Casimir SSV contracts are located in the [src](./src) directory.

| Contract | Description | Docs |
| --- | --- | --- |
| [SSVManager](./src/SSVManager.sol) | Manages Casimir SSV stake distribution | [SSVManager](./docs/index.md#ssvmanager) |
| [SSVAutomator](./src/SSVAutomation.sol) | Automates Casimir SSV event handling | [SSVAutomator](./docs/index.md#ssvautomator) |

#### Compounding Stake

The approach to user stake compounding rewards in the manager contract involves adjusting the user's stake based on the change in the distribution sum since their last interaction with the contract. The distribution sum represents the cumulative sum of reward-to-stake ratios at each reward distribution event. By tracking this sum, the contract can calculate the user's proportion of earned rewards relative to their initial stake and update their stake accordingly.

In this approach, the user's stake is compounded as follows:

1. Whenever a user deposits or updates their stake, their initial stake and the current distribution sum are recorded.
2. When rewards are distributed, the distribution sum is updated to include the new reward-to-stake ratio.
3. To calculate a user's current stake (including compounded rewards), Casimir SSV uses the following formula:

   $$UserStake =\frac{UserStake_0\times DistributionSum}{UserDistributionSum_0}$$

   Where:

   - $UserStake$ is the calculated current stake of the user, including compounded rewards. This is [**`users[userAddress].stake`**](./docs/index.md#user) in the contract.
   - $UserStake_0$ is the initial stake of the user at the time of their last deposit or stake update. This is also [**`users[userAddress].stake`**](./docs/index.md#user) in the contract.
   - $DistributionSum$ is the current cumulative sum of reward-to-stake ratios in the contract. This is [**`distributionSum`**](./docs/index.md#distributionsum) in the contract.
   - $UserDistributionSum_0$ is the cumulative sum of reward-to-stake ratios at the time the user made their last deposit or update to their stake. This is [**`users[userAddress].distributionSum0`**](./docs/index.md#user) in the contract.

This approach ensures that users receive rewards proportional to their staked amount and that these rewards are compounded over time as new rewards are distributed.

#### Distributed Key Generation

The manager contract bootstraps validators for Casimir SSV by trustlessly distributing key shares to operators using the [rockx-dkg-cli](https://github.com/RockX-SG/rockx-dkg-cli). The Casimir SSV key generation server is distributed by Chainlink nodes, which respond to requests from the contract.

#### Fees

The contract charges a small fee for each deposit (and some amount TBD in reward distribution) to fund the contract's operations. The fee is a percentage of the total amount deposited or distributed, and is calculated as follows:

$$Fee=\frac{Amount\timesFeeRate}{100}$$

Where:

- $Amount$ is the total amount deposited or distributed.
- $FeeRate$ is the fee rate, which is set to 0.2% (2/1000) in the contract. This is currently hardcoded to take 0.1% each for LINK and SSV fees.

#### Operators

SSV operators are responsible for running validators for Casimir SSV. Operators can be added to the contract by any user with a small deposit of ETH for slashing collateral (amount TBD, see [Fees](./README.md#fees)). Operators are selected by a formula that emphasizes decentralization (TBD) as new validators are required.

Operators will need to follow the [node onboarding process from RockX](https://github.com/RockX-SG/rockx-dkg-cli/blob/main/docs/dkg_node_installation_instructions.md) to participate in DKG make their node available to new validator selections. Operator performance is monitored by Chainlink nodes, which can remove operators and reshare validators if performance is poor for an extended period of time (TBD).

Todo @elizyoung0011 - we should add your details about operator selection and performance monitoring thresholds.

#### Oracles

The contract uses two sufficiently decentralized Chainlink oracles. The first oracle provides a PoR feed that aggregates the total of all Casimir validator balances on the Beacon chain. The second oracle automates checking for contract balance changes, responds with relevant validator actions, and updates the contract (only when necessary conditions are met). See more about Chainlink PoR feeds [here](https://docs.chain.link/data-feeds/proof-of-reserve). See more about Chainlink automation upkeeps [here](https://docs.chain.link/chainlink-automation/introduction).

#### Withdrawals

Users can initiate a withdrawal of any amount of their stake at any time. **Full exits and withdrawal liquidity are still a WIP.** In the meantime, valid user withdrawals up to the to total current `readyDeposits` will be fulfilled by the contract. Note, more notes are coming soon on withdrawal liquidity, alongside an additional contract.
