import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { alpha, keyframes } from '@mui/material/styles'
import { EDGE_ZONE_PX } from '../gridConstants'

const nudge = keyframes`
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(var(--nudge)); }
`

interface EdgeIndicatorProps {
  side: 'left' | 'right'
  active: boolean
  /** The date the calendar will move to, shown while the pointer rests in the zone. */
  label: string
}

/** Screen-edge drop zone shown while dragging a job: resting the pointer here moves the calendar one day. */
export function EdgeIndicator({ side, active, label }: EdgeIndicatorProps) {
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon
  const towardsEdge = side === 'left' ? '-10px' : '10px'

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: EDGE_ZONE_PX,
        zIndex: 1300,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: 'primary.main',
        transition: 'background 150ms',
        background: (theme) => {
          const strength = active ? 0.35 : 0.12
          const direction = side === 'left' ? 'to right' : 'to left'
          return `linear-gradient(${direction}, ${alpha(theme.palette.primary.main, strength)}, ${alpha(theme.palette.primary.main, 0)})`
        },
      }}
    >
      <Icon
        sx={{
          fontSize: 64,
          opacity: active ? 1 : 0.5,
          transition: 'opacity 150ms',
          '--nudge': towardsEdge,
          animation: active ? `${nudge} 600ms ease-in-out infinite` : 'none',
        }}
      />
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, opacity: active ? 1 : 0, transition: 'opacity 150ms', textAlign: 'center' }}
      >
        {label}
      </Typography>
    </Box>
  )
}
