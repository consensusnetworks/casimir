# Casimir Data

JSON Schemas and Jupyter Notebooks for Casimir data modeling, exploration, and analytics

## Database Schemas

Find the core JSON object schemas in [src/schemas/](src/schemas/). These are the source of truth for data modeling in Casimir. When we deploy our Glue and Postgres tables, we use the schemas to generate columns from the object properties. See the reference tables below (one for Glue, and one for Postgres) for descriptions and links to the current schemas.

> 🚩 To make a schema change, create a branch from `develop`, edit the JSON, and then make a PR to `develop`.

### Glue

| Table | Schema | Description |
| --- | --- | --- |
| `events` | [event.schema.json](src/schemas/event.schema.json) | on or off-chain event |
| `aggs` | [agg.schema.json](src/schemas/agg.schema.json) | aggregate of events |

### Postgres

| Table | Schema | Description |
| --- | --- | --- |
| `accounts` | [account.schema.json](src/schemas/account.schema.json) | wallet account |
| `users` | [user.schema.json](src/schemas/user.schema.json) | user profile |

Run a local Postgres instance with the schemas above.

```zsh
npm run dev:postgres --workspace @casimir/data
```

Run and watch a local Postgres instance.

```zsh
npm run watch:postgres --workspace @casimir/data
```

Query the local Postgres instance.

```sql
"Add a user"

INSERT INTO users (address) VALUES ('0xd557a5745d4560B24D36A68b52351ffF9c86A212');

"Add an account (with the same address as the user)"

INSERT INTO accounts (address, owner_address) VALUES ('0xd557a5745d4560B24D36A68b52351ffF9c86A212', '0xd557a5745d4560B24D36A68b52351ffF9c86A212');

"Query the user"

SELECT u.*, json_agg(a.*) AS accounts FROM users u JOIN accounts a ON u.address = a.owner_address WHERE u.address = '0xd557a5745d4560B24D36A68b52351ffF9c86A212' GROUP BY u.address;

```

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
