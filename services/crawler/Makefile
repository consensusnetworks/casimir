,PHONY: build clean dep test

name=processor
bin = ./build/$(name)
os = $(shell go env GOOS)
arch = $(shell go env GOARCH)

test:
	go test -v ./...

build:
	GOOS=$(os) GOARCH=$(arch) go build -o $(bin)
	chmod +x $(bin)

clean:
	rm -rf ./build
	rm -rf ./logs
	go clean
