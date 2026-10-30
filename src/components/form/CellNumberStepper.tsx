import type { ClipboardEvent, DragEvent, KeyboardEvent } from 'react'
import TextField from '@mui/material/TextField'

interface CellNumberStepperProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  min?: number
  max?: number
}

// The only keys that do anything: the arrows step the value, Tab moves on. Everything else is swallowed.
const ALLOWED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Tab'])

function blockEvent(event: ClipboardEvent | DragEvent) {
  event.preventDefault()
}

/**
 * Compact whole-number input for table cells that is changed only with its up/down arrows (or the arrow keys): typing,
 * pasting and dropping are blocked, so the value is always an integer of at least `min` (and at most `max`, if given).
 */
export function CellNumberStepper({ value, onChange, ariaLabel, min = 1, max }: CellNumberStepperProps) {
  function handleKeyDown(event: KeyboardEvent) {
    if (!ALLOWED_KEYS.has(event.key)) {
      event.preventDefault()
    }
  }

  return (
    <TextField
      type="number"
      size="small"
      variant="outlined"
      fullWidth
      value={value}
      onChange={(event) => {
        const parsed = Math.floor(Number(event.target.value))
        const atLeastMin = Number.isFinite(parsed) && parsed >= min ? parsed : min
        onChange(String(max !== undefined ? Math.min(atLeastMin, max) : atLeastMin))
      }}
      onKeyDown={handleKeyDown}
      onPaste={blockEvent}
      onDrop={blockEvent}
      // The browser's up/down arrows sit at the end of the input's padding box: a small right padding puts them near the border.
      sx={{ '& .MuiInputBase-input': { textAlign: 'right', pr: '4px' } }}
      slotProps={{ htmlInput: { 'aria-label': ariaLabel, min, max, step: 1, inputMode: 'none' } }}
    />
  )
}
