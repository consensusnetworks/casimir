# Casimir Data

JSON Schemas and Jupyter Notebooks for Casimir data modeling, exploration, and analytics

## JSON Schemas

Find the `event` table schema in [src/schemas/event.schema.json](src/schemas/event.schema.json) and the `agg` table schema in [src/schemas/agg.schema.json](src/schemas/agg.schema.json).

### Making Changes

The JSON Schemas in [src/schemas](src/schemas/) are the source of truth for the data model. When we deploy our Glue tables, we use the JSON Schemas to generate the Glue columns. To make a schema change, create a branch from `develop`, edit the JSON, and then make a PR to `develop`.

> 🚩 Schema versioning is coming soon.

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
