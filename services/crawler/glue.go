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

type GlueService struct {
	Client          *glue.Client
	Databases       []types.Database
	Tables          []types.Table
	EventMetadata   Table
	ResourceVersion int
	ActionMeta      Table
}

type Table struct {
	Name     string
	Database string
	Version  int
	Bucket   string
	SerDe    string
}

type Partition struct {
	Bucket  string
	Chain   Chain
	Network Network
	Year    string
	Month   string
	Block   uint64
}

func (p *Partition) Marshal() string {
	return fmt.Sprintf("chain=%s/network=%s/year=%s/month=%s/block=%d", p.Chain, p.Network, p.Year, p.Month, p.Block)
}

func (p *Partition) Unmarshal(partition string, part *Partition) error {
	kvpairs := strings.Split(partition, "/")
	for _, p := range kvpairs {
		kv := strings.Split(p, "=")

		switch kv[0] {
		case "chain":
			part.Chain = Chain(kv[1])
		case "network":
			part.Network = Network(kv[1])
		case "year":
			part.Year = kv[1]
		case "month":
			part.Month = kv[1]
		case "block":
			block, err := strconv.Atoi(kv[1])
			if err != nil {
				return err
			}
			part.Block = uint64(block)
		default:
			return fmt.Errorf("unexpected partition key: %s", kv[0])
		}
	}
	return nil
}

func NewGlueService(config aws.Config) (*GlueService, error) {
	return &GlueService{
		Client: glue.NewFromConfig(config),
	}, nil
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
		return fmt.Errorf("no tables found in database: %s", db)
	}

	for _, t := range g.Tables {
		table := *t.Name
		serde := t.StorageDescriptor.SerdeInfo.SerializationLibrary
		bucket := t.StorageDescriptor.Location

		cleaned := strings.TrimPrefix(*bucket, "s3://")
		cleaned = strings.TrimSuffix(cleaned, "/")

		if strings.Contains(table, "event") {
			lastw := table[len(table)-1]

			resourceVersion, err := strconv.Atoi(string(lastw))

			if err != nil {
				return err
			}

			g.EventMetadata = Table{
				Name:     table,
				Database: db,
				Version:  resourceVersion,
				Bucket:   cleaned,
				SerDe:    strings.Split(*serde, ".")[3],
			}

			g.ResourceVersion = resourceVersion
			break
		}
	}

	if g.EventMetadata.Bucket == "" || g.EventMetadata.SerDe == "" {
		return fmt.Errorf("failed to get event table meta")
	}

	if g.ResourceVersion == 0 {
		return fmt.Errorf("unexpected resource version: %d", g.ResourceVersion)
	}

	return nil
}

func LoadDefaultAWSConfig() (aws.Config, error) {
	region := "us-east-2"
	config, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
	)

	if err != nil {
		return aws.Config{}, err
	}

	return config, nil
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

func (g *GlueService) LoadTables(db string) error {
	input := &glue.GetTablesInput{
		DatabaseName: aws.String(db),
	}

	req, err := g.Client.GetTables(context.Background(), input)

	if err != nil {
		return err
	}

	g.Tables = append(g.Tables, req.TableList...)

	if req.NextToken != nil {
		input.NextToken = req.NextToken
		err = g.LoadTables(db)

		if err != nil {
			return err
		}
	}

	return nil
}
