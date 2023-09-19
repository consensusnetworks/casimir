package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Service struct {
	Client *s3.Client
}

func NewS3Service(config aws.Config) (*S3Service, error) {
	client := s3.NewFromConfig(config)

	return &S3Service{
		Client: client,
	}, nil
}

func (s *S3Service) Put(bucket string, key string, reader io.Reader) error {
	opt := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   reader,
	}

	_, err := s.Client.PutObject(context.Background(), opt)

	if err != nil {
		return fmt.Errorf("failed to put object: %v", err)
	}

	return nil
}

func (s *S3Service) Get(bucket, key string) (*bytes.Buffer, error) {
	var err error

	opt := &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}

	result, err := s.Client.GetObject(context.Background(), opt)

	if err != nil {
		return nil, fmt.Errorf("failed to get object: %v", err)
	}

	defer result.Body.Close()

	buf := new(bytes.Buffer)

	buf.ReadFrom(result.Body)

	return buf, nil
}

func (s *S3Service) ListObjects(bucket, key string) (*[]string, error) {
	if bucket == "" {
		return nil, fmt.Errorf("bucket name is empty")
	}

	var objects []string

	opt := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		// Prefix: aws.String(key),
	}

	paginator := s3.NewListObjectsV2Paginator(s.Client, opt)

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(context.Background())

		if err != nil {
			return nil, fmt.Errorf("failed to get next page: %v", err)
		}

		for _, obj := range page.Contents {
			objects = append(objects, *obj.Key)
		}
	}

	fmt.Println("objects:", len(objects))

	return &objects, nil
}

func (s *S3Service) ConsumedBlocks(bucket, key string) (*[]int64, error) {
	files, err := s.ListObjects(bucket, key)

	if err != nil {
		return nil, fmt.Errorf("failed to list objects: %v", err)
	}

	consumed := make([]int64, len(*files))

	for _, v := range *files {
		parts := strings.Split(v, "/")

		block := strings.Split(parts[len(parts)-1], "=")[1]

		num, err := strconv.Atoi(strings.Split(block, ".")[0])

		if err != nil {
			return nil, fmt.Errorf("failed to convert string to int: %v", err)
		}

		consumed = append(consumed, int64(num))
	}
	return &consumed, nil
}

func (s *S3Service) CreatePartition(glues *GlueService, config Config) error {
	if glues.EventMetadata.Name == "" {
		return fmt.Errorf("failed to get event table meta")
	}

	// if glues.ActionMeta.Name == "" {
	// 	return fmt.Errorf("failed to get action table meta")
	// }

	startYear := 2015
	endYear := 2025

	for year := startYear; year <= endYear; year++ {
		for month := 1; month <= 12; month++ {
			// trailing slash to indicate directory
			part := fmt.Sprintf("chain=%s/network=%s/year=%04d/month=%02d/", config.Chain, config.Network, year, month)

			_, err := s.Client.PutObject(context.Background(), &s3.PutObjectInput{
				Bucket: aws.String(glues.EventMetadata.Bucket),
				Key:    aws.String(part),
			})

			if err != nil {
				return fmt.Errorf("error creating partition folder: %v", err)
			}

			// _, err = s.Client.PutObject(context.Background(), &s3.PutObjectInput{
			// 	Bucket: aws.String(glues.ActionMeta.Bucket),
			// 	Key:    aws.String(part),
			// })

			// if err != nil {
			// 	return fmt.Errorf("error creating partition folder: %v", err)
			// }

			// 00 is a special partition for the year 2015 holding early blocks
			// if year == 2015 {
			// 	_, err = s.Client.PutObject(context.Background(), &s3.PutObjectInput{
			// 		Bucket: aws.String(glues.EventMetadata.Bucket),
			// 		Key:    aws.String(fmt.Sprintf("%s/%s/%04d/00/", config.Chain, config.Network, year)),
			// 	})

			// 	if err != nil {
			// 		return fmt.Errorf("error creating partition folder: %v", err)
			// 	}

			// 	_, err = s.Client.PutObject(context.Background(), &s3.PutObjectInput{
			// 		Bucket: aws.String(glues.ActionMeta.Bucket),
			// 		Key:    aws.String(fmt.Sprintf("%s/%s/%04d/00/", config.Chain, config.Network, year)),
			// 	})

			// 	if err != nil {
			// 		return fmt.Errorf("error creating partition folder: %v", err)
			// 	}
			// }
		}
	}
	return nil
}
