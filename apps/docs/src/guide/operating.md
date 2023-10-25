# Operating

Casimir operators are SSV operators with a distributed key generation (DKG) server enabled to participate in validator key ceremonies. Operators run validators in clusters of 4 or more using threshold signatures on the [Secret Shared Validator (SSV) network](https://ssv.network). Any registered SSV operator may be registered with Casimir, and once collateralized, the operator becomes eligible for validator selection. As an operator, you are paid based on your configured fee per-block per-validator.

::: info
If you already have an SSV operator with a DKG server, you may skip to [Registration](#registration).
:::


<!--@include: ../parts/casimir-operator-README.md{5,13}-->
::: warning
This quickstart is still under development and does not yet run Ethereum clients out of the box. You'll want to review the [Ethereum RPC Node](#ethereum-rpc-node) requirements and sync your own execution and consensus clients. We do plan to add support for running Ethereum clients in the future.
:::
<!--@include: ../parts/casimir-operator-README.md{15,55}-->

## Registration

For any new operator, you need to first register with SSV. As a registered SSV operator, you may now register and deposit collateral to one of Casimir's staking strategies (i.e., standard or EigenLayer-enabled). Your SSV operator ID, DKG server URL, and initial collateral deposit (minimum of 1 ETH) need to be provided during registration.

### Collateral

Your collateral serves as a 1 ETH security deposit for each validator you wish to operate. You may deactivate and withdraw your collateral at any time, but you will be ineligible for selection until you re-register and deposit collateral again.

#### Collateral Penalties

Collateral is used to recover lost validator effective balance at the time of resharing or completing an exit. In either case, when an operator is removed from a validator, they are held responsible for up to 1 ETH of the validator's effective balance if any is lost below the 32 ETH minimum. The potential nonzero amount an operator owes in this case is called the **blame amount**. The blame amount is calculated as follows:

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

Operator clusters are selected for each new validator using a distribution algorithm that ensures high-performance but emphasizes decentralization. The algorithm uses attributes and metrics obtained from the Casimir and SSV contracts, and the SSV network. An operator is evaluated by available collateral (1 ETH per validator), previous performance, current validator count, and fees.

### Rewards

Operators earn rewards based on their configured fee per-block per-validator. This is configured during registration with SSV.