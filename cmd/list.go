package cmd

import (
	"github.com/spf13/cobra"
)

func init() {
	var listCmd = &cobra.Command{
		Use:   "list",
		Short: "list all registered accounts",
		Args:  cobra.ExactArgs(1),
		RunE: func(c *cobra.Command, args []string) error {
			state, err := load()
			if err != nil {
				return err
			}

			for _, addr := range state.Accounts {
				c.Println(addr)
			}

			return nil
		},
	}
	rootCmd.AddCommand(listCmd)
}
