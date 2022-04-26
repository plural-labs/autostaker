import { Link } from '@mui/material'

export function ErrorPage(props) {
    return (
        <div>
            {props.err}
        </div>
    )
}

export function BroadcastingPage() {
    return (
        <div>
            Broadcasting...
        </div>
    )
}

export function LoadingPage() {
    return (
      <div>
        Loading...
      </div>
    )
}

export function KeplrPage() {
    return (
      <div>
        Must have <Link href="https://www.keplr.app/">Keplr</Link> installed
      </div>
    )
}