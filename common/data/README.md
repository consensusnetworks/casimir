# Casimir Data

JSON Schemas and Jupyter Notebooks for Casimir data modeling, exploration, and analytics

## JSON Schemas

Find the `event` table schema in [src/schemas/event.schema.json](src/schemas/event.schema.json) and the `agg` table schema in [src/schemas/agg.schema.json](src/schemas/agg.schema.json).

### Making Changes

The JSON Schemas are the source of truth for the data model. When we deploy our Glue tables, we use the JSON Schemas to generate the Glue columns.


