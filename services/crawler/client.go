package main

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/athena"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/ethclient"
	"net/http"
	"os"
	"time"
)

func PString(s string) *string {
	return &s
}

func NewEthereumClient(url string) (*ethclient.Client, error) {
	client, err := ethclient.Dial(url)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func NewS3Client() (*s3.S3, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      PString(os.Getenv("AWS_REGION")),
		Credentials: credentials.NewEnvCredentials(),
	},
	)
	if err != nil {
		return nil, err
	}
	return s3.New(sess), nil
}

func NewAthenaClient() (*athena.Athena, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      PString(os.Getenv("AWS_REGION")),
		Credentials: credentials.NewEnvCredentials(),
	},
	)
	if err != nil {
		return nil, err
	}

	return athena.New(sess), nil
}

func NewHTTPClient() (*http.Client, error) {
	client := &http.Client{
		Timeout: time.Second * 10,
	}
	return client, nil
}
