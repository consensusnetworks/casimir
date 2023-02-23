# Casimir Nodes

Nodes and RPC/WS APIs

## Execution Clients

Until we add rate limiting, RPC/WS API access should be restricted to @consensusnetworks and any trusted parties issued API password secrets. See [API Configuration](#api-configuration) to set up an API URL and restrict access with a password.

| Currency | Network | Protocols | Client | Mode | Config |
| - | - | - | - | - | - |
| ETH | mainnet | rpc, ws | Erigon | archive | [ledgerwatch/erigon compose](https://github.com/ledgerwatch/erigon/blob/devel/docker-compose.yml) |
| ETH | goerli | rpc, ws | Geth | full | [eth-educators/eth-docker compose](https://github.com/eth-educators/eth-docker) |

## API Configuration

We use [nginx](https://www.nginx.com/) to proxy requests to the Ethereum clients. The nginx configuration is stored in [nginx.conf](services/ethereum/nginx.conf). This let's us open up port 80 to http requests, restricts access to the API with a username and password, while keeping the RPC/WS ports firewalled from the public internet. The nginx configuration is mounted into the nginx container at `/etc/nginx/nginx.conf`. Note, we must map the RPC/WS ports to the host machine (make sure they are mapped to 0.0.0.0, which docker-compose will do by default when port mapping) so that nginx can proxy requests to the Ethereum clients.

To generate a password file, we use the [htpasswd](https://httpd.apache.org/docs/2.4/programs/htpasswd.html) utility. The password file is mounted into the nginx container at `/etc/nginx/.htpasswd`.

```bash
# Generate a password file
htpasswd -c .htpasswd <username>
```

This will prompt you for a password. The password file (which only stores the username and a hash of the password) will be stored in the current directory.

We mount the password file into the nginx container at `/etc/nginx/.htpasswd`.

To start the nginx container, run:

```bash
docker-compose up -d nginx
```

## API Usage

Now Casimir developers can access node clients via descriptive URLs like <http://{username}:{password}@nodes.casimir.co/eth/mainnet/rpc>. We have injected these into Casimir development workflows using secrets.
