package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/cosmos/cosmos-sdk/crypto/keyring"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/bech32"
	"github.com/cosmos/cosmos-sdk/x/authz"

	distribution "github.com/cosmos/cosmos-sdk/x/distribution/types"
	"github.com/cosmos/cosmos-sdk/x/feegrant"
	staking "github.com/cosmos/cosmos-sdk/x/staking/types"
	"github.com/spf13/cobra"

	"github.com/plural-labs/stakebot/client"
	"github.com/plural-labs/stakebot/types"
)

func init() {
	var (
		frequency      string
		tolerance      int64
		keyringDir     string
		appName        string
		keyringBackend string
		fee            int64
	)
	var registerCmd = &cobra.Command{
		Use:   "register [address]",
		Short: "Set up an account with a stakebot",
		Example: `autostaker register cosmos147l494tccpk7ecr8vmqc67y542tl90659dgvda 
--app gaia --keyring-backend os --frequency hourly --fee 10`,
		Args: cobra.ExactArgs(2),
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

			_, bz, err := bech32.DecodeAndConvert(args[1])
			if err != nil {
				return err
			}
			userAddress := sdk.AccAddress(bz)

			// check that the key exists
			if _, err := signer.KeyByAddress(userAddress); err != nil {
				return fmt.Errorf("key by address: %w", err)
			}

			botAddress, err := getStakebotAddress(url, chain.Id)
			if err != nil {
				return err
			}

			c.Printf("Authorizing autostaking bot (%s) with address %s on %s\n", botAddress.String(), userAddress.String(), chain.Id)

			client := client.New(signer, chains)
			subCtx, cancel := context.WithTimeout(c.Context(), 1*time.Minute)
			defer cancel()
			if err := AuthorizeRestaking(subCtx, client, userAddress, botAddress, sdk.NewCoin(chain.NativeDenom, sdk.NewInt(fee))); err != nil {
				return err
			}

			c.Printf("Completed authorization process. Registering address with autostaker\n")

			queryStr := fmt.Sprintf("%s/v1/register?address=%s", url, userAddress.String())
			if tolerance >= 0 {
				queryStr += fmt.Sprintf("&tolerance=%d", tolerance)
			}
			if frequency != "" {
				queryStr += fmt.Sprintf("&frequency=%s", frequency)
			}

			registerResp, err := http.Get(queryStr)
			if err != nil {
				return err
			}
			if registerResp.StatusCode != 200 {
				body, err := ioutil.ReadAll(registerResp.Body)
				if err != nil {
					return fmt.Errorf("Failed to read body from GET /register: %w", err)
				}
				return fmt.Errorf("Received unexpected code %d from url with GET /register: %s", registerResp.StatusCode, body)
			}

			c.Printf("Successfully registered %s\n", userAddress.String())

			state.Accounts = append(state.Accounts, userAddress.String())

			homeDir, err := os.UserHomeDir()
			if err != nil {
				return err
			}

			file := filepath.Join(homeDir, defaultFilePath)
			return state.Save(file)
		},
	}

	registerCmd.Flags().Int64Var(&tolerance, "tolerance", -1, "How many native tokens to remain liquid for fees")
	registerCmd.Flags().StringVar(&frequency, "frequency", "", "How often to restake (quarterday|daily|weekly|monthly)")
	registerCmd.Flags().StringVar(&appName, "app", "", "Name of the application")
	registerCmd.Flags().StringVar(&keyringDir, "keyring-dir", "", "Directory where the keyring is stored")
	registerCmd.Flags().StringVar(&keyringBackend, "keyring-backend", keyring.BackendOS, "Select keyring's backend (os|file|test)")
	registerCmd.Flags().Int64Var(&fee, "fee", 0, "The fee to submit the transaction")

	rootCmd.AddCommand(registerCmd)
}

func AuthorizeRestaking(ctx context.Context, c *client.Client, userAddress, botAddress sdk.AccAddress, fee sdk.Coin) error {
	delegateAuth := authz.NewGenericAuthorization(sdk.MsgTypeURL(&staking.MsgDelegate{}))
	claimAuth := authz.NewGenericAuthorization(sdk.MsgTypeURL(&distribution.MsgWithdrawDelegatorReward{}))
	inTenYears := time.Now().Add(10 * 365 * 24 * time.Hour)

	authorizeDelegationsMsg, err := authz.NewMsgGrant(userAddress, botAddress, delegateAuth, inTenYears)
	if err != nil {
		return fmt.Errorf("creating authorize delegation msg: %w", err)
	}

	authorizeClaimMsg, err := authz.NewMsgGrant(userAddress, botAddress, claimAuth, inTenYears)
	if err != nil {
		return fmt.Errorf("creating authorize claim msg: %w", err)
	}

	allowedMsg, err := feegrant.NewAllowedMsgAllowance(&feegrant.BasicAllowance{SpendLimit: nil, Expiration: &inTenYears}, []string{sdk.MsgTypeURL(&authz.MsgExec{})})
	if err != nil {
		return fmt.Errorf("creating feegrant allowance: %w", err)
	}
	feegrantMsg, err := feegrant.NewMsgGrantAllowance(allowedMsg, userAddress, botAddress)
	if err != nil {
		return fmt.Errorf("creating feegrant allowance: %w", err)
	}

	resp, err := c.Send(ctx, []sdk.Msg{authorizeDelegationsMsg, authorizeClaimMsg, feegrantMsg}, client.WithFee(fee), client.WithPubKey())
	if err != nil {
		return fmt.Errorf("sending restaking msgs: %w", err)
	}

	if resp.Code != 0 {
		return fmt.Errorf("failed to submit transaction: %s", resp.RawLog)
	}

	return nil
}

func getChainsFromRegistry(url string) (types.ChainRegistry, error) {
	chainsResp, err := http.Get(fmt.Sprintf("%s/v1/chains", url))
	if err != nil {
		return nil, err
	}
	if chainsResp.StatusCode != 200 {
		return nil, fmt.Errorf("Received unexpected code %d from url", chainsResp.StatusCode)
	}

	chainBytes, err := ioutil.ReadAll(chainsResp.Body)
	if err != nil {
		return nil, err
	}
	var chains types.ChainRegistry
	err = json.Unmarshal(chainBytes, &chains)
	if err != nil {
		return nil, err
	}
	return chains, nil
}

func getStakebotAddress(url, chainID string) (sdk.AccAddress, error) {
	addressResp, err := http.Get(fmt.Sprintf("%s/v1/address?chain_id=%s", url, chainID))
	if err != nil {
		return nil, err
	}

	if addressResp.StatusCode != 200 {
		return nil, fmt.Errorf("Received unexpected code %d from url with GET /address", addressResp.StatusCode)
	}

	addressBytes, err := ioutil.ReadAll(addressResp.Body)
	if err != nil {
		return nil, err
	}

	var address string
	err = json.Unmarshal(addressBytes, &address)
	if err != nil {
		return nil, err
	}

	_, bz, err := bech32.DecodeAndConvert(address)
	if err != nil {
		return nil, err
	}
	if err != nil {
		return nil, fmt.Errorf("Autostaking bot provided incorrect address %s, %w", address, err)
	}

	return sdk.AccAddress(bz), nil
}
