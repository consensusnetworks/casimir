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

Casimir is an early work-in-progress – we will share more information in the initial version of our [website](apps/website/). In the meantime, feel free to join @ [💬 Casimir Discord](https://discord.com/invite/Vy2b3gSZx8) if you want to say hello and discuss the project.

## 💻 Development

Get started contributing to Casimir.

### Prerequisites

Make sure your development environment has these prerequisites.

1. [Node.js (v16.x)](https://nodejs.org/en/download/) – we use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

2. [AWS CLI (v2.x)](https://aws.amazon.com/cli/) – create an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) named `consensus-networks-dev`.

3. [SAM CLI (v1.x)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-mac.html) - tool for mocking backend services locally.

### Setup

Clone the repository, checkout a new branch from develop, and install all dependencies.

```zsh
git clone https://github.com/consensusnetworks/casimir.git
cd casimir
git checkout -b feature/stake-button develop
npm install
```

> 🚩 This will install all workspace dependencies for this monorepo.

### Serve

You can get up and running without configuration. You can also mock local backend changes and customize your environment.

1. For frontend changes – run the development server and use the `dev` stage backend services.

    ```zsh
    npm run dev
    ```

    > 🚩 This will also preconfigure the application environment with the AWS credentials for the `consensus-networks-dev` profile (set PROFILE="some-other-name" in .env if you want to override).

2. For fullstack changes – run the development server and mock the local backend services.

    ```zsh
    npm run dev --mock
    ```

    > 🚩 You will need the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-mac.html) for local mocking.

3. Optionally customize and override the defaults for your *local development environment* by creating a `.env` file in the project root and adding values for common variables.

    ```zsh
    # Override AWS profile name (defaults to "consensus-networks-dev")
    PROFILE="some-other-aws-name"
    # Override the environment stage name (defaults to "dev")
    STAGE="sandbox"
    ```

## Layout

Code is organized into work directories (apps, services, infrastructure, etc.) Individual packages are managed from the project root with [workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces). 

```tree
├── .github/ (workflows and issue templates)
|   └── workflows/ (gh actions workflows)
├── apps/ (frontend apps)
|   └── website/ (main web app)
├── infrastructure/ (deployment resources)
|   └── cdk/ (aws stacks)
├── common/ (shared code)
|   └── lib/ (general utilities)
├── content/ (static code and text)
|   └── emails/ (pinpoint templates)
├── scripts/ (devops and build scripts)
|   └── local/ (mock and serve tasks)
├── services/ (backend services)
|   └── users/ (users lambda api)
└── package.json (project npm scripts)
```

> 🚩 While developing, most likely, you shouldn't have to change into any subdirectories to run commands.

## Editor

Feel free to use any editor, but here's a configuration that works with this codebase.

1. [VSCode](https://code.visualstudio.com/) – you could also use another editor, but this helps us guarantee linter/formatter features.

2. [Volar VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar) – Vue 3 language support (turn off vetur and ts/js language features if you have problems arising from conflicts).

3. [Eslint VSCode Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) – linter and formatter.

## License

This respository is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

