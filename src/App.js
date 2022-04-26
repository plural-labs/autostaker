import { createTheme, ThemeProvider } from '@mui/material/styles';
import "@fontsource/roboto"
import './App.css';
import { Container, Stack, Button, Link, Select, MenuItem } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState } from 'react';
import axios from 'axios';
import { Register } from './components/form'
import { LoadingPage, BroadcastingPage, ErrorPage, KeplrPage } from './components/dialog'
import { HoveringCrystal } from './components/animations'
import { registerAddress, cancelAddress, stakebotUrl } from './chain'

function App() {
  let theme = createTheme({
    palette: {
      primary: {
        main: '#17d2ff',
      },
      secondary: {
        main: '#edf2ff',
      },
    },
  });
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" className="header">
          <Stack direction="row" alignItems="center">
            <h1>Autostaker</h1>
            <div className="beta">BETA</div>
          </Stack>
          <div>
            <Link href="https://github.com/plural-labs/stakebot" color="#000000">
              <GitHubIcon></GitHubIcon>
            </Link>
          </div>
        </Stack>
        <Stack direction="row" alignItems="center" className="main">
          <div style={{ width: "50%", margin: "auto", display: "block"}}>
            <HoveringCrystal />
          </div>
          <Container style={{width: "50%"}}>
            <Display />
          </Container>
        </Stack>
        <div className="footer">
          <h1 variant="h1">
            Plural
          </h1>
        </div>
      </Container>
    </ThemeProvider>
  );
}

function Display() {
  const [firstTime, setFirstTime] = useState(true)
  const [connected, setConnected] = useState(false)
  const [chains, setChains] = useState([])
  const [chainIdx, setChainIdx] = useState(0)
  const [accounts, setAccounts] = useState([])
  const [accountIdx, setAccountIdx] = useState(0)
  const [status, setStatus] = useState(undefined)
  const [broadcasting, setBroadcasting] = useState("")
  const [err, setErr] = useState("")

  // if we have an error display it
  if (err !== "") {
    return <ErrorPage err={err} />
  }

  // if we are broadcasting a message then signal this
  // to users.
  if (broadcasting !== "") {
    return <BroadcastingPage />
  }

  // if this is the first time, show the entry display
  if (firstTime) {
    const onClick = () => { setFirstTime(false); }
    return (
      <div>
        <p className="opener">
          Automagically compound your stake across Cosmos chains
        </p>
        <Button style={{ fontSize: "16px"}} variant="outlined" onClick={onClick} endIcon={<ArrowForwardIcon />}>
          Get Started
        </Button>
      </div>
    )
  }

  // check that the user has keplr enabled
  if (!window.getOfflineSigner || !window.keplr) {
    
  }

  // query all chain information from the stakebot
  if (chains.length === 0) {
    axios.get(stakebotUrl + "/v1/chains").then((response) => {
      console.log(response);
      if (response.data.length > 0) {
        setChains(response.data)
      } else {
        setErr("no chains found at " + stakebotUrl)
      }
    }).catch((error) => {
      setErr(error.message)
    })
  }
  
  // connect to keplr with a chain-id and get the account information
  if (!connected && chains.length > 0) {
    console.log("enabling keplr")
    window.keplr.enable(chains[chainIdx].Id).then(() => {
      console.log("getting accounts")
      const offlineSigner = window.keplr.getOfflineSigner(chains[chainIdx].Id)
      offlineSigner.getAccounts().then(accs => { 
        setAccounts(accs)
        setConnected(true)
        console.log(accs)
      }).catch(err => { setErr(err.message)})
    }).catch(() => { setFirstTime(true)})
  }

  // get the status of an account from the stakebot
  if (connected && accounts.length > 0 && status === undefined) {
    axios.get(stakebotUrl + "/v1/status?address=" + accounts[accountIdx].address).then((response) => {
      console.log(response.data);
      setStatus(response.data)
    }).catch((error) => {
      setErr(error.message)
    })
  }

  // while waiting for resources we return a loading page
  if (!connected) {
    return <LoadingPage />
  }

  const chain = chains[chainIdx]

  // function to register a user
  const submit = async (frequency, tolerance) => { 
    const offlineSigner = window.keplr.getOfflineSigner(chains.Id)

    // send the authorization messages and register the address to the stakebot
    setBroadcasting("Broadcasting authorization messages for " + accounts[accountIdx].address)
    try {
      await registerAddress(offlineSigner, chain.RPC, accounts[accountIdx].address, frequency, tolerance)
    } catch (err) {
      setErr(err.message)
    }
    
    // get the status of the address from the stakebot now that the address has been registered
    // This will now trigger the view showing the users status
    setBroadcasting("Registering " + accounts[accountIdx].address + " to stakebot")
    axios.get(stakebotUrl + "/v1/status?address=" + accounts[accountIdx].address).then((response) => {
      console.log(response.data);
      setStatus(response.data)
      setBroadcasting("")
    }).catch((error) => {
      setErr(error.message)
    })
  }

  return (
    <div>
      <div style={{margin: "10px 0px"}}>
        Chain:
      </div> 
      <Select
        defaultValue={chain.Id}
      >
        <MenuItem value={chain.Id}>
          <code>
            {chain.Id}
          </code>
        </MenuItem>
      </Select>
      <div style={{margin: "10px 0px"}}>
        Account:
      </div> 
      <code>
        {accounts[0].address}
      </code>
      <Register 
        onSubmit={submit} 
        defaultFrequency={chain.DefaultFrequency} 
        defaultTolerance={chain.DefaultTolerance}
        denom={chain.NativeDenom} 
      />
    </div>
  )
}

export default App;
