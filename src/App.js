
import crystal from './blue_crystal.svg'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import "@fontsource/roboto"
import './App.css';
import { Container, Stack, Button, Link, Select, MenuItem, RadioGroup, Radio, FormControlLabel, OutlinedInput, InputAdornment, Popover} from '@mui/material';
import { animated, easings, useSpring } from 'react-spring'
import GitHubIcon from '@mui/icons-material/GitHub';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState } from 'react';
import HelpIcon from '@mui/icons-material/Help';
import axios from 'axios';

const stakebotUrl = "https://autostaker.plural.to"

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

function HoveringCrystal() {
  const styles = useSpring({
    loop: { reverse: true },
    from: { y: -10 },
    to: { y: 10 },
    config: { 
      duration: 2000,
      easing: easings.easeInOutQuad,
    },
  })

  return (
    <animated.div
      style={{
        width: '35vh',
        margin: '0 auto',
        ...styles,
      }}
    >
      <img src={crystal} alt="hovering crystal" className="crystal" />
    </animated.div>
  )
}

function Display() {
  const [firstTime, setFirstTime] = useState(true)
  const [connected, setConnected] = useState(false)
  const [chains, setChains] = useState([])
  const [chainIdx, setChainIdx] = useState(0)
  const [accounts, setAccounts] = useState([])
  const [accountIdx, setAccountIdx] = useState(0)
  const [status, setStatus] = useState(undefined)
  const [frequency, setFrequency] = useState(0)
  const [tolerance, setTolerance] = useState(0)
  const [err, setErr] = useState("")
  if (err !== "") {
    return (
      <div>
        {err}
      </div>
    )
  }
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

  if (!keplrEnabled()) {
    return (
      <div>
        Must have <Link href="https://www.keplr.app/">Keplr</Link> installed
      </div>
    )
  }

  if (chains.length === 0) {
    axios.get(stakebotUrl + "/v1/chains").then((response) => {
      console.log(response);
      if (response.data.length > 0) {
        setChains(response.data)
        setTolerance(response.data[0].DefaultTolerance)
        setFrequency(response.data[0].DefaultFrequency)
      } else {
        setErr("no chains found at " + stakebotUrl)
      }
    }).catch((error) => {
      setErr(error.message)
    })
  }


  if (!connected && chains.length > 0) {
    console.log("enabling keplr")
    window.keplr.enable(chains[chainIdx].Id).then(() => {
      setConnected(true)
    }).catch(() => { setFirstTime(true)})
  }

  if (connected && chains.length > 0 && accounts.length == 0) {
    console.log("getting accounts")
    const offlineSigner = window.keplr.getOfflineSigner(chains[chainIdx].Id)
    offlineSigner.getAccounts().then(accs => { 
      setAccounts(accs)
      console.log(accs)
    }).catch(err => { setErr(err.message)})
  }

  if (accounts.length > 0 && status === undefined) {
    axios.get(stakebotUrl + "/v1/status?address=" + accounts[accountIdx].address).then((response) => {
      console.log(response.data);
      setStatus(response.data)
    }).catch((error) => {
      setErr(error.message)
    })
  }

  if (!connected || accounts.length === 0 || status === undefined) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  const updateTolerance = (event) => {
    setTolerance(event.target.value)
  }

  const updateFrequency = (event) => {
    setFrequency(parseInt(event.target.value))
  }

  const submit = () => { 
    alert("Submit")
  }

  const Info = (
    <div>
      <div style={{margin: "25px 0px 15px 0px"}}>
        Restake Frequency:
      </div>
      <RadioGroup
        row
        defaultValue={chains[chainIdx].DefaultFrequency}
        onChange={updateFrequency}
      >
        <FormControlLabel value={2} control={<Radio size="small" />} label={<span style={{fontSize: "14px"}}>Every 6 Hours</span>} />
        <FormControlLabel value={3} control={<Radio size="small" />} label={<span style={{fontSize: "14px"}}>Daily</span>} />
        <FormControlLabel value={4} control={<Radio size="small" />} label={<span style={{fontSize: "14px"}}>Weekly</span>} />
        <FormControlLabel value={5} control={<Radio size="small" />} label={<span style={{fontSize: "14px"}}>Monthly</span>} />
      </RadioGroup>
      <ToleranceWithHelpIcon />
      <OutlinedInput
        value={tolerance}
        type="number"
        size="small"
        endAdornment={<InputAdornment position="end">{chains[chainIdx].NativeDenom}</InputAdornment>} 
        onChange={updateTolerance}
      />
      <br></br>
      <div style={{ float: "right", padding: "20px"}}>
        <Button variant="outlined" onClick={submit}>
          Submit
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{margin: "10px 0px"}}>
        Chain:
      </div> 
      <Select
        defaultValue={chains[chainIdx].Id}
      >
        <MenuItem value={chains[chainIdx].Id}>
          <code>
            {chains[chainIdx].Id}
          </code>
        </MenuItem>
      </Select>
      <div style={{margin: "10px 0px"}}>
        Account:
      </div> 
      <code>
        {accounts[0].address}
      </code>
      {Info}
    </div>
  )
}

function keplrEnabled() {
  return window.getOfflineSigner && window.keplr
}

function ToleranceWithHelpIcon() {
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div style={{ margin: "15px 0px"}}>
      <span style={{ marginBottom: "5px"}}>Tolerance</span>
      <HelpIcon sx={{ paddingLeft: "10px", fontSize: "18px", marginTop: "0px", position: "absolute" }}
        aria-owns={open ? 'mouse-over-popover' : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      />
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none',
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <div style={{ padding: "8px"}}>
          The amount to remain liquid in your account
        </div>
      </Popover>
    </div>
  );
}

export default App;
