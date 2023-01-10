package keygen

import (
	"fmt"
	"log"

	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

// Logger is the default logger
var Logger *zap.Logger

// RootCmd represents the root command of SSV CLI
var RootCmd = &cobra.Command{
	Use:   "keygen",
	Short: "Casimir Keygen",
	Long:  `Casimir Keygen is a CLI for managing multi-party key generation.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Running Casimir Keygen")
	},
}

// Execute executes the root command
func Execute(appName, version string) {
	RootCmd.Short = appName
	RootCmd.Version = version

	if err := RootCmd.Execute(); err != nil {
		log.Fatal("failed to execute root command", zap.Error(err))
	}
}

func init() {}
