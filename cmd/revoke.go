package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/cosmos/cosmos-sdk/crypto/keyring"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/bech32"
	"github.com/plural-labs/stakebot/client"
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(makeCancelCmd())
}

func makeCancelCmd() *cobra.Command {
	var (
		keyringDir     string
		appName        string
		keyringBackend string
		fee            int64
	)
	var cancelCmd = &cobra.Command{
		Use:   "cancel [address]",
		Short: "Stops the autostaker for an address. Revokes all permissions to the stakebot",
		Args:  cobra.ExactArgs(1),
		RunE: func(c *cobra.Command, args []string) error {
			state, err := load()
			if err != nil {
				return fmt.Errorf("loading url: %w", err)
			}
			url := state.Registry

			if keyringDir == "" {
				keyringDir, err = os.UserHomeDir()
				if err != nil {
					return err
				}
			}

			signer, err := keyring.New(appName, keyringBackend, keyringDir, os.Stdin)
			if err != nil {
				return err
			}

			_, bz, err := bech32.DecodeAndConvert(args[1])
			if err != nil {
				return err
			}
			userAddress := sdk.AccAddress(bz)

			// check that the key exists
			if _, err := signer.KeyByAddress(userAddress); err != nil {
				return fmt.Errorf("key by address: %w", err)
			}

			// get the chain information from the registry
			chains, err := getChainsFromRegistry(url)
			if err != nil {
				return err
			}

			chain, err := chains.FindChainFromAddress(args[1])
			if err != nil {
				return fmt.Errorf("autostaker bot does not support any chain with the address %s", args[1])
			}

			// set the config to match the chain's prefix
			sdk.GetConfig().SetBech32PrefixForAccount(chain.Prefix, chain.Prefix+"pub")

			botAddress, err := getStakebotAddress(url, chain.Id)
			if err != nil {
				return err
			}

			client := client.New(signer, chains)

			err = RevokeRestaking(context.TODO(), client, userAddress, botAddress)
			if err != nil {
				return fmt.Errorf("failed to cancel: %w", err)
			}

			c.Printf("Successfully removed %s from autostaking\n", userAddress)

			return nil
		},
	}
	cancelCmd.Flags().StringVar(&appName, "app", "", "Name of the application")
	cancelCmd.Flags().StringVar(&keyringDir, "keyring-dir", "", "Directory where the keyring is stored")
	cancelCmd.Flags().StringVar(&keyringBackend, "keyring-backend", keyring.BackendOS, "Select keyring's backend (os|file|test)")
	cancelCmd.Flags().Int64Var(&fee, "fee", 0, "The fee to submit the transaction")
	return cancelCmd
}

// TODO: Implement ability to revoke restaking
func RevokeRestaking(ctx context.Context, client *client.Client, userAddress, botAddress sdk.AccAddress) error {
	panic("Not Implemented")
	return nil
}
