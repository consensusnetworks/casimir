# Casimir Data

JSON Schemas and Jupyter Notebooks for Casimir data modeling, exploration, and analytics

## JSON Schemas

Find the `event` table schema in [src/schemas/event.schema.json](src/schemas/event.schema.json) and the `agg` table schema in [src/schemas/agg.schema.json](src/schemas/agg.schema.json).

### Making Changes

The JSON Schemas in [src/schemas](src/schemas/) are the source of truth for the data model. When we deploy our Glue tables, we use the JSON Schemas to generate the Glue columns. To make a schema change, create a branch from `develop`, edit the JSON, and then make a PR to `develop`.

> 🚩 Schema versioning is coming soon.

## Notebooks

The Jupyter Notebooks in [notebooks/](notebooks/) are a supplement for data work, including a documented Athena query sandbox, system diagrams, and flowcharts.

### Setup

With VSCode, we have a one-time setup.

1. Install Poetry
2. Install Jupyter extension
3. Run the following **in this directory** (`cd common/data`):

    ```zsh
    poetry install
    poetry run ipython kernel install --user --name=casimir-data
    ```

4. Restart VSCode

5. Open one of the notebooks in the `notebooks/` directory and select the casimir-data kernel in the top right

Now you can run cells in the notebooks upon returning to this workspace in VSCode.
