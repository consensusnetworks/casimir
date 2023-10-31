::: warning
This page is incomplete.
:::

# Architecture

Todo. Explain stakeholders and their entrypoints. Internal contracts, external contracts, operators, oracles, etc.

## Contracts

Casimir deploys the following contracts:

- A [Casimir factory](#casimir-factory) that configures and deploys staking strategies.
- For each staking strategy:
  - A [Casimir manager](#casimir-manager) that accepts any amount of stake and distributes it to validator pools.
  - A [Casimir registry](#casimir-registry) that registers operators and binds collateral to validators pools. 
  - A [Casimir upkeep](#casimir-upkeep) that automates distributed consensus layer reports.
  - A [Casimir views](#casimir-views) that provides a read-only interface to the strategy.
  - For each validator pool:
    - A [Casimir pool](#casimir-pool) that either serves as the withdrawal address for a validator or provides a proxy to the withdrawal address.
- A [Casimir oracle](#casimir-oracle) that executes operator selection, triggers DKG ceremonies, submits verifiable validator creation, resharing, and exit reports, and allocates reserved operational fees to operators.

As we add new strategies and features leading up to our mainnet release, the contracts will require upgrades. Accordingly, the Casimir factory is deployed as a transparent proxy, while the other contracts are deployed as beacon proxies.

```mermaid
%%{
    init: {
        'theme': 'base',
        'themeVariables': {
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

