package main

import (
	"fmt"
	"strconv"
	"strings"
	"testing"
)

func TestNewGlueClient(t *testing.T) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Error(err)
	}

	client, err := NewGlueService(config)

	if err != nil {
		t.Error(err)
	}

	if client == nil {
		t.Error("client is nil")
	}
}

func TestGlueClient_LoadDatabases(t *testing.T) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Error(err)
	}

	glue, err := NewGlueService(config)

	if err != nil {
		t.Error(err)
	}

	err = glue.LoadDatabases()

	if err != nil {
		t.Error(err)
	}

	if len(glue.Databases) == 0 {
		t.Error("no databases returned")
	}

	for _, database := range glue.Databases {
		if *database.Name == CasimirAnalyticsDatabaseDev {
			return
		}
	}
	t.Error("expected database not found")
}

func TestGlueService_Introspect(t *testing.T) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Error(err)
	}

	client, err := NewGlueService(config)

	if err != nil {
		t.Error(err)
	}

	err = client.Introspect(Dev)

	if err != nil {
		t.Error(err)
	}

	if len(client.Tables) == 0 {
		t.Error("no tables returned")
	}

	for _, table := range client.Tables {
		name := strings.Split(*table.Name, "")[len(*table.Name)-1]

		resourceVersion, err := strconv.Atoi(name)

		if err != nil {
			t.Error(err)
		}

		if resourceVersion < 1 {
			fmt.Println(name)
			t.Error("resource version must be greater than 0")
		}
	}
}
