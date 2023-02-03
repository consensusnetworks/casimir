bin = ./bin/candle
os = $(shell go env GOOS)
arch = $(shell go env GOARCH)

test:
	go test -v ./...

build:
	make clean
	GOOS=$(os) GOARCH=$(arch) go build -o $(bin)
	chmod +x $(bin)

clean:
	rm -rf ./bin/candle
	rm -rf ./logs
	go clean

run:
	./run.sh