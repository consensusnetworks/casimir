package main

import (
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() error {
	err := godotenv.Load()

	if err != nil {
		panic(err)
	}
	return nil
}

func main() {

	LoadEnv()

	err := Run(os.Args)

	if err != nil {
		panic(err)
	}
	os.Exit(0)
}
