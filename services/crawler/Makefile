,PHONY: build clean

name=crawler
bin = ./bin/$(name)
os = $(shell go env GOOS)
arch = $(shell go env GOARCH)

# abigen --abi <(jq '.abi' ../../contracts/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json) --pkg main --out casimir_manager.go

test:
	go test -v ./... -count=1

test-coverage:
	rm -rf ./coverage.out
	go test -v ./... -count=1 -coverprofile=coverage.out
	go tool cover -html=coverage.out

build:
	GOOS=$(os) GOARCH=$(arch) CGO_ENABLED=1 go build -o $(bin) .
	chmod +x $(bin)

clean:
	rm -rf ./bin ./data ./logs
	go clean

dep:
	go mod tidy

