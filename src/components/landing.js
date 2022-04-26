import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button } from '@mui/material'


export default function Landing(props) {
    return (
      <div>
        <p className="opener">
          Automagically compound your stake across Cosmos chains
        </p>
        <Button style={{ fontSize: "16px"}} variant="outlined" onClick={props.onClick} endIcon={<ArrowForwardIcon />}>
          Get Started
        </Button>
      </div>
    )
}