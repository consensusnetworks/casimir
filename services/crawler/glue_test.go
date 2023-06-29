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

	client, err := NewGlueClient(config)

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

	glue, err := NewGlueClient(config)

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
		if *database.Name == AnalyticsDatabaseDev {
			return
		}
	}
	t.Error("database not found")
}

func TestGlueClient_LoadTables(t *testing.T) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Error(err)
	}

	client, err := NewGlueClient(config)

	if err != nil {
		t.Error(err)
	}

	err = client.LoadTables(AnalyticsDatabaseDev)

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
			t.Error("resource version must be greater than 0")
		}
	}
}
