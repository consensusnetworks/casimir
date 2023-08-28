## Build

Install dependencies

```bash
go mod tidy
```

```bash
make build
```

### Environment

The crawler environment can be specified either by the `--dev` or `--prod` flag.
If neither flag is available, the crawler will try to determine the environment based on the host address of the `ETHEREUM_RPC_URL` environment variable.
It will pick `dev` if host is `127.0.0.1` or `localhost`, otherwise it will pick `prod`.

### Run

Run the crawler locally using a Hardhat network

```bash
go run github.com/consensusnetworks/crawler --dev --fork 
```

Stream

```bash
./build/crawler stream
```


Crawl

```bash
./build/crawler crawl
```