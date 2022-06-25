# Autostaker

Autostaker is a client-side CLI for interacting with the [Stakebot](https://github.com/plural-labs/stakebot).

## Usage

1. Clone the repo `git clone https://github.com/plural-labs/autostaker`.
2. Install the `autostaker`: `go install` from the root directory.
3. Run `autostaker register <url> <account>`. For example `autostaker register http://localhost:8000 cosmos1vhpsuaxg51gvvzwyhqejvwfved5ywa3n6vl4ld`. You will need to tell the command where your keyring is by appending the following flags:
   1. `--app` i.e. `--app gaia`
   2. `--keyring-backend` i.e. `--keyring-backend test`
   3. `--keyring-dir` i.e. `--keyring-dir ~/.gaiad`
   4. `--tolerance` i.e. `--tolerance 1000000`
   5. `--frequency` i.e. `--frequency daily`
4. You can confirm that everything was successful by running `autostaker status <url> <address>`

It is also possible to manually trigger a restake: `autostaker restake <url> <address>`

