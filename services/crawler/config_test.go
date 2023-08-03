package main

import (
	"fmt"
	"testing"
)

func TestGetContractBuildArtifact(t *testing.T) {
	contract, err := GetContractBuildArtifact()

	if err != nil {
		t.Fatal(err)
	}

	if len(contract) == 0 {
		t.Fatal("contract is empty")
	}

	fmt.Println(string(contract))
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
