<img width="50px" alt="Casimir logo" src="common/images/casimir.png">

# Casimir

[![GitHub discussions](https://img.shields.io/github/discussions/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/discussions)
[![GitHub issues](https://img.shields.io/github/issues/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/issues)
[![GitHub milestones](https://img.shields.io/github/milestones/all/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/milestones)
[![Discord](https://img.shields.io/discord/976524855279226880?logo=discord)](https://discord.com/invite/Vy2b3gSZx8)

> Decentralized staking and asset management

## About

Casimir is a complete platform that allows users to monitor, move, and stake their assets while holding their own keys. With Casimir staking, users can easily and securely move funds in and out of decentralized staking pools that are operated by high-performing validators.

## 💻 Development

Get started contributing to Casimir's codebase.

### Prerequisites

Make sure your development environment has these prerequisites.

1. [Docker (v4.x)](https://docs.docker.com/engine/install/).

2. [Git (v2.x)](https://git-scm.com/downloads). You also need to make sure to have at least one SSH authentication key on your GitHub account (for the git cloning of submodules in various scripts). See [Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

3. [Go (v1.18.x)](https://golang.org/doc/install).

4. [Node.js (v18.x)](https://nodejs.org/en/download/).

5. (**Consensus Networks team only**) [AWS CLI (v2.x)](https://aws.amazon.com/cli/) – create an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) named `consensus-networks-dev`.

### Setup

Clone the repository and checkout a new branch from develop, and install all workspace dependencies.

```zsh
git clone https://github.com/consensusnetworks/casimir.git
cd casimir
git checkout -b feature/stake-button develop
```

### Install

We are using [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) to simplify monorepo development workflows while keeping project-wide resources accessible. The core commands are below.

Install all monorepo dependencies. The postinstall script will also build all contract types.

```zsh
npm install
```

Additional install commands:

Clean all monorepo dependencies (remove all `node_modules` and `package-lock.json` before a fresh install).

```zsh
npm run clean
```

Install a project-wide dev dependency.

```zsh
npm install -D some-dev-dependency
```

Install a workspace dependency or dev dependency.

```zsh
npm install some-dependency --workspace @casimir/workspace-name # i.e. @casimir/web
# or
npm install -D some-dev-dependency --workspace @casimir/workspace-name
```

### Environment

Customize and override the defaults for your *local development environment* by creating a [.env](.env) file in the project root and adding values for any supported variables. Variable usage is explained more as needed in the sections below.

**If you are on the Consensus Networks team**, make sure your AWS CLI and profile are configured correctly. By default, the scripts look for the `consensus-networks-dev` named profile, but you can override the `AWS_PROFILE` name to be used in the [.env](.env) file. Regardless, the profile must have access to the `consensus-networks-dev` account resources.

**If you are outside of the Consensus Networks team**, make sure to set `USE_SECRETS` to `false` and provide a valid `ETHEREUM_FORK_RPC_URL`.

#### Supported Variables

| Name | Description | Default |
| --- | --- | --- |
| `USE_SECRETS` | Whether to use AWS Secrets Manager | `true` |
| `AWS_PROFILE` | AWS profile name for accessing secrets | `consensus-networks-dev` |
| `PROJECT` | Project name | `casimir` |
| `STAGE` | Environment stage name | `dev` |
| `ETHEREUM_FORK_RPC_URL` | RPC URL for local fork network | `https://eth-goerli.alchemyapi.io/v2/<AWS-retrieved-secret-key>` |
| `ETHEREUM_FORK_BLOCK` | Starting block number for local fork network | `` |
| `ETHEREUM_RPC_URL` | Ethereum RPC URL for live network | `` |
| `NETWORK` | Mainnet, testnet, or devnet for live network | `` |
| `FORK` | Mainnet, testnet, or devnet for local fork network | `testnet` |
| `MANAGER_ADDRESS` | Manager contract address | `` |
| `VIEWS_ADDRESS` | Views contract address | `` |
| `CRYPTO_COMPARE_API_KEY` | CryptoCompare API key | `` |
| `TUNNEL` | Whether to tunnel local network RPC URLs (for remote wallets) | `false` |
| `EMULATE` | Whether to emulate wallets | `false` |
| `LEDGER_APP` | Ledger app name | `ethereum` |
| `MOCK_ORACLE` | Whether to mock oracle | `true` |
| `MOCK_SERVICES` | Whether to mock backend services | `true` |
| `BUILD_PREVIEW` | Whether to preview web app production build | `false` |
| `VALIDATOR_COUNT` | Number of validators to generate for tests | `4` |

### Apps

The apps packages provide a vite server, and the accompanying scripts set up the chain networks, backend services, and deployed contracts as needed.

Run the web app (with accompanying scripts) from the root directory.

```zsh
npm run dev
```

Run the landing (page) app from the root directory.

```zsh
npm run dev:landing
```

**Additional configuration:**

- Set `EMULATE` to `true` to emulate Ledger and Trezor hardware wallets.
- Set `LEDGER_APP` to the name of the Ledger app to emulate (defaults to `ethereum`).
- Set `TUNNEL` to `true` to tunnel the local network RPC URLs (for remote wallets).
- Set `MOCK_ORACLE` to `false` to use pregenerated validators (or create them if unavailable).
- Set `MOCK_SERVICES` to `false` to use the deployed backend services for the current stage.
- Set `BUILD_PREVIEW` to `true` to run the local script with a production build preview of the web app.
- Set `VALIDATOR_COUNT` to the number of validators to generate for tests (defaults to `4`).

### Contracts

Ethereum contracts are configured with a Hardhat development environment in the [contracts/ethereum/hardhat.config.ts](contracts/ethereum/hardhat.config.ts) file. Read more about `@casimir/ethereum` staking [here](contracts/ethereum/README.md). Below are some helpful commands for developing on or with the contracts.

Run all contract tests.

```zsh
npm run test:ethereum
```

Build the contracts in [contracts/ssv](contracts/ssv).

```zsh
npm run build --workspace @casimir/ethereum
```

Run a local Ethereum network with deployed contracts, simulation scripts, and archived data from Goerli testnet.

```zsh
npm run dev:ethereum
```

**Additional configuration:**

- Set `MOCK_ORACLE` to `false` to use pregenerated validators (or create them if unavailable).
- Set `VALIDATOR_COUNT` to the number of validators to generate for tests (defaults to `4`).

### Emulators

We can emulate Ledger and Trezor hardware wallet wallets by setting the environment variable `EMULATE` to `true`. For Ledger, the default app is `ethereum`, but the app can be specified by setting the environment variable `LEDGER_APP`. For Trezor, we also need to make sure to add [these prerequisites](https://github.com/trezor/trezor-user-env#prerequisites).

> 🚩 On MacOS, if you get an error because port 5000 is in use, go to  > System Preferences... > Sharing and uncheck Airplay Receiver.

## 📊 Data

Data schemas, data operations/workflows, and analytics and ML notebooks are stored in the [common/data] directory (also namespaced as the @casimir/data npm workspace). See the [@casimir/data README](common/data/README.md) for detailed usage instructions.

## Layout

Code is organized into work directories (apps, common, contracts, infrastructure, services, scripts, and more listed below).

```tree
├── .github/ (workflows and issue templates)
|   └── workflows/ (gh actions workflows)
├── apps/ (frontend apps)
|   |── landing/ (landing page app)
|   └── web/ (main web app)
├── common/ (shared code)
|   └── helpers/ (general utilities)
├── contracts/ (blockchain contracts)
|   └── ethereum/ (ethereum contracts)
├── infrastructure/ (deployment resources)
|   └── cdk/ (aws stacks)
├── scripts/ (devops and build scripts)
|   └── local/ (mock and serve tasks)
├── services/ (backend services)
|   └── users/ (users express api)
└── package.json (project-wide npm dependencies and scripts)
```

## Editor

Feel free to use any editor, but here's a configuration that works with this codebase.

1. [VSCode](https://code.visualstudio.com/) – you could also use another editor, but this helps us guarantee linter/formatter features.

2. [Volar VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar) – Vue 3 language support (turn off vetur and ts/js language features if you have problems arising from conflicts).

3. [Eslint VSCode Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) – linter and formatter.

## License

This respository is available as open source under the terms of the [Apache License](https://opensource.org/licenses/Apache).

[![License: Apache](https://img.shields.io/badge/License-Apache-green.svg)](LICENSE.md)
