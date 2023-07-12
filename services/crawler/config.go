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
)

type Environment string

const (
	NodeHost             = "nodes.casimir.co"
	Dev      Environment = "dev"
	Prod     Environment = "prod"

	AWSAthenaTimeFormat = "2006-01-02:15 04:05.999999999"
)

type Config struct {
	Env     Environment `json:"environment"`
	Fork    bool        `json:"fork"`
	Network NetworkType `json:"network"`
	URL     url.URL     `json:"url"`
	User    string      `json:"user"`
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

func LoadEnv() error {
	dir, err := ModuleDir()

	if err != nil {
		return err
	}

	err = godotenv.Load(path.Join(dir, ".env"))

	if err != nil {
		return nil
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

func GetContractBuildArtifact() (*CasimirManager, error) {
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
		return nil, errors.New("ContractBuildArtifactNotFound")
	}

	casimirManagerPath := path.Join(buildPath, "CasimirManager.sol", "CasimirManager.json")

	casimirManagerFile, err := os.ReadFile(casimirManagerPath)

	if err != nil {
		return nil, err
	}

	var cs CasimirManager

	err = json.Unmarshal(casimirManagerFile, &cs)

	if err != nil {
		return nil, err
	}

	return &cs, nil
}
