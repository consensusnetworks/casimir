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
			config, err := LoadConfig(ctx)

			if err != nil {
				return err
			}

			cc, err := NewEthereumCrawler(config)

			if err != nil {
				return err
			}

			fmt.Println(cc)

			// _, err = cc.ContractService.EventLogs()

			// if err != nil {
			// 	return err
			// }

			return nil
		},
	}

	err := app.Run(args)

	if err != nil {
		return err
	}

	return err
}
