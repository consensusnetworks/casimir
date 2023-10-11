# Casimir Data

Casimir database JSON schemas

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
