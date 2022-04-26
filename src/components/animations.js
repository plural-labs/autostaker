import { animated, easings, useSpring } from 'react-spring'
import crystal from '../blue_crystal.svg'

export function HoveringCrystal() {
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