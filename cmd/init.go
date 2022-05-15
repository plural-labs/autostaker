package cmd

import (
	"net/url"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

const (
	defaultFilePath = ".autostaker"
)

func init() {
	rootCmd.AddCommand(initCmd)
}

var initCmd = &cobra.Command{
	Use:   "init [url]",
	Short: "Initializes the autostaker client with a respective stakebot server url",
	Args:  cobra.ExactArgs(1),
	RunE: func(c *cobra.Command, args []string) error {
		_, err := url.Parse(args[0])
		if err != nil {
			return err
		}

		state := NewState(args[0])

		homeDir, err := os.UserHomeDir()
		if err != nil {
			return err
		}

		file := filepath.Join(homeDir, defaultFilePath)

		return state.Save(file)
	},
}

func load() (*State, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	file := filepath.Join(homeDir, defaultFilePath)
	return LoadState(file)
}
