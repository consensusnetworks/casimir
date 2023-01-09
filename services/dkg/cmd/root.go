package cmd

import (
	"github.com/consensusnetworks/casimir/services/dkg"
)

var (
	// AppName is the application name
	AppName = "Casimir SSV DKG"

	// Version is the app version
	Version = "latest"
)

func main() {
	dkg.Execute(AppName, Version)
}
