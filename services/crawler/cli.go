package main

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/user"
	"strings"

	"github.com/urfave/cli/v2"
)

func main() {
	err := Start(os.Args)

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
			&cli.BoolFlag{
				Name:    "fork",
				Aliases: []string{"f"},
				Usage:   "Crawl and stream from a Ethereum fork",
				Value:   false,
			},
		},
		Action: RootCmd,
	}

	err := app.Run(args)

	if err != nil {
		return err
	}

	return err
}

func RootCmd(c *cli.Context) error {
	// just for now load from local env
	err := LoadEnv()

	if err != nil {
		return err
	}

	ethURL := os.Getenv("ETHEREUM_RPC_URL")

	url, err := url.Parse(ethURL)

	if err != nil {
		return err
	}

	config := Config{
		Env:        Dev,
		URL:        *url,
		Start:      0,
		BatchSize:  250_000,
		Concurrent: 10,
	}

	if c.Bool("production") {
		config.Env = Prod
	}

	net := os.Getenv("NETWORK")

	lastPath := url.Path[strings.LastIndex(url.Path, "/")+1:]

	switch net {
	case "testnet":
		config.Network = EthereumGoerli
	case "mainnet":
		config.Network = EthereumMainnet
	default:
		if lastPath == "goerli" {
			config.Network = EthereumGoerli
			break
		}
		config.Network = EthereumHardhat
		config.Fork = true
	}

	if config.Fork && config.URL.Scheme != "https" {
		return errors.New("cannot sync local fork with prod resource")
	}

	// crawl fork
	if config.Fork && config.URL.Host == "127.0.0.1:8545" {
		err = PingEthereumNode(config.URL.String())

		if err != nil {
			return err
		}

		user, err := user.Current()

		if err != nil {
			return err
		}

		config.User = user.Username

		return nil
	}

	// if config.URL.Host != RemoteNodeHost || config.URL.Scheme != "https" {
	// 	return errors.New("can't sync with non prod resource")
	// }

	// crawl live network
	crawler, err := NewEthereumCrawler(config)

	if err != nil {
		return err
	}

	err = crawler.Crawl()

	if err != nil {
		return err
	}

	defer crawler.Close()

	return nil
}
