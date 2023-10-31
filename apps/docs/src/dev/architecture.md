# Architecture

Casimir distributes user deposits to Ethereum validators operated by SSV nodes. Validator keys are generated and reshared using distributed key generation (DKG). Chainlink nodes report from the Beacon chain and SSV network to sync balances and rewards, manage collateral recovery, and trigger validator activation, resharing, and exits.

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

## Oracles

The contract uses two oracles to automate the Casimir staking experience and ensure the security of user funds. The upkeep (automation) contract reports total validator balance, swept balance, and validator actions once per day using a [Chainlink Functions](https://docs.chain.link/chainlink-functions) oracle and [Chainlink Automation](https://docs.chain.link/chainlink-automation/introduction). The DAO oracle watches contract events and triggers distributed key generation (DKG) operations.