package main

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/glue"
	"github.com/aws/aws-sdk-go-v2/service/glue/types"
)

const (
	CasimirAnalyticsDatabaseDev  = "casimir_analytics_database_dev"
	CasimirAnalyticsDatabaseProd = "casimir_analytics_database_prod"
)

type Table struct {
	Name     string
	Database string
	Version  int
	Bucket   string
	SerDe    string
}

type GlueService struct {
	Client          *glue.Client
	Databases       []types.Database
	Tables          []types.Table
	EventMeta       Table
	ActionMeta      Table
	ResourceVersion int
}

type Partition struct {
	Chain   ChainType
	Network NetworkType
	Year    string
	Month   string
	Block   uint64
}

func (p *Partition) String() string {
	return fmt.Sprintf("chain=ethereum/network=%s/year=%s/month=%s/block=%d", p.Network, p.Year, p.Month, p.Block)
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

func NewGlueService(config *aws.Config) (*GlueService, error) {
	client := glue.NewFromConfig(*config)

	return &GlueService{
		Client: client,
	}, nil
}

func (g *GlueService) LoadDatabases() error {
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

func (g *GlueService) LoadTables(databaseName string) error {
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
		err = g.LoadTables(databaseName)

		if err != nil {
			return err
		}
	}

	return nil
}

func (g *GlueService) Introspect(env Env) error {
	db := CasimirAnalyticsDatabaseDev

	if env == Prod {
		db = CasimirAnalyticsDatabaseProd
	}

	err := g.LoadDatabases()

	if err != nil {
		return err
	}

	err = g.LoadTables(db)

	if err != nil {
		return err
	}

	if len(g.Tables) == 0 {
		return nil
	}

	for _, t := range g.Tables {
		table := *t.Name
		serde := t.StorageDescriptor.SerdeInfo.SerializationLibrary
		bucket := t.StorageDescriptor.Location

		cleanedBucket := strings.TrimPrefix(*bucket, "s3://")
		cleanedBucket = strings.TrimSuffix(cleanedBucket, "/")

		switch {
		case strings.Contains(table, "event"):
			lastWord := table[len(table)-1]

			resourceVersion, err := strconv.Atoi(string(lastWord))

			if err != nil {
				return err
			}

			g.EventMeta = Table{
				Name:     table,
				Database: db,
				Version:  resourceVersion,
				Bucket:   cleanedBucket,
				SerDe:    strings.Split(*serde, ".")[3],
			}

			g.ResourceVersion = resourceVersion
		case strings.Contains(table, "action"):
			lastWord := table[len(table)-1]

			resourceVersion, err := strconv.Atoi(string(lastWord))

			if err != nil {
				return err
			}

			g.ActionMeta = Table{
				Name:     table,
				Database: db,
				Version:  resourceVersion,
				Bucket:   cleanedBucket,
				SerDe:    strings.Split(*serde, ".")[3],
			}
		default:
			return fmt.Errorf("unknown table: %s", table)
		}
	}

	if g.ResourceVersion == 0 {
		return fmt.Errorf("unexpected resource version: %d", g.ResourceVersion)
	}

	return nil
}

func (g *GlueService) Parition(s3v *S3Service, parts []string) error {
	return nil
}
