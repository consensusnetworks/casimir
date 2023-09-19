package main

import (
	"encoding/json"
	"errors"
	"net/url"
	"os"
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
	Chain       Chain
	Network     Network
	URL         *url.URL
	BatchSize   uint64
	Concurrency uint64
	Env         Env
	Stream      bool
	Contract    bool
}

type PkgJSON struct {
	Version string `json:"version"`
}

func NewConfigWithContext(ctx *cli.Context) (Config, error) {
	err := LoadEnv()

	if err != nil {
		return Config{}, err
	}

	rpc := os.Getenv("ETHEREUM_RPC_URL")

	if rpc == "" {
		return Config{}, errors.New("missing environment variable: ETHEREUM_RPC_URL is required")
	}

	url, err := url.Parse(rpc)

	if err != nil {
		return Config{}, err
	}

	network := ctx.String("network")
	net := EthereumGoerli

	if url.Host == "nodes.casimir.co" {
		netpath := strings.Split(url.Path, "/")

		if len(netpath) > 2 && netpath[1] == "eth" {
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
	} else {
		if network == "goerli" {
			net = EthereumGoerli
		}

		if network == "mainnet" {
			net = EthereumMainnet
		}

		if network == "hardhat" {
			net = EthereumHardhat
		}
	}

	env := Dev

	if ctx.Bool("production") {
		env = Prod
	}

	return Config{
		Env:         env,
		Chain:       Ethereum,
		Network:     net,
		URL:         url,
		BatchSize:   ctx.Uint64("batch"),
		Concurrency: ctx.Uint64("concurrency"),
		Stream:      ctx.Bool("stream"),
		Contract:    ctx.Bool("contract"),
	}, nil
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
		return "development"
	case Prod:
		return "production"
	default:
		return ""
	}
}
