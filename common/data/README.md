# Casimir Data

Casimir schemas, databases, and notebooks for data modeling, exploration, and analytics

## Schemas

Find the core JSON schemas in [src/schemas](src/schemas). These are the source of truth for data modeling in Casimir. When we deploy our [Glue](https://docs.aws.amazon.com/glue/latest/dg/define-database.html) and [Postgres](https://www.postgresql.org/docs/) databases, we use the schemas to generate Glue columns or Postgres tables from each JSON object's properties. See the reference table below for the database, table, file, and description of each schema.

| Database | Table | Schema | Description |
| --- | --- | --- | --- |
| Analytics (Glue) | `events` | [event.schema.json](src/schemas/event.schema.json) | All events |
| Analytics (Glue) | `staking_actions` | [staking_action.schema.json](src/schemas/staking_action.schema.json) | Staking action event transforms |
| Analytics (Glue) | `wallets` | [wallets.schema.json](src/schemas/wallets.schema.json) | Wallet event transforms |
| Users (Postgres) | `accounts` | [account.schema.json](src/schemas/account.schema.json) | User accounts |
| Users (Postgres) | `nonces` | [nonce.schema.json](src/schemas/nonce.schema.json) | User auth nonces |
| Users (Postgres) | `users` | [user.schema.json](src/schemas/user.schema.json) | User profiles |
| Users (Postgres) | `user_accounts` | [user_account.schema.json](src/schemas/user_account.schema.json) | User account relations |

## Notebooks

The Jupyter Notebooks in [notebooks/](notebooks/) are a supplement for data work, including a documented Athena query sandbox, system diagrams, and flowcharts.

### Prerequisites

Make sure your development environment has these prerequisites.

1. [Python (v3.x)](https://www.python.org/downloads/) – we use [pyenv](https://github.com/pyenv/pyenv#installation) to manage Python versions.

2. [Poetry](https://python-poetry.org/docs/#installation) – this manages and packages Python dependencies.

3. [AWS CLI (v2.x)](https://aws.amazon.com/cli/) – create an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) named `consensus-networks-dev`.

4. [Jupyter VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) – this gives us a complete Jupyter Notebook environment in VSCode.

### Setup

With the Poetry and the Jupyter VSCode Extension, we have a one-time setup.

1. Install dependencies and create a Jupyter kernel.

    ```zsh
    cd common/data
    poetry install
    poetry run ipython kernel install --user --name=casimir-data
    ```

    > 🚩 If you have node and npm already set up for this repo, you can run `npm run python --workspace @casimir/data` from the root directory instead.

2. Restart VSCode (Jupyter needs this to see your new kernel).

3. Open one of the notebooks in `notebooks/` and select the kernel dropdown in the top right – choose the option with casimir-data in the name.

Now you can run cells in the notebooks upon returning to this workspace in VSCode.

> 🚩 To change Python dependencies for the notebook environment, change into this directory (`cd common/data`) and use the poetry CLI `poetry add <package>` or `poetry remove <package>`.
