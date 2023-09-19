package main

import (
	"fmt"
	"os"

	"github.com/urfave/cli/v2"
)

func main() {
	err := Run(os.Args)

	if err != nil {
		fmt.Println(err)
	}
}

func Run(args []string) error {
	app := &cli.App{
		Name:    "crawler",
		Usage:   "Crawl and stream Ethereum blockchain events",
		Version: "1.0.0",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "network",
				Usage: "Set the ethereum network to crawl",
				Value: "goerli",
			},
			&cli.BoolFlag{
				Name:  "stream",
				Usage: "Stream events to the event stream",
				Value: false,
			},
			&cli.BoolFlag{
				Name:  "contract",
				Usage: "Crawl contract events",
				Value: false,
			},
			&cli.Uint64Flag{
				Name:  "concurrency",
				Usage: "Set the concurrency limit for the crawler",
				Value: 1,
			},
			&cli.Uint64Flag{
				Name:  "batch",
				Usage: "Set the batch size for the crawler",
				Value: 10,
			},
			&cli.BoolFlag{
				Name:    "development",
				Aliases: []string{"dev"},
				Usage:   "Set the environment to development (uses dev resources in AWS)",
				Value:   true,
			},
			&cli.BoolFlag{
				Name:    "production",
				Aliases: []string{"prod"},
				Usage:   "Set the environment to production (uses prod resource in AWS)",
				Value:   false,
			},
		},
		Action: func(ctx *cli.Context) error {
			config, err := NewConfigWithContext(ctx)

			if err != nil {
				return err
			}

			crawler, err := NewEthereumCrawler(config)

			if err != nil {
				return err
			}

			err = crawler.Run()

			if err != nil {
				return err
			}

			return nil
		},
	}

	err := app.Run(args)

	if err != nil {
		return err
	}

	return err
}
