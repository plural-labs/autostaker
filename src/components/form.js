import { Button, RadioGroup, Radio, FormControlLabel, OutlinedInput, InputAdornment, Popover} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import { useState } from 'react';

export function Register(props) {
    const [frequency, setFrequency] = useState(props.defaultFrequency)
    const [tolerance, setTolerance] = useState(props.defaultTolerance)

    const updateTolerance = (event) => {
        setTolerance(event.target.value)
    }

    const updateFrequency = (event) => {
        setFrequency(parseInt(event.target.value))
    }

    const submit = () => {
        props.onSubmit(frequency, tolerance)
    }
    return (
        <div>
            <div style={{margin: "25px 0px 15px 0px"}}>
                Restake Frequency:
            </div>
            <RadioGroup
                row
                defaultValue={props.defaultTolerance}
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
                endAdornment={<InputAdornment position="end">{props.denom}</InputAdornment>} 
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