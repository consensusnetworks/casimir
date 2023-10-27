# Operating

As a Casimir operator, you will be selected to share validator duties with other operators in clusters of 4, using threshold signatures on the [Secret Shared Validator (SSV) network](https://ssv.network). You'll need an SSV operator extended with distributed key generation (DKG) support to participate in on-demand validator key generation and resharing ceremonies. Once set up, you'll be able to register your operator with SSV and deposit collateral to one of Casimir's [staking strategies](../introduction/staking-strategies.md) to become eligible for selection. You are able to set your operational fee with SSV, which dictates the amount you get paid per-block per-validator.

<!--@include: ../parts/casimir-operator-README.md{5,12}-->
::: tip
If you already have an SSV and DKG node, you may skip to [Registration](#registration).
:::
<!--@include: ../parts/casimir-operator-README.md{13,14}-->

::: warning
This quickstart is still under development and does not yet set up [Ethereum clients](https://ethereum.org/en/developers/docs/nodes-and-clients) out of the box. You'll want to review the [Ethereum RPC node requirements](#ethereum-rpc-node-requirements) and set up your own execution and consensus clients. We are adding Ethereum clients set up in the near future.
:::
<!--@include: ../parts/casimir-operator-README.md{15,69}-->

## Registration

As a Casimir operator, you must first register with SSV. Once registered with SSV, you may register and deposit collateral to into one of Casimir's [staking strategies](../introduction/staking-strategies.md). You will need to submit three items during registration:

1. Your SSV operator ID
2. Your public DKG node URL
3. An initial collateral deposit (minimum of 1 ETH)

### SSV Operator ID

### Public DKG Node URL

### Collateral

You must deposit 1 ETH per validator that you would like to operate. If you have inactive collateral (i.e., 2 ETH deposited - 1 validator active = 1 ETH inactive), you can withdraw it at any time. If you have active collateral (any bound to a validator), you may deactivate (reshare) your operator to free your funds and withdraw.

#### Collateral Penalties

Your collateral is used to recover lost validator effective balance for stakers at the time of resharing or completing an exit. In either case, whenever your operator is removed from a validator, your are held responsible for up to 1 ETH of the validator's effective balance if any is lost below the 32 ETH minimum. The potential nonzero amount you might owe is called the **blame amount**. The blame amount is calculated as follows:

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

### Selection

Once you've deposited collateral, your operator is eligible to be selected for a validator. Operators are selected in clusters of 4 for each new validator using a distribution algorithm that ensures high-performance but emphasizes decentralization. The algorithm uses attributes and metrics obtained from the Casimir and SSV contracts, and the SSV network. Your operator will be evaluated by available collateral (1 ETH per validator), previous performance, current validator count, and fees.

### Rewards

You can specify your operational fee (paid per-block per-validator) . This is configured during registration with SSV.