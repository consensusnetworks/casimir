package main

import (
	"fmt"
	"strconv"
	"strings"
	"testing"
)

func TestNewS3Client(t *testing.T) {
	config, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Errorf("failed to load default aws config: %v", err)
	}

	s3c, err := NewS3Service(config)

	if err != nil {
		t.Errorf("failed to create new s3 client: %v", err)
	}

	if s3c.Client == nil {
		t.Errorf("s3 client is nil")
	}
}

func TestS3Service_CreatePartition(t *testing.T) {
	config := Config{
		Chain:     Ethereum,
		Network:   EthereumGoerli,
		Start:     0,
		End:       25_000_000,
		BatchSize: 1_000_000,
		Env:       Dev,
	}

	awsconfig, err := LoadDefaultAWSConfig()

	check(t, err)

	s3c, err := NewS3Service(awsconfig)

	check(t, err)

	glues, err := NewGlueService(awsconfig)

	check(t, err)

	err = glues.Introspect(config.Env)

	check(t, err)

	err = s3c.CreatePartition(glues, config)

	check(t, err)
}

func TestAlreadyConsumed(t *testing.T) {
	awsconfig, err := LoadDefaultAWSConfig()

	if err != nil {
		t.Errorf("failed to load default aws config: %v", err)
	}

	s3c, err := NewS3Service(awsconfig)

	if err != nil {
		t.Errorf("failed to create new s3 client: %v", err)
	}

	objs, err := s3c.ListObjects("casimir-analytics-event-bucket-dev1", "ethereum/goerli")

	if err != nil {
		t.Errorf("failed to list objects: %v", err)
	}

	fmt.Printf("# of objects: %d\n", len(*objs))

	consumed := make([]int, 0)
	duplicates := make(map[int]bool)

	for _, v := range *objs {
		splitt := strings.Split(v, "/")
		block := strings.Split(splitt[len(splitt)-1], "=")[1]

		num, err := strconv.Atoi(strings.Split(block, ".")[0])

		if err != nil {
			t.Errorf("failed to convert string to int: %v", err)
			continue
		}

		if duplicates[num] {
			t.Fatalf("duplicate element found: %d\n", num)
		}

		duplicates[num] = true
		consumed = append(consumed, num)
	}
	fmt.Printf("# of consumed: %d\n", len(consumed))
}

func check(t *testing.T, err error) {
	if err != nil {
		t.Errorf(err.Error())
	}
}
