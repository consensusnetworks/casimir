# Casimir

[![GitHub discussions](https://consensusnetworks-shields.herokuapp.com/github/discussions/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/discussions)
[![GitHub issues](https://consensusnetworks-shields.herokuapp.com/github/issues/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/issues)
[![GitHub milestones](https://consensusnetworks-shields.herokuapp.com/github/milestones/all/consensusnetworks/casimir)](https://github.com/consensusnetworks/casimir/milestones)
[![Discord](https://consensusnetworks-shields.herokuapp.com/discord/976524855279226880?logo=discord)](https://discord.com/invite/Vy2b3gSZx8)

![Casimir text logo](https://user-images.githubusercontent.com/32200924/169926563-5a12f3c0-de02-417c-97b0-e4d7e2cc2024.svg)

## About

Casimir is an all-in-one platform that allows users to trade, stake and track their assets while holding their own keys. One of Casimir's primary objectives is to reward crypto users for directly participating-in and strengthening the networks they rely on – by helping them stake directly to the most reliable (big and small) validators on PoS networks.

See ongoing tasks @ [📋 Casimir Project](https://github.com/orgs/consensusnetworks/projects/9/views/1).

See the supporting infrastructure and contracts @ [💎 Ethereum Stack](https://github.com/consensusnetworks/ethereum-stack) and [🪐 IoTeX Stack](https://github.com/consensusnetworks/iotex-stack) (more networks to come).

## Status

Casimir is an early work-in-progress – we will share more of the codebase shortly. In the meantime, we linked an internal design resource below to show what's coming. Feel free to join @ [💬 Casimir Discord](https://discord.com/invite/Vy2b3gSZx8) if you want to say hello and discuss the project.

### Design

Visit the design walk-through @ [🎨 Casimir Figma](https://www.figma.com/proto/nJmTNPoWNuhEX0lS1FIIPQ/Casimir?node-id=427%3A29434&scaling=min-zoom&starting-point-node-id=427%3A29490) (screenshot below).

| [![Design walk-through](https://user-images.githubusercontent.com/32200924/169935678-7695b4dd-b186-459c-9823-7bdce8cc7ebb.png)](https://www.figma.com/proto/nJmTNPoWNuhEX0lS1FIIPQ/Casimir?node-id=427%3A29434&scaling=min-zoom&starting-point-node-id=427%3A29490) |
| :--: |
| Walk-through screenshot – click to launch the full view in Figma |

## Setup

Get started contributing to Casimir.

### Prerequisites

Make sure your development environment has the necessary prerequisites.

1. [Node.js (v16.x)](https://nodejs.org/en/download/) – we use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

2. [VSCode](https://code.visualstudio.com/) – you could also use another editor, but this helps us guarantee linter/formatter features.

3. [Volar VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar) – Vue 3 language support (turn off vetur and ts/js language features if you have problems arising from conflicts).

4. [Eslint VSCode Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) – linter and formatter.

*Note: AWS credentials usage is not yet set up, but we will require the AWS CLI when it is.*

*5. [AWS CLI](https://aws.amazon.com/cli/) – create an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) named `consensus-networks-dev`.*

### Install

Clone the repository, checkout a new branch from develop, and install all dependencies.

```zsh
git clone https://github.com/consensusnetworks/casimir.git
cd casimir
git checkout -b feature/stake-button develop
npm install
```

> This will install all workspace dependencies for this monorepo.

## 💻 Development

Run the development server for the default application ([apps/website](apps/website/) in this case) and backend services.

```zsh
npm run dev
```

> This will also preconfigure the application environment with the AWS credentials for the `consensus-networks-dev` profile.

## License

This respository is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

