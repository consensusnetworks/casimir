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
	err := godotenv.Load()
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
	streamer, err := NewEtheruemStreamer()

	if err != nil {
		return err
	}

	crawler, err := NewEthereumCrawler()

	if err != nil {
		return err
	}

	_, err = crawler.Introspect()

	if err != nil {
		return err
	}

	// err = crawler.Crawl()

	// if err != nil {
	// 	return err
	// }

	fmt.Println("streamer head:", streamer.Head)
	fmt.Println("crawler head:", crawler.Head)

	return nil
}

// func RootCmd(c *cli.Context) error {
// 	crawler, err := NewCrawler()

// 	if err != nil {
// 		return err
// 	}

// 	_, err = crawler.Introspect()

// 	if err != nil {
// 		return err
// 	}

// 	err = crawler.Crawl()

// 	if err != nil {
// 		return err
// 	}

// 	return nil
// }
