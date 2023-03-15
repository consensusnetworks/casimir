# Casimir Data

Casimir schemas, databases, and notebooks for data modeling, exploration, and analytics

## Schemas

Find the core JSON schemas in [src/schemas](src/schemas). These are the source of truth for data modeling in Casimir. When we deploy our [Glue](https://docs.aws.amazon.com/glue/latest/dg/define-database.html) and [Postgres](https://www.postgresql.org/docs/) tables, we use the schemas to generate columns from each JSON object's properties. See the reference table below for the database, table, file, and description of each schema.

| Database | Table | Schema | Description |
| --- | --- | --- | --- |
| Glue | `events` | [event.schema.json](src/schemas/event.schema.json) | On or off-chain event |
| Glue | `aggs` | [agg.schema.json](src/schemas/agg.schema.json) | Aggregate of events |
| Postgres | `accounts` | [account.schema.json](src/schemas/account.schema.json) | Wallet account |
| Postgres | `users` | [user.schema.json](src/schemas/user.schema.json) | User profile |

## Databases

You can run a local Postgres instance for development and testing. This is a convenient way to iterate on schemas and test queries before deploying to production. (Schema reloading is still a work in progress - hopefully bootstrapping Postgres in Docker can be done faster.)

```zsh
npm run dev --workspace @casimir/data
```

**All options:**

| Flag | Description | Default | Example |
| --- | --- | --- | --- |
| `--tables` | Tables to deploy | accounts,users | --tables=accounts,nonces,users |

**Example commands:**

Run a local Postgres instance with the *current schemas*.

```zsh
npm run dev --workspace @casimir/data
```

Run a local Postgres instance and *watch the schemas for changes*.

```zsh
npm run watch --workspace @casimir/data
```

Clean local Docker Postgres environment, sql, and pgdata.

```zsh
npm run clean --workspace @casimir/data
```

### PSQL

Query the local Postgres instance.

```sql
"Add a user"

INSERT INTO users (address) VALUES ('0xd557a5745d4560B24D36A68b52351ffF9c86A212');

"Add an account (with the same address as the user)"

INSERT INTO accounts (address, owner_address) VALUES ('0xd557a5745d4560B24D36A68b52351ffF9c86A212', '0xd557a5745d4560B24D36A68b52351ffF9c86A212');

"Query the user"

SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN accounts a ON u.address = a.owner_address WHERE u.address = '0xd557a5745d4560B24D36A68b52351ffF9c86A212' GROUP BY u.address;

```

> 🚩 To iterate on a schema in context, use the commands above. To deploy a schema change, create a branch from `develop`, edit the JSON, and then make a PR to `develop`.

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

    > 🚩 If you have node and npm already set up for this repo, you can run `npm run configure:python --workspace @casimir/data` from the root directory instead.

2. Restart VSCode (Jupyter needs this to see your new kernel).

3. Open one of the notebooks in `notebooks/` and select the kernel dropdown in the top right – choose the option with casimir-data in the name.

Now you can run cells in the notebooks upon returning to this workspace in VSCode.

> 🚩 To change Python dependencies for the notebook environment, change into this directory (`cd common/data`) and use the poetry CLI `poetry add <package>` or `poetry remove <package>`.
