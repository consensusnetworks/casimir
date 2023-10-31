::: warning
This page is incomplete.
:::

# Staking

As a Casimir staker, you can deposit any amount of ETH to a staking strategy of your choice (i.e., base or EigenLayer) through the strategy's respective manager contract. Your staking rewards are auto-compounded at an optimal rate, and you can request a withdrawal of your deposit plus any earned proportion of new stake (or a partial amount of your choice) at any time.

## Staking Fees

The contract charges a staking fee on deposits and rewards to cover operational expenses.

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

## Stake Balances

Your stake balance is calculated on-chain using the change in the total reward-to-stake ratio sum since your last interaction (deposit or withdrawal) with the manager contract. Each time new rewards are reported, the total ratio sum is updated to include the new rewards-to-stake ratio. The total ratio sum is used to calculate your current stake balance.

**Current Stake Balance:**

Let:

- $S$ be the calculated user's current stake balance, including compounded rewards.
- $S_0$ be the user's initial stake balance at the time of their last deposit or withdrawal.
- $R_s$ be the current cumulative sum of reward-to-stake ratios in the contract.
- $R_{s0}$ be the cumulative sum of reward-to-stake ratios at the time the user made their last deposit or withdrawal.

The user's current stake balance is calculated as:
$S = S_0 \times \frac{R_s}{R_{s0}}$

Where:

- $S$ corresponds to **`users[userAddress].stake`** in the contract.
- $S_0$ also corresponds to **`users[userAddress].stake`** in the contract, but it's accessed before settling the user's current stake.
- $R_s$ is represented by **`stakeRatioSum`** in the contract.
- $R_{s0}$ is represented by **`users[userAddress].stakeRatioSum0`** in the contract.

## Stake Withdrawals

You can request a withdrawal of any amount of your stake at any time. If the requested amount is available in the manager's withdrawable balance (prepooled balance plus withdrawn balance), the withdrawal is fulfilled immediately. Otherwise, the withdrawal is added to the pending withdrawals queue and fulfilled when the requested amount is available (usually within 1-4 days, depending on the amount).