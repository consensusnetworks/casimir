package main

import (
	"fmt"
	"strconv"
	"strings"
	"testing"
)

func TestNewS3Client(t *testing.T) {
	s3c, err := NewS3Client()

	if err != nil {
		t.Errorf("failed to create new s3 client: %v", err)
	}

	if s3c.Client == nil {
		t.Errorf("s3 client is nil")
	}
}

func TestAlreadyConsumed(t *testing.T) {
	s3c, err := NewS3Client()

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
