package main

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Client struct {
	Client *s3.Client
}

func NewS3Client() (*S3Client, error) {
	s3c := &S3Client{}

	cfg, err := LoadDefaultAWSConfig()

	if err != nil {
		return nil, fmt.Errorf("failed to load default config for s3 client: %v", err)
	}

	s3c.Client = s3.NewFromConfig(*cfg)

	return s3c, nil
}

func (s *S3Client) Upload(bucket string, key string, fpath string) error {
	var err error

	file, err := os.Open(fpath)

	if err != nil {
		return fmt.Errorf("failed to open file %q: %v", fpath, err)
	}

	defer file.Close()

	opt := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   file,
	}

	_, err = s.Client.PutObject(context.Background(), opt)

	if err != nil {
		return fmt.Errorf("failed to put object: %v", err)
	}
	return nil
}

func (s *S3Client) UploadBytes(bucket string, key string, data *bytes.Buffer) error {
	opt := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data.Bytes()),
	}

	_, err := s.Client.PutObject(context.Background(), opt)

	if err != nil {
		return fmt.Errorf("failed to put object: %v", err)
	}
	return nil
}

func (s *S3Client) MultipartUpload(bucket, key, fpath string) error {
	return s.Upload(bucket, key, fpath)
}

func (s *S3Client) Get(bucket, key string) (*bytes.Buffer, error) {
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

func (s *S3Client) ListObjects(bucket, key string) (*[]string, error) {
	if bucket == "" {
		return nil, fmt.Errorf("bucket name is empty")
	}

	var objects []string

	opt := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(key),
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
	return &objects, nil
}

func (s *S3Client) AlreadyConsumed(bucket, key string) (*[]int64, error) {
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
