# Casimir Ethereum

Ethereum nodes and RPC/WS APIs

## Execution Clients

Until we add rate limiting, RPC/WS API access should be restricted to @consensusnetworks and any trusted parties issued API password secrets. See [API Configuration](#api-configuration) to set up an API URL and restrict access with a password.

| Client | Network | Mode | Setup |
| - | - | - | - |
| Erigon | mainnet | archive | [thorax/erigon compose](https://hub.docker.com/r/thorax/erigon#run-all-components-by-docker-compose) | `casomir-mainnet-rpc` | `casimir-mainnet-ws` |
| Geth | goerli | full | [eth-docker compose](https://github.com/eth-educators/eth-docker) | `casimir-goerli-rpc` | `casimir-goerli-ws` |

## API Configuration

To add a private API subdomain or route to the Casimir API, we need to create a password and set up basic auth to restrict access.

> 🚧 Todo add Docker setup and more context around the [NGINX configuration here](nginx.conf).
