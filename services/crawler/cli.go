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
		Commands: []*cli.Command{
			{
				Name:  "crawl",
				Usage: "crawl historical blockchain events (blocks, transactions, logs)",
				Flags: []cli.Flag{
					&cli.BoolFlag{
						Name:  "verbose",
						Usage: "verbose logging",
						Value: true,
					},
					&cli.Int64Flag{
						Name:  "start",
						Usage: "the block to start from",
						Value: 0,
					},
					&cli.Int64Flag{
						Name:  "end",
						Usage: "the block to end at",
						Value: 100,
					},
				},
				Action: CrawlCmd,
			},
			{
				Name:   "stream",
				Usage:  "stream blockchain events to a storage backend",
				Action: StreamCmd,
				Flags: []cli.Flag{
					&cli.BoolFlag{
						Name:  "verbose",
						Usage: "verbose logging",
						Value: true,
					},
				},
			},
		},
	}

	err := app.Run(args)

	if err != nil {
		return err
	}

	return nil
}

func RootCmd(c *cli.Context) error {
	crawler, err := NewCrawler()

	if err != nil {
		return err
	}

	_, err = crawler.Introspect()

	if err != nil {
		return err
	}

	err = crawler.Crawl()

	if err != nil {
		return err
	}

	return nil
}

func CrawlCmd(c *cli.Context) error {
	l := NewStdoutLogger()
	l.Info("crawl command\n")
	return nil
}

func StreamCmd(c *cli.Context) error {
	fmt.Println("streaming")
	return nil
}
