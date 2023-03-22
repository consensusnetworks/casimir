package main

import (
	"fmt"
	"os"

	"github.com/urfave/cli/v2"
)

type BaseConfig struct {
	Chain   ChainType
	Network NetworkType
	Url     string
	Verbose bool
	Start   int64
	End     int64
	Bucket  string
}

func Run(args []string) error {
	app := &cli.App{
		Name:    "crawler",
		Usage:   "lights the path",
		Version: "1.0.0",
		Commands: []*cli.Command{
			{
				Name:  "stream",
				Usage: "stream blockchain events",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:  "chain",
						Usage: "chain to use",
					}, &cli.StringFlag{
						Name:  "network",
						Usage: "network to use",
					},
					&cli.BoolFlag{
						Name:  "verbose",
						Usage: "verbose output",
						Value: true,
					},
				},
				Action: func(c *cli.Context) error {
					base := &BaseConfig{
						Chain:   Ethereum,
						Network: Mainnet,
						Url:     os.Getenv("ALCHEMY_WS_URL"),
						Verbose: c.Bool("verbose"),
						Bucket:  "",
					}

					fmt.Println("might stream")
					fmt.Println(base)

					// streamer, err := NewEthereumStreamer(*base)

					// if err != nil {
					// 	return err
					// }

					// // err = streamer.Stream()

					// if err != nil {
					// 	return err
					// }
					return nil
				},
			},
			{
				Name:  "crawl",
				Usage: "crawl events",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:  "chain",
						Usage: "chain to use",
					}, &cli.StringFlag{
						Name:  "network",
						Usage: "network to use",
					},
					&cli.StringFlag{
						Name:  "url",
						Usage: "url to use",
					},
					&cli.Int64Flag{
						Name:  "start",
						Usage: "start block",
					},
					&cli.Int64Flag{
						Name:  "end",
						Usage: "end block",
					},
					&cli.BoolFlag{
						Name:  "silent",
						Usage: "verbose output",
						Value: false,
					},
				},
				Action: func(c *cli.Context) error {
					base := &BaseConfig{
						Chain:   Ethereum,
						Network: Mainnet,
						Url:     os.Getenv("CONSENSUS_RPC_URL"),
						Verbose: !c.Bool("silent"),
						Start:   c.Int64("start"),
						End:     c.Int64("end"),
						Bucket:  "",
					}

					err := base.Validate()

					if err != nil {
						return err
					}

					crawler, err := NewEthereumCrawler(*base)

					if err != nil {
						return err
					}

					err = crawler.Crawl()

					if err != nil {
						return err
					}
					return nil
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

func (bs *BaseConfig) Validate() error {
	if bs.Chain == "" {
		return fmt.Errorf("chain is required")
	}

	if bs.Network == "" || bs.Network != Mainnet {
		return fmt.Errorf("network is required")
	}

	if bs.Url == "" {
		return fmt.Errorf("url is required")
	}

	if bs.Start < 0 {
		panic("start must be greater than 0")
	}

	if bs.End < 0 {
		return fmt.Errorf("end must be greater than 0")
	}

	if bs.Start > bs.End {
		return fmt.Errorf("start must be less than end")
	}

	return nil

}

func (bs *BaseConfig) String() string {
	return fmt.Sprintf("chain: %s network: %s url: %s \n", bs.Chain, bs.Network, bs.Url)
}
