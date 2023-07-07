<img width="50px" alt="Casimir logo" src="common/images/casimir.png">

# Casimir

[![GitHub discussions](https://img.shields.io/github/discussions/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/discussions)
[![GitHub issues](https://img.shields.io/github/issues/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/issues)
[![GitHub milestones](https://img.shields.io/github/milestones/all/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/milestones)
[![Discord](https://img.shields.io/discord/976524855279226880?logo=discord)](https://discord.com/invite/Vy2b3gSZx8)

> Decentralized staking and asset management

## About

Casimir is a complete platform that allows users to monitor, move, and stake their assets while holding their own keys. With Casimir staking, users can easily and securely move funds in and out of decentralized staking pools that are operated by high-performing validators.

## Status

Casimir is an early work-in-progress – check out [our website](https://casimir.co) for more information about what we're building. See ongoing tasks on our [project board](https://github.com/orgs/consensusnetworks/projects/9/views/1).

Also, feel free to join our [discord server](https://discord.com/invite/Vy2b3gSZx8) if you want to say hello and discuss the project.

## 💻 Development

Get started contributing to Casimir's codebase.

### Prerequisites

Make sure your development environment has these prerequisites.

1. [AWS CLI (v2.x)](https://aws.amazon.com/cli/) – create an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) named `consensus-networks-dev`.

2. [Docker (v4.x)](https://docs.docker.com/engine/install/) - make sure your Docker runs on startup.

3. [Git (v2.x)](https://git-scm.com/downloads) – we use [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) to manage shared code.

4. [Go (v1.18.x)](https://golang.org/doc/install) – we use [Go modules](https://blog.golang.org/using-go-modules) to manage Go dependencies.

5. [Node.js (v18.x)](https://nodejs.org/en/download/) – we use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

> 🚩 You also need to make sure to have at least one SSH authentication key on your GitHub account (for the git cloning of submodules in various scripts). See [Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

### Setup

Clone the repository, checkout a new branch from develop, and install all workspace dependencies.

```zsh
git clone https://github.com/consensusnetworks/casimir.git
cd casimir
git checkout -b feature/stake-button develop
npm install
```

> 🚩 'All workspace dependencies' includes `package.json` dependencies listed in the project root and any workspace subdirectories. See [Scripts and dependencies](#scripts-and-dependencies).

### Serve

You can get up and running without configuration. You can also mock local backend changes and customize your environment.

For frontend changes – run the web app development server, local Ethereum network, and mock backend services.

```zsh
npm run dev
```

> 🚩 This will also preconfigure the application environment with the AWS credentials for the `consensus-networks-dev` profile (set AWS_PROFILE="some-other-name" in a [.env](.env) if you want to override).

```zsh
# @casimir/web
npm run dev # or
npm run dev:web

# @casimir/landing
npm run dev:landing
```

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

Deploy a contract, specifically [contracts/ethereum/src/CasimirManager.sol](contracts/ethereum/src/CasimirManager.sol) with [contracts/ethereum/scripts/ssv.deploy.ts](contracts/ethereum/deploy/ssv.deploy.ts).

```zsh
npm run deploy:ssv --workspace @casimir/ethereum
```

### Local Ethereum network

Run a local Ethereum network with archived data from Goerli testnet.

```zsh
npm run dev:ethereum
```

> 🚩 Note, while the fork starts with the same state as the specified network, it lives as a local development network independent of the live network.

### Emulators

We can emulate Ledger and Trezor hardware wallet wallets by setting the environment variable `EMULATE` to `true`. For Ledger, the default app is `ethereum`, but the app can be specified by setting the environment variable `LEDGER_APP`. For Trezor, we also need to make sure to add [these prerequisites](https://github.com/trezor/trezor-user-env#prerequisites).

> 🚩 On MacOS, if you get an error because port 5000 is in use, go to  > System Preferences... > Sharing and uncheck Airplay Receiver.

### Environment

Optionally customize and override the defaults for your *local development environment* by creating a [.env](.env) file in the project root and adding values for any supported variables.

#### Supported Variables

| Name | Description | Default |
| --- | --- | --- |
| `USE_SECRETS` | Whether to use AWS Secrets Manager | `true` |
| `AWS_PROFILE` | AWS profile name for accessing secrets | `consensus-networks-dev` |
| `PROJECT` | Project name | `casimir` |
| `STAGE` | Environment stage name | `dev` |
| `ETHEREUM_RPC_URL` | Ethereum RPC URL | `http://127.0.0.1:8545` |
| `NETWORK` | Set live network (defaults to local fork network) | `` |
| `FORK` | Local fork network | `testnet` |
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

### Scripts and dependencies

We are using [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) to simplify monorepo development workflows while keeping project-wide resources accessible. The core commands are below.

Install all monorepo dependencies.

```zsh
npm install
```

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

## 📊 Data

Data schemas, data operations/workflows, and analytics and ML notebooks are stored in the [common/data] directory (also namespaced as the @casimir/data npm workspace). See the [@casimir/data README](common/data/README.md) for detailed usage instructions.

## Layout

Code is organized into work directories (apps, services, infrastructure – and more listed below).

```tree
├── .github/ (workflows and issue templates)
|   └── workflows/ (gh actions workflows)
├── apps/ (frontend apps)
    |── landing/ (landing page app)
|   └── web/ (main web app)
├── infrastructure/ (deployment resources)
|   └── cdk/ (aws stacks)
├── common/ (shared code)
|   └── helpers/ (general utilities)
├── scripts/ (devops and build scripts)
|   └── local/ (mock and serve tasks)
├── services/ (backend services)
|   └── users/ (users express api)
└── package.json (project-wide npm dependencies and scripts)
```

> 🚩 While developing, most likely, you shouldn't have to change into any subdirectories to run commands. Individual **npm packages** (directories with a `package.json`) are managed from the project root with [workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces). See [Scripts and dependencies](#-scripts-and-dependencies).

## Editor

Feel free to use any editor, but here's a configuration that works with this codebase.

1. [VSCode](https://code.visualstudio.com/) – you could also use another editor, but this helps us guarantee linter/formatter features.

2. [Volar VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar) – Vue 3 language support (turn off vetur and ts/js language features if you have problems arising from conflicts).

3. [Eslint VSCode Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) – linter and formatter.

## License

This respository is available as open source under the terms of the [Apache License](https://opensource.org/licenses/Apache).

[![License: Apache](https://img.shields.io/badge/License-Apache-green.svg)](LICENSE.md)
