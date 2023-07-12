package main

import (
	"testing"
)

func TestGetContractBuildArtifact(t *testing.T) {
	contract, err := GetContractBuildArtifact()

	if err != nil {
		t.Fatal(err)
	}

	if contract.ContractName != "CasimirManager" {
		t.Fatal("ContractName is not Casimir")
	}
}

func TestGetResourceVersion(t *testing.T) {
	rv, err := GetResourceVersion()

	if err != nil {
		t.Fatal(err)
	}

	if rv != 1 {
		t.Fatalf("expected: %d, got: %d", 1, rv)
	}
}
