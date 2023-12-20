<img width="50px" alt="Casimir logo" src="casimir.png">

# Casimir

[![GitHub discussions](https://img.shields.io/github/discussions/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/discussions)
[![GitHub issues](https://img.shields.io/github/issues/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/issues)
[![GitHub milestones](https://img.shields.io/github/milestones/all/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/milestones)
[![Discord](https://img.shields.io/discord/976524855279226880?logo=discord)](https://discord.com/invite/Vy2b3gSZx8)

> Decentralized staking and asset management

- [About](#about)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Configure](#configure)
    - [Environment Variables](#environment-variables)
  - [Apps](#apps)
    - [@casimir/app](#casimirapp)
    - [@casimir/www](#casimirwww)
  - [Contracts](#contracts)
    - [@casimir/ethereum](#casimirethereum)
  - [Common](#common)
  - [Infrastructure](#infrastructure)
    - [@casimir/cdk](#casimircdk)
  - [Services](#services)
- [Layout](#layout)
- [License](#license)

## About

Casimir is a complete platform that allows users to monitor, move, and stake their assets while holding their own keys. With Casimir staking, users can easily and securely move funds in and out of decentralized staking pools that are operated by high-performing validators.

## Development

Get started contributing to Casimir's codebase.

### Prerequisites

Configure the following prerequisite global dependency versions:

1. [Git (v2.x)](https://git-scm.com/downloads).

    > 🚩 **GitHub submodule support:** You also need to make sure to have at least one SSH authentication key on your GitHub account (for the git cloning of submodules within submodules). See [Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

2. [Docker (v24.x)](https://docs.docker.com/engine/install).

3. [Go (v1.20.x)](https://golang.org/doc/install).

4. [Node.js (LTS)](https://nodejs.org/en/download).

    > 🚩 **Using NVM**: Install [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) and run `nvm install --lts && nvm alias default lts/*` to set the default version to the latest LTS. You will need to rerun this command whenever the latest LTS changes.

5. [Deno (v1.39.x)](https://docs.deno.com/runtime/manual/getting_started/installation).

6. [AWS CLI (v2.x)](https://aws.amazon.com/cli).

    > 🚩 **Consensus Networks team only**: Create an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) named `consensus-networks-dev`.

### Setup

Clone the repository and checkout a new branch from develop:

  ```zsh
  git clone https://github.com/consensusnetworks/casimir.git
  cd casimir
  git checkout -b <"feature || bug || enhancement">/<"your-branch-name" develop
  ```

We are using [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) to simplify monorepo development workflows while keeping project-wide resources accessible. The core commands are below.

Install all repository dependencies and build necessary types:

  ```zsh
  npm install
  ```

Clean all repository dependencies and reinstall:

  ```zsh
  npm run clean
  ```

Install a dev dependency to the root:

  ```zsh
  npm install -D some-dev-dependency
  ```

Install a dependency or dev dependency to a specific workspace:

  ```zsh
  # dependency
  npm install some-dependency --workspace @casimir/<"workspace-name">

  # dev dependency
  npm install -D some-dev-dependency --workspace @casimir/<"workspace-name">
  ```

### Configure

Customize and override the development environment configuration by creating a [.env](.env) file in the root directory.

**If you are on the Consensus Networks organization**, make sure your AWS CLI and profile are configured correctly. By default, the scripts look for the `consensus-networks-dev` named profile, but you can override the `AWS_PROFILE` name to be used in the [.env](.env) file. Optionally, override the `AWS_PROFILE` name in your [.env](.env) file:

  ```zsh
  # From the root directory
  echo "AWS_PROFILE=<"your-aws-profile-name">" > .env
  ```

**If you are outside of the Consensus Networks organization**, set `USE_SECRETS` to `false` in your [.env](.env) file:

  ```zsh
  # From the root directory
  echo "USE_SECRETS=false" > .env
  ```

#### Environment Variables

| Name | Description | Default |
| - | - | - |
| `USE_SECRETS` | Whether to use AWS secrets (set false for external access) | `true` |
| `AWS_PROFILE` | AWS profile name for accessing secrets | `consensus-networks-dev` |
| `PROJECT` | Project name | `casimir` |
| `STAGE` | Environment stage name (`prod || dev || local`) | `local` |
| `ETHEREUM_FORK_BLOCK` | Starting block number for local fork network | (current block) |
| `ETHEREUM_RPC_URL` | Ethereum RPC network URL | `http://127.0.0.1:8545` |
| `NETWORK` | Network name (`mainnet || testnet || hardhat || localhost`) | `localhost` |
| `FORK` | Fork network name (`mainnet || testnet || hardhat`) | `testnet` |
| `FACTORY_ADDRESS` | Base factory contract address | (predicted factory address) |
| `CRYPTO_COMPARE_API_KEY` | CryptoCompare API key | `` |
| `TUNNEL` | Whether to tunnel local network RPC URLs (for remote wallets) | `false` |
| `MOCK_SERVICES` | Whether to mock backend services | `true` |
| `BUILD_PREVIEW` | Whether to preview web app production build | `false` |

### Apps

The apps packages provide a UI to end-users.

#### @casimir/app

Run the main web app with an integrated development environment, including local contracts and services:

  ```zsh
  # From the root directory
  npm run dev
  ```

See the [@casimir/app README.md](apps/app/README.md) for detailed documentation.

#### @casimir/www

Run the landing page app:

  ```zsh
  # From the root directory
  npm run dev:www
  ```

See the [@casimir/www README.md](apps/www/README.md) for detailed documentation.

### Contracts

The contracts packages provide the smart contracts for the project.

#### @casimir/ethereum

Test the Ethereum contracts:

  ```zsh
  # From the root directory
  npm run test --workspace @casimir/ethereum
  ```

See the [@casimir/ethereum README.md](contracts/ethereum/README.md) for detailed documentation.

### Common

The common packages provide shared code for the project:

- [@casimir/aws](common/aws): AWS helpers
- [@casimir/data](common/data): data schemas and operational workflows
- [@casimir/ssv](common/ssv): SSV helpers
- [@casimir/types](common/types): shared types
- [@casimir/uniswap](common/uniswap): Uniswap helpers
- [@casimir/wallets](common/wallets): wallet helpers

Check for a README.md file in each common package directory for detailed usage instructions.

### Infrastructure

The infrastructure packages provide the infrastructure as code for the project.

#### @casimir/cdk

Test the CDK infrastructure:

  ```zsh
  # From the root directory
  npm run test:cdk
  ```

See the [@casimir/cdk README.md](infrastructure/cdk/README.md) for detailed documentation.

### Services

The services packages provide the backend services for the project:

- [@casimir/crawler](services/crawler): analytics crawler
- [@casimir/functions](services/functions): Chainlink Functions source code
- [@casimir/nodes]: relevant node configurations
- [@casimir/oracle](services/oracle): DAO oracle
- [@casimir/users](services/users): users server and database

## Layout

Code is organized into work directories (apps, common, contracts, infrastructure, services, scripts, and more listed below).

```tree
├── .github/ (workflows and issue templates)
|   └── workflows/ (gh actions workflows)
├── apps/ (frontend apps)
|   |── www/ (landing page app)
|   └── app/ (main web app)
├── common/ (shared code)
|   ├── data/ (data schemas and operational workflows)
|   └── helpers/ (general utilities)
├── contracts/ (blockchain contracts)
|   └── ethereum/ (ethereum contracts)
├── infrastructure/ (deployment resources)
|   └── cdk/ (aws stacks)
├── scripts/ (devops and build scripts)
|   ├── ethereum/ (ethereum test and dev scripts)
|   └── root/ (root install and dev scripts)
├── services/ (backend services)
|   ├── oracle/ (oracle service)
|   └── users/ (users service)
└── package.json (project-wide npm dependencies and scripts)
```

## License

This respository is available as open source under the terms of the [Apache License](https://opensource.org/licenses/Apache).

[![License: Apache](https://img.shields.io/badge/License-Apache-green.svg)](LICENSE.md)
