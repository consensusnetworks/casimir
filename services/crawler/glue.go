package main

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/glue"
	"github.com/aws/aws-sdk-go-v2/service/glue/types"
)

const (
	AnalyticsDatabaseDev  = "casimir_analytics_database_dev"
	AnalyticsDatabaseProd = "casimir_analytics_database_prod"
)

type GlueClient struct {
	Client    *glue.Client
	Databases []types.Database
	Tables    []types.Table
}

func LoadDefaultAWSConfig() (*aws.Config, error) {
	region := "us-east-2"
	config, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)

	if err != nil {
		return nil, err
	}

	return &config, nil
}

func NewGlueClient(config *aws.Config) (*GlueClient, error) {
	client := glue.NewFromConfig(*config)

	return &GlueClient{
		Client: client,
	}, nil
}

func (g *GlueClient) LoadDatabases() error {
	req, err := g.Client.GetDatabases(context.Background(), &glue.GetDatabasesInput{})

	if err != nil {
		return err
	}

	g.Databases = append(g.Databases, req.DatabaseList...)

	if req.NextToken != nil {
		err := g.LoadDatabases()

		if err != nil {
			return err
		}
	}

	return nil
}

func (g *GlueClient) LoadTables(databaseName string) error {
	input := &glue.GetTablesInput{
		DatabaseName: aws.String(databaseName),
	}

	req, err := g.Client.GetTables(context.Background(), input)

	if err != nil {
		return err
	}

	g.Tables = append(g.Tables, req.TableList...)

	if req.NextToken != nil {
		input.NextToken = req.NextToken
		g.LoadTables(databaseName)
	}

	return nil
}
