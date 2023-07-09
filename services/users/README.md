# @casimir/users

Casimir users service

## Development

You can run a local users database and service for development and testing. Database schema changes are auto-synced from the JSON schemas in [src/schemas](src/schemas), and the service is auto-reloaded on source code changes.

```zsh
npm run watch --workspace @casimir/users
```

**Example commands:**

Run a local users database and service with the *current schemas and source code*.

```zsh
npm run dev --workspace @casimir/users
```

Run a local users database and service and *watch for changes*.

```zsh
npm run watch --workspace @casimir/users
```

Clean local Docker Postgres environment, sql, and pgdata.

```zsh
npm run clean --workspace @casimir/users
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
