package main

import (
	"bytes"
	"context"
	"fmt"
	"os"

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

func (s *S3Client) UploadBytes(bucket string, key string, data []byte) error {
	opt := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
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
