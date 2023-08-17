package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Env string
type EnvVars string

const (
	Dev  Env = "development"
	Prod Env = "production"

	ETHEREUM_RPC_URL    = "ETHEREUM_RPC_URL"
	ETHEREUM_FORK_BLOCK = "ETHEREUM_FORK_BLOCK"
	FORK                = "FORK"
)

type Config struct {
	Chain   ChainType   `json:"chain"`
	Network NetworkType `json:"network"`
	Fork    bool        `json:"fork"`
	URL     *url.URL    `json:"url"`
	// genesis for goerli and mainnet, non-genesis for hardhat
	ForkBlock        uint64 `json:"start_block"`
	User             string `json:"user"`
	Version          int    `json:"version"`
	Start            uint64 `json:"start"`
	End              uint64 `json:"end"`
	BatchSize        uint64 `json:"batch_size"`
	ConcurrencyLimit uint64 `json:"concurrent"`
	Env              Env    `json:"env"`
}

type PackageJSON struct {
	Version string `json:"version"`
}

func ModuleDir() (string, error) {
	wd, err := os.Getwd()

	if err != nil {
		return "", err
	}

	root := wd

	if strings.HasSuffix(wd, "casimir") {
		root = path.Join(wd, "services", "crawler")
	}

	return root, nil
}

func WorkspaceDir() (string, error) {
	wd, err := os.Getwd()

	if err != nil {
		return "", err
	}

	root := wd

	if strings.HasSuffix(wd, "crawler") {
		root = path.Join(wd, "..", "..")
	}

	return root, nil
}

func LoadEnv() (map[EnvVars]string, error) {
	dir, err := ModuleDir()

	if err != nil {
		return nil, err
	}

	err = godotenv.Load(path.Join(dir, ".env"))

	if err != nil {
		return nil, err
	}

	vars := map[EnvVars]string{
		ETHEREUM_RPC_URL:    os.Getenv(ETHEREUM_RPC_URL),
		ETHEREUM_FORK_BLOCK: os.Getenv(ETHEREUM_FORK_BLOCK),
		FORK:                os.Getenv(FORK),
	}

	if vars[ETHEREUM_RPC_URL] == "" {
		return nil, fmt.Errorf("missing env var: %s", ETHEREUM_RPC_URL)
	}

	return vars, nil
}

func GetResourceVersion() (int, error) {
	workspaceDir, err := WorkspaceDir()

	if err != nil {
		return 0, err
	}

	file, err := os.ReadFile(path.Join(workspaceDir, "common", "data", "package.json"))

	if err != nil {
		return 0, err
	}

	var pkg PackageJSON

	err = json.Unmarshal(file, &pkg)

	if err != nil {
		return 0, err
	}

	var major int

	semver := strings.Split(pkg.Version, ".")

	if len(semver) < 3 {
		return 0, errors.New("InvalidSemver: must be in format major.minor.patch")
	}

	major, err = strconv.Atoi(semver[0])

	if err != nil {
		return 0, errors.New("InvalidSemver: major version must be an integer")
	}

	return major, nil
}

func GetContractBuildArtifact() ([]byte, error) {
	wsd, err := WorkspaceDir()

	if err != nil {
		return nil, err
	}

	buildPath := path.Join(wsd, "contracts", "ethereum", "build", "artifacts", "src", "v1")

	_, err = os.Stat(buildPath)

	if err != nil {
		return nil, err
	}

	if os.IsNotExist(err) {
		return nil, errors.New("build artifacts not found")
	}

	casimirManagerPath := path.Join(buildPath, "CasimirManager.sol", "CasimirManager.json")

	casimirManagerFile, err := os.ReadFile(casimirManagerPath)

	if err != nil {
		return nil, err
	}

	return casimirManagerFile, nil
}

// func LoadConfig(ctx *cli.Context) (*Config, error) {
// 	user, err := os.UserHomeDir()

// 	if err != nil {
// 		return nil, err
// 	}

// 	vars, err := LoadEnv()

// 	if err != nil {
// 		return nil, err
// 	}

// 	raw := vars[EthereumRPCURL]

// 	rpcURL, err := url.Parse(raw)

// 	if err != nil {
// 		return nil, err
// 	}

// 	config := Config{
// 		Chain:      Ethereum,
// 		Network:    EthereumGoerli,
// 		Env:        Dev,
// 		URL:        rpcURL,
// 		BatchSize:  250_000,
// 		Concurrent: 10,
// 		User:       strings.ToLower(user.Username),
// 		Fork:       c.Bool("fork"),
// 	}
// }
