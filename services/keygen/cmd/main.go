package main

import (
	"github.com/consensusnetworks/casimir/services/keygen"
)

var (
	// AppName is the application name
	AppName = "Casimir Keygen"

	// Version is the app version
	Version = "latest"
)

func main() {
	keygen.Execute(AppName, Version)
}
