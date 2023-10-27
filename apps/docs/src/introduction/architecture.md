::: warning
This page is incomplete.
:::

# Architecture

The Casimir staking architecture consists of the following components:

- An [Ethereum RPC Node](#ethereum-rpc-node) that connects the SSV DVT node to the Ethereum network.
- An [SSV Node](#ssv-node) that performs cluster duties for validators.
- An [SSV DKG server](#ssv-dkg-server) that participates in key generation and resharing ceremonies.

```mermaid
%%{
    init: {
        'theme': 'base',
        'themeVariables': {
            'fontFamily': 'Inter',
            'lineColor': '#E2E2E3',
            'primaryColor': '#F6F6F7',
            'primaryTextColor': '#3C3C43',
            'primaryBorderColor': '#E2E2E3',
            'secondaryColor': '#3C3C43',
            'tertiaryColor': '#FFFFFF'
        }
    }
}%%
graph TB
    %% CasimirFactory to UpgradeableBeacons Subgraph
    CasimirFactory -.-> UpgradeableBeacons

    %% Subgraphs for UpgradeableBeacons
    subgraph UpgradeableBeacons[Upgradeable Beacons]
        CasimirManagerBeacon -.- CasimirRegistryBeacon
        CasimirRegistryBeacon -.- CasimirUpkeepBeacon
        CasimirUpkeepBeacon -.- CasimirViewsBeacon
    end

    %% UpgradeableBeacons Subgraph to Strategies Subgraphs
    UpgradeableBeacons -.-> BaseStrategy
    UpgradeableBeacons -.-> EigenLayerStrategy

    %% Subgraphs for Strategies
    subgraph BaseStrategy[Base Strategy]
        BaseCasimirManager(CasimirManager) -.- BaseCasimirRegistry(CasimirRegistry) -.- BaseCasimirUpkeep(CasimirUpkeep) -.- BaseCasimirViews(CasimirViews)
    end
    subgraph EigenLayerStrategy[EigenLayer Strategy]
        EigenLayerCasimirManager(CasimirManager) -.- EigenLayerCasimirRegistry(CasimirRegistry) -.- EigenLayerCasimirUpkeep(CasimirUpkeep) -.- EigenLayerCasimirViews(CasimirViews)
    end

    %% Strategies Subgraphs to Pools Subgraphs
    BaseStrategy -.-> BasePools
    EigenLayerStrategy -.-> EigenLayerPools

    %% Subgraphs for Pools
    subgraph BasePools[Base Pools]
    BasePool1(CasimirPool) -.- BasePool2(CasimirPool) -.- BasePool3(CasimirPool) -.- BasePool4(CasimirPool) -.- BasePoolN(...)
    end
    subgraph EigenLayerPools[EigenLayer Pools]
        EigenLayerPool1(CasimirPool) -.- EigenLayerPool2(CasimirPool) -.- EigenLayerPool3(CasimirPool) -.- EigenLayerPool4(CasimirPool) -.- EigenLayerPoolN(...)
    end
```

<!-- The Casimir staking system consists of the following components:

- A [factory contract](#factory-contract) that manages the creation of [staking strategies](#staking-strategies), each with a distinct [manager contract](#manager-contract), [registry contract](#registry-contract), [upkeep contract](#upkeep-contract), and [views contract](#views-contract).
-  -->
