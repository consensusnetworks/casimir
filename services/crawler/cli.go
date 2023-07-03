package main

import (
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

func main() {
	err := LoadEnv()

	if err != nil {
		fmt.Println(err)
	}

	err = Start(os.Args)

	if err != nil {
		fmt.Println(err)
	}
}

const (
	ETHERUEM_RPC_URL = "ETHEREUM_RPC_URL"
	// PUBLIC_CRYPTO_COMPARE_API_KEY = "PUBLIC_CRYPTO_COMPARE_API_KEY"
)

var EnvVars = map[string]string{
	ETHERUEM_RPC_URL: "http://localhost:8545",
	// PUBLIC_CRYPTO_COMPARE_API_KEY: "",
}

func LoadEnv() error {
	wd, err := os.Getwd()

	if err != nil {
		return err
	}

	envPath := path.Join(wd, ".env")
	currentDir := strings.Split(wd, "/")

	if currentDir[len(currentDir)-1] == "casimir" {
		envPath = path.Join(wd, "services", "crawler", ".env")
	}

	err = godotenv.Load(envPath)

	if err != nil {
		return err
	}

	// for key, value := range EnvVars {
	// 	if os.Getenv(key) == "" {
	// 		os.Setenv(key, value)
	// 	}

	// 	if os.Getenv(key) == "" {
	// 		return fmt.Errorf("env variable %s is not set", key)
	// 	}
	// }

	return nil
}

func Start(args []string) error {
	app := &cli.App{
		Name:    "crawler",
		Usage:   "Crawl and stream blockchain events",
		Version: "0.0.1",
		Action:  RootCmd,
	}

	err := LoadEnv()

	if err != nil {
		return err
	}

	err = app.Run(args)

	if err != nil {
		return err
	}

	return err
}

func RootCmd(c *cli.Context) error {
	crawler, err := NewEthereumCrawler()

	if err != nil {
		return err
	}

	err = crawler.Introspect()

	if err != nil {
		panic(err)
	}

	err = crawler.Crawl()

	if err != nil {
		return err
	}

	defer crawler.Close()

	// streamer, err := NewEthereumStreamer()

	// if err != nil {
	// return err
	// }

	// for now use crawler's introspect and s3 client rather than recreating them
	// streamer.Glue = crawler.Glue
	// streamer.S3 = crawler.S3

	// err = streamer.Stream()

	// if err != nil {
	// 	return err
	// }

	return nil
}
