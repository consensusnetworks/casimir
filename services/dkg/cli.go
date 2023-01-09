package dkg

import (
	"log"

	"github.com/spf13/cobra"
	"go.uber.org/zap"
	// "github.com/bloxapp/ssv/cli/bootnode"
	// "github.com/bloxapp/ssv/cli/operator"
)

// Logger is the default logger
var Logger *zap.Logger

// RootCmd represents the root command of SSV CLI
var RootCmd = &cobra.Command{
	Use:   "dkg",
	Short: "Casimir SSV DKG",
	Long:  `Casimir SSV DKG is a CLI for running distributed key generation with SSV operators.`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
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

func init() {
	// RootCmd.AddCommand(bootnode.StartBootNodeCmd)
	// RootCmd.AddCommand(operator.StartNodeCmd)
}
