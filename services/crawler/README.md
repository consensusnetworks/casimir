# @casimir/crawler

Identify, structure and stream [@casimir/data events](common/data/src/schemas/event.schema.json) to s3.

> 🚩 Run all commands from the monorepo root.

## Development

Run the crawler with default chains and mainnet networks.

```zsh
npm run dev:crawler # --upload=false disables s3 upload
```

**Available flags:**

These flags modify the CHAINS, FORK, NETWORK, UPLOAD AND PUBLIC_${CHAIN}_RPC environment variables.

| Name | Description | Default |
| - | - | - |
| --chains | Comma-separated list of chains | ethereum |
| --fork | Network state to fork | mainnet |
| --network | Network to query | mainnet |
| --upload | Whether to upload to s3 | true |

> Use an equals sign to set flags to variables, like `--upload=false`.

## Testing

Test the crawler with [./test](./test/) files.

```zsh
npm run test:crawler
```