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
