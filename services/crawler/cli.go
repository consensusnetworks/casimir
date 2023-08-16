package main

import (
	"fmt"
	"net/url"
	"os"
	"os/user"
	"strconv"

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
				Usage:   "Crawl and stream from a forked network",
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

	l := logger.Sugar()

	l.With("cli_args", c.Args().Slice()).Info("cli options")

	vars, err := LoadEnv()

	if err != nil {
		l.Errorf("failed to load env: %s", err.Error())
		return err
	}

	url, err := url.Parse(vars[ETHEREUM_RPC_URL])

	if err != nil {
		l.Errorf("failed to parse ethereum rpc url: %s", err.Error())
		return err
	}

	user, err := user.Current()

	if err != nil {
		l.Errorf("failed to get current user: %s", err.Error())
		return err
	}

	config := Config{
		Env:              Dev,
		URL:              url,
		Network:          EthereumGoerli,
		User:             user.Username,
		Start:            0,
		BatchSize:        250_000,
		ConcurrencyLimit: 10,
	}

	if c.Bool("production") {
		config.Env = Prod
	}

	if vars[FORK] != "" {
		rawForkBlock := vars[ETHEREUM_FORK_BLOCK]
		forkBlock, err := strconv.ParseUint(rawForkBlock, 10, 64)

		if err != nil {
			l.Errorf("failed to parse fork block: %s", err.Error())
			return err
		}

		config.Fork = true
		config.ForkBlock = forkBlock

		fork, err := NewEthereumCrawler(config)

		if err != nil {
			return err
		}

		err = fork.Crawl()

		if err != nil {
			return err
		}

		return nil
	}

	_, err = NewEthereumCrawler(config)

	if err != nil {
		return err
	}

	// err = live.Crawl()

	// if err != nil {
	// 	return err
	// }

	return nil
}

// if config.Fork {
// 	crawler, err := NewEthereumCrawler(config)

// 	if err != nil {
// 		return err
// 	}

// 	l.Info(crawler.Head)

// 	// err = crawler.Crawl()

// 	// if err != nil {
// 	// 	return err
// 	// }

// 	// defer crawler.Close()

// 	return nil
// }

// l.With("config", config).Info("starting crawler")

// crawler, err := NewEthereumCrawler(config)

// if err != nil {
// 	return err
// }

// err = crawler.Crawl()

// if err != nil {
// 	return err
// }

// defer crawler.Close()

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
