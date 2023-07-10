package main

import (
	"fmt"
	"os"

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
				Usage:   "Set the environment to development",
				Value:   true,
			},
			&cli.BoolFlag{
				Name:    "production",
				Aliases: []string{"prod"},
				Usage:   "Set the environment to production",
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
	logger, err := NewConsoleLogger()

	if err != nil {
		return err
	}

	l := logger.Sugar()

	err = LoadEnv()

	if err != nil {
		return err
	}

	l.Infof("Loaded environment variables")

	env := Dev

	if c.Bool("production") {
		env = Prod
	}

	// if env == Dev {
	// 	err = PingEthereumNode("http://localhost:8545", 3)

	// 	if err != nil {
	// 		return err
	// 	}
	// }

	l.Infof("Environment set to %s", env)

	// chain crawler
	// _, err = NewEthereumCrawler(CrawlerConfig{Env: env})

	// if err != nil {
	// 	return err
	// }

	// // chain streamer
	// _, err = NewEthereumStreamer(StreamerConfig{Fork: false, Env: env})

	// if err != nil {
	// 	return err
	// }

	// fork streamer

	config := Config{Fork: true, Env: env}

	forkCrawler, err := NewEthereumCrawler(config)

	if err != nil {
		return err
	}

	err = forkCrawler.Crawl()

	if err != nil {
		return err
	}

	// forkStreamer, err := NewEthereumStreamer(config)

	// if err != nil {
	// 	return err
	// }

	// err = forkStreamer.Stream()

	// if err != nil {
	// 	return err
	// }

	return nil
}
