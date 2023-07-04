package main

import (
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

const (
	ETHERUEM_RPC_URL       = "ETHEREUM_RPC_URL"
	PUBLIC_MANAGER_ADDRESS = "PUBLIC_MANAGER_ADDRESS"
)

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

	return nil
}

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

func Start(args []string) error {
	app := &cli.App{
		Name:    "crawler",
		Usage:   "Crawl and stream blockchain events",
		Version: "0.0.1",
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:    "local",
				Aliases: []string{"l"},
				Usage:   "Stream from a local hardhat network",
				Value:   false,
			},
		},
		Action: RootCmd,
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

	// Run the crawler first even if we're streaming locally
	// because we use the crawler's introspect for the streamer
	crawler, err := NewEthereumCrawler()

	if err != nil {
		return err
	}

	err = crawler.Introspect()

	if err != nil {
		return err
	}

	if c.Bool("local") {
		localStreamer, err := NewEthereumStreamer(true)

		if err != nil {
			return err
		}

		err = localStreamer.Stream()

		if err != nil {
			return err
		}

		return nil
	}

	err = crawler.Crawl()

	if err != nil {
		return err
	}

	defer crawler.Close()

	streamer, err := NewEthereumStreamer(false)

	if err != nil {
		return err
	}

	// for now use crawler's introspect
	streamer.Glue = crawler.Glue
	streamer.S3 = crawler.S3

	streamer.EventBucket = crawler.EventBucket
	streamer.StakingBucket = crawler.StakingBucket
	streamer.WalletBucket = crawler.WalletBucket

	// the streamer can start head + 1 because the crawler is inclusive
	err = streamer.Stream()

	if err != nil {
		return err
	}

	return nil
}
