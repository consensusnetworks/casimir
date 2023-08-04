package main

import (
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
	logger, err := NewConsoleLogger()

	if err != nil {
		return err
	}

	l := logger.Sugar().With("service", "crawler")

	// just for now load from local env
	err = LoadEnv()

	if err != nil {
		return err
	}

	l.Info("loaded env vars")

	// 0xaaf5751d370d2fD5F1D5642C2f88bbFa67a29301
	rpcURL := os.Getenv("ETHEREUM_RPC_URL")

	if rpcURL == "" {
		l.Errorf("ETHEREUM_RPC_URL is not set")
		return fmt.Errorf("ETHEREUM_RPC_URL is not set")
	}

	url, err := url.Parse(rpcURL)

	if err != nil {
		return err
	}

	user, err := user.Current()

	if err != nil {
		return err
	}

	config := Config{
		Chain:      Ethereum,
		Env:        Dev,
		URL:        url,
		BatchSize:  250_000,
		Concurrent: 10,
		User:       strings.ToLower(user.Username),
		Fork:       false,
		Network:    EthereumGoerli,
	}

	if c.Bool("production") {
		config.Env = Prod
	}

	fork := c.Bool("fork")

	if fork {
		config.Fork = true
		crawler, err := NewEthereumCrawler(config)

		if err != nil {
			return err
		}

		l.Info(crawler.Head)

		err = crawler.Crawl()

		if err != nil {
			return err
		}

		defer crawler.Close()

		return nil
	}

	l.With("config", config)

	crawler, err := NewEthereumCrawler(config)

	if err != nil {
		return err
	}

	err = crawler.Crawl()

	if err != nil {
		return err
	}

	defer crawler.Close()

	// streamer, err := NewEthereumStreamer(config)

	// if err != nil {
	// 	return err
	// }

	// // crawl fork
	// if config.Fork && config.URL.Host == "127.0.0.1:8545" {
	// 	err = PingEthereumNode(config.URL.String())

	// 	if err != nil {
	// 		return err
	// 	}

	// 	user, err := user.Current()

	// 	if err != nil {
	// 		return err
	// 	}

	// 	config.User = user.Username

	// 	return nil
	// }

	// // if config.URL.Host != RemoteNodeHost || config.URL.Scheme != "https" {
	// // 	return errors.New("can't sync with non prod resource")
	// // }

	// // crawl live network
	// crawler, err := NewEthereumCrawler(config)

	// if err != nil {
	// 	return err
	// }

	// // err = crawler.Crawl()

	// // if err != nil {
	// // 	return err
	// // }

	// defer crawler.Close()

	return nil
}

// https://nodes.casimir.co/eth/hardhat

func CrawlFork() error {
	return nil
}
