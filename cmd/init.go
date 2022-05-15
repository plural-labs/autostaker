package cmd

import (
	"net/url"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

const (
	defaultFilePath = ".autostaker.toml"
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

		if err := state.Save(file); err != nil {
			return err
		}
		c.Printf("Initialized autostaker at %s\n", file)
		return nil
	},
}

func load() (State, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return State{}, err
	}

	file := filepath.Join(homeDir, defaultFilePath)
	return LoadState(file)
}
