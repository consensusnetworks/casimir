package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/user"
	"path"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

type Env int

const (
	Dev Env = iota
	Prod
)

type Config struct {
	Chain            Chain    `json:"chain"`
	Network          Network  `json:"network"`
	URL              *url.URL `json:"url"`
	User             string   `json:"user"`
	BatchSize        uint64   `json:"batch_size"`
	ConcurrencyLimit uint64   `json:"concurrent"`
	Env              Env      `json:"env"`
	Stream           bool     `json:"stream"`
}

type PkgJSON struct {
	Version string `json:"version"`
}

func LoadConfig(ctx *cli.Context) (*Config, error) {
	err := LoadEnv()

	if err != nil {
		return nil, err
	}

	rpc := os.Getenv("ETHEREUM_RPC_URL")

	url, err := url.Parse(rpc)

	if err != nil {
		return nil, err
	}

	user, err := user.Current()

	if err != nil {
		return nil, err
	}

	net := EthereumGoerli

	netpath := strings.Split(url.Path, "/")

	if len(netpath) > 2 {
		if netpath[2] == "goerli" {
			net = EthereumGoerli
		}

		if netpath[2] == "mainnet" {
			net = EthereumMainnet
		}

		if netpath[2] == "hardhat" {
			net = EthereumHardhat
		}
	}

	config := Config{
		Chain:            Ethereum,
		Network:          net,
		Env:              Dev,
		URL:              url,
		BatchSize:        100_000,
		ConcurrencyLimit: 10,
		User:             strings.ReplaceAll(strings.ToLower(user.Name), " ", "_"),
		Stream:           false,
	}

	if ctx.Bool("production") {
		config.Env = Prod
	}

	return &config, nil
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

func LoadEnv() error {
	dir, err := ModuleDir()

	if err != nil {
		return err
	}

	err = godotenv.Load(path.Join(dir, ".env"))

	if err != nil {
		return err
	}

	if os.Getenv("ETHEREUM_RPC_URL") == "" {
		return fmt.Errorf("missing environment variable: %s is required", "ETHEREUM_RPC_URL")
	}

	return nil
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

	var pkg PkgJSON

	err = json.Unmarshal(file, &pkg)

	if err != nil {
		return 0, err
	}

	var major int

	semver := strings.Split(pkg.Version, ".")

	if len(semver) < 3 {
		return 0, errors.New("invalid semver: must be in format major.minor.patch")
	}

	major, err = strconv.Atoi(semver[0])

	if err != nil {
		return 0, errors.New("invalid: major version must be an integer")
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
		return nil, errors.New("build artifacts not found: make sure the contract build is run before running this script")
	}

	casimirManagerPath := path.Join(buildPath, "CasimirManager.sol", "CasimirManager.json")

	casimirManagerFile, err := os.ReadFile(casimirManagerPath)

	if err != nil {
		return nil, err
	}

	return casimirManagerFile, nil
}

func (e Env) String() string {
	switch e {
	case Dev:
		return "dev"
	case Prod:
		return "prod"
	default:
		return ""
	}
}
