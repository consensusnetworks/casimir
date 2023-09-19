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

	if client.Client == nil {
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

	t.Errorf("database not found: %s is expected to be provided", CasimirAnalyticsDatabaseDev)
}

func TestGlueClient_LoadTables(t *testing.T) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Error(err)
	}

	client, err := NewGlueService(config)

	if err != nil {
		t.Error(err)
	}

	err = client.LoadTables(CasimirAnalyticsDatabaseDev)

	if err != nil {
		t.Error(err)
	}

	for _, table := range client.Tables {
		name := strings.Split(*table.Name, "")[len(*table.Name)-1]

		resourceVersion, err := strconv.Atoi(name)

		if err != nil {
			t.Error(err)
		}

		if resourceVersion < 1 {
			fmt.Println(name)
			t.Errorf("invalid resource version: %d", resourceVersion)
		}
	}
}

func TestGlueClient_Introspect(t *testing.T) {
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

	if len(client.Databases) == 0 {
		t.Error("no databases returned")
	}

	if len(client.Tables) == 0 {
		t.Error("no tables returned")
	}

	if client.EventMetadata.Name == "" {
		t.Error("event metadata is empty")
	}
}
