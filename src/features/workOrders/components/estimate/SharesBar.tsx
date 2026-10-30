import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface SharesBarProps {
  /** Each executor's share in whole percent (0 for an empty field). */
  values: number[]
  /** Theme colour tokens, one per executor (they repeat when there are more executors than colours). */
  colors: string[]
  /** Accessible names of the executors, in the same order as `values`. */
  labels: string[]
  /** Asks to give the executor before `boundary` the share `left`; the executor after it gets the rest of their pair. */
  onSplit: (boundary: number, left: number) => void
}

// A segment narrower than this (in % of the bar) has no room for its label.
const MIN_LABELED_WIDTH = 10

/**
 * One bar for the 100% with a draggable handle on every boundary between two executors. Dragging a handle moves
 * percent only between its two neighbours, so everybody else keeps what they have.
 */
export function SharesBar({ values, colors, labels, onSplit }: SharesBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [draggedBoundary, setDraggedBoundary] = useState<number | null>(null)

  const total = values.reduce((sum, value) => sum + value, 0)
  // The bar can't show more than a full line: an overshoot is scaled down.
  const scale = total > 100 ? 100 / total : 1

  function sumBefore(index: number): number {
    return values.slice(0, index).reduce((sum, value) => sum + value, 0)
  }

  function dragTo(boundary: number, clientX: number) {
    const rect = barRef.current?.getBoundingClientRect()

    if (!rect || rect.width === 0) {
      return
    }

    const barPercent = ((clientX - rect.left) / rect.width) * 100

    onSplit(boundary, Math.round(barPercent / scale) - sumBefore(boundary))
  }

  return (
    <Box sx={{ position: 'relative', height: 28 }}>
      <Box
        ref={barRef}
        sx={{ display: 'flex', height: '100%', borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}
      >
        {values.map((value, index) => (
          <Box
            key={index}
            sx={{
              width: `${value * scale}%`,
              bgcolor: colors[index % colors.length],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Following the pointer, so no easing while a handle is dragged.
              transition: draggedBoundary === null ? 'width 0.15s' : undefined,
            }}
          >
            {value * scale >= MIN_LABELED_WIDTH && (
              <Typography variant="caption" noWrap sx={{ color: 'common.white', fontWeight: 600, pointerEvents: 'none' }}>
                {value}%
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {values.slice(0, -1).map((value, boundary) => (
        <Box
          key={boundary}
          role="slider"
          tabIndex={0}
          aria-label={`${labels[boundary]} / ${labels[boundary + 1]}`}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${labels[boundary]}: ${value}%`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            setDraggedBoundary(boundary)
          }}
          onPointerMove={(event) => {
            if (draggedBoundary === boundary) {
              dragTo(boundary, event.clientX)
            }
          }}
          onPointerUp={() => {
            setDraggedBoundary(null)
          }}
          onPointerCancel={() => {
            setDraggedBoundary(null)
          }}
          onKeyDown={(event) => {
            const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0

            if (direction !== 0) {
              event.preventDefault()
              onSplit(boundary, value + direction * (event.shiftKey ? 5 : 1))
            }
          }}
          sx={{
            position: 'absolute',
            top: -4,
            bottom: -4,
            left: `${sumBefore(boundary + 1) * scale}%`,
            width: 16,
            ml: '-8px',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'ew-resize',
            touchAction: 'none',
            outline: 'none',
            '&:focus-visible > div, &:hover > div': { borderColor: 'primary.main' },
          }}
        >
          <Box
            sx={{
              width: 6,
              height: '100%',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          />
        </Box>
      ))}
    </Box>
  )
}
