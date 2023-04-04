# @casimir/ethereum

Solidity contracts for decentralized applications

## Contracts

| Contract | Description | Docs |
| --- | --- |
| [SSVManager](./src/SSVManager.sol) | Manages Casimir SSV stake distribution | [#ssvmanager](./docs/index.md#ssvmanager)
| [SSVAutomator](./src/SSVAutomation.sol) | Automates Casimir SSV event handling | [#ssvautomator](./docs/index.md#ssvautomator)

### SSV

#### Compounding Stake

The approach to user stake compounding rewards in this contract involves adjusting the user's stake based on the change in the distribution sum since their last interaction with the contract. The distribution sum represents the cumulative sum of reward-to-stake ratios at each reward distribution event. By tracking this sum, the contract can calculate the user's proportion of earned rewards relative to their initial stake and update their stake accordingly.

In this approach, the user's stake is compounded as follows:

1. Whenever a user deposits or updates their stake, their initial stake and the current distribution sum are recorded.
2. When rewards are distributed, the distribution sum is updated to include the new reward-to-stake ratio.
3. To calculate a user's current stake (including compounded rewards), Casimir SSV uses the following formula:

   $$UserStake =\frac{UserStake_0\times DistributionSum}{UserDistributionSum_0}$$

   Where:
   - $UserStake$: The calculated current stake of the user, including compounded rewards. (This is `users[userAddress].stake` in the contract.)
   - $UserStake_0$: The initial stake of the user at the time of their last deposit or stake update. (This is also `users[userAddress].stake` in the contract.)
   - $DistributionSum$: The current cumulative sum of reward-to-stake ratios in the contract. (This is `distributionSum` in the contract.)
   - $UserDistributionSum_0$: The cumulative sum of reward-to-stake ratios at the time the user made their last deposit or update to their stake. (This is `users[userAddress].distributionSum0` in the contract.)

This approach ensures that users receive rewards proportional to their staked amount and that these rewards are compounded over time as new rewards are distributed.
