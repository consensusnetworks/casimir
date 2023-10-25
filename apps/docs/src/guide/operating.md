# Operating

Casimir validators are run by clusters of 4 or more operators using threshold signatures on the [Secret Shared Validator (SSV) network](https://ssv.network). Any registered SSV operator may be registered with Casimir, and once collateralized, the operator becomes eligible for validator selection. Operator clusters are selected for each new validator using a distribution algorithm that ensures high-performance but emphasizes decentralization. Operators earn rewards based on their configured fee per-block per-validator.

## Setup

Casimir operators are required to run a  node to perform duties for validators. Since validator keys are created and reshared using distributed key generation (DKG), operators must also run a DKG server to participate in key ceremonies. A Casimir operator consists of the following components:

1. The [Ethereum RPC node](#ethereum-rpc-node) connects the SSV DVT node to the Ethereum network.
2. The [SSV node](#ssv-node) performs cluster duties for validators.
3. The [SSV DKG server](#ssv-dkg-server) participates in key generation and resharing ceremonies.

::: tip
See [our Docker compose template](https://github.com/consensusnetworks/casimir-operator.git) for a quickstart that includes all components.
:::

### Ethereum RPC Node

You can use any pair of execution and consensus client to run your Ethereum RPC node. See the list of [execution](https://ethereum.org/en/developers/docs/nodes-and-clients/#execution-clients) and [consensus](https://ethereum.org/en/developers/docs/nodes-and-clients/#consensus-clients) clients to choose the best pair for your system. **The execution and consensus RPC APIs must be enabled and accessible to the SSV node.**

### SSV Node

The [SSV node installation guide](https://docs.ssv.network/operator-user-guides/operator-node/installation) walks through preparing the required services, securely generating an operator keystore, and configuring the node. The configuration will require your encrypted operator keystore and password file paths, as well as the execution RPC WebSocket endpoint and consensus RPC endpoint from your Ethereum RPC node.

### SSV DKG Server

Once you have your SSV node configured, you can follow the [SSV DKG operator quickstart](https://github.com/bloxapp/ssv-dkg#operator-quick-start) to add a DKG server to your operator. The DKG server configuration will also require your encrypted operator keystore and password file paths. **You must provide a publicly accessible DKG node endpoint to Casimir during registration.**

## Registration

As an operator owner, you first need to register your operator with the SSV registry. Then you may register and deposit collateral to any Casimir manager registry (i.e., standard or EigenLayer-enabled) through the Casimir app to be eligible for selection (1 ETH per validator). Your SSV operator ID, DKG server URL, and initial collateral deposit (minimum of 1 ETH) need to be provided during registration.

### Collateral

Your collateral serves as a 1 ETH security deposit for each validator you wish to operate. You may deactivate and withdraw your collateral at any time, but you will be ineligible for selection until you re-register and deposit collateral again.

Collateral is used to recover lost validator effective balance at the time of resharing or completing an exit. In either case, when an operator is removed from a validator, they are held responsible for up to 1 ETH of the validator's effective balance if any is lost below the 32 ETH minimum. The potential nonzero amount an operator owes in this case is called the blame amount.

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

### Selection

Operators are chosen to run validators based on attributes and metrics obtained from the Casimir and SSV contracts, and the SSV network. An operator is evaluated by available collateral (1 ETH per validator), previous performance, current validator count, and fees.
