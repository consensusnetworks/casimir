package main

import (
	"os"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()

	if err != nil {
		panic(err)
	}

	err = Run(os.Args)

	if err != nil {
		panic(err)
	}
	os.Exit(0)
}
