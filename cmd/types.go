package cmd

import (
	"fmt"
	"os"

	"github.com/BurntSushi/toml"
)

type State struct {
	Registry string   `toml:"registry"`
	Accounts []string `toml:"accounts"`
}

func NewState(registry string) State {
	return State{
		Registry: registry,
	}
}

func LoadState(filepath string) (State, error) {
	_, err := os.Stat(filepath)
	if os.IsExist(err) {
		return State{}, err
	}

	var state State
	_, err = toml.DecodeFile(filepath, &state)
	if err != nil {
		return State{}, fmt.Errorf("failed to load state from %q: %w", filepath, err)
	}
	return state, nil
}

func (s State) Save(filepath string) error {
	f, err := os.Create(filepath)
	if err != nil {
		return fmt.Errorf("failed to save autostaker file %q: %w", filepath, err)
	}
	return toml.NewEncoder(f).Encode(s)
}
