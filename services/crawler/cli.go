package main

import (
	"fmt"
	"os"

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

func LoadEnv() error {
	err := godotenv.Load("services/crawler/.env")
	if err != nil {
		return err
	}
	return nil
}

func Start(args []string) error {
	app := &cli.App{
		Name:    "crawler",
		Usage:   "Crawl and stream blockchain events",
		Version: "0.0.1",
		Action:  RootCmd,
	}

	err := app.Run(args)

	if err != nil {
		return err
	}

	return nil
}

func RootCmd(c *cli.Context) error {
	crawler, err := NewEthereumCrawler()

	if err != nil {
		return err
	}

	l := crawler.Logger

	l.Info("introspecting...\n")

	_, err = crawler.Introspect()

	if err != nil {
		return err
	}

	err = crawler.Crawl()

	if err != nil {
		return err
	}

	defer crawler.Close()

	streamer, err := NewEthereumStreamer()

	if err != nil {
		return err
	}

	// for now use crawler's introspect and s3 client rather than recreating them
	streamer.Glue = crawler.Glue
	streamer.S3 = crawler.S3

	err = streamer.Stream()

	if err != nil {
		return err
	}

	return nil
}
