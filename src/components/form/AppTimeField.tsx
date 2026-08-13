import { useId, useMemo, useRef, useState } from 'react'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Box from '@mui/material/Box'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

export interface AppTimeFieldProps {
  label?: string
  value: number | null
  onChange: (value: number) => void
  stepMinutes?: number
  maxHour?: number
  required?: boolean
  disabled?: boolean
  id?: string
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

function splitValue(value: number | null): { hourText: string; minuteText: string } {
  if (value === null) {
    return { hourText: '', minuteText: '' }
  }
  return { hourText: pad2(Math.floor(value / 60)), minuteText: pad2(value % 60) }
}

export function AppTimeField({
  label,
  value,
  onChange,
  stepMinutes = 15,
  maxHour = 23,
  required,
  disabled,
  id,
}: AppTimeFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  const [editing, setEditing] = useState<{ hourText: string; minuteText: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const paperRef = useRef<HTMLDivElement | null>(null)

  const hourRef = useRef<HTMLInputElement | null>(null)
  const minuteRef = useRef<HTMLInputElement | null>(null)

  const { hourText, minuteText } = editing ?? splitValue(value)
  const focused = editing !== null

  function commit(nextHourText: string, nextMinuteText: string) {
    const hour = nextHourText === '' ? 0 : Number.parseInt(nextHourText, 10)
    const minute = nextMinuteText === '' ? 0 : Math.min(Number.parseInt(nextMinuteText, 10), 59)
    onChange(hour * 60 + minute)
  }

  function isInsideWidget(node: Node | null): boolean {
    if (!node) {
      return false
    }
    return !!anchorEl?.contains(node) || !!paperRef.current?.contains(node)
  }

  function handleFocus() {
    setEditing((prev) => prev ?? splitValue(value))
    setOpen(true)
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (isInsideWidget(event.relatedTarget as Node | null)) {
      return
    }
    setEditing(null)
    setOpen(false)
  }

  function handleHourChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 2)
    setEditing({ hourText: digits, minuteText })
    commit(digits, minuteText)
    if (digits.length === 2) {
      minuteRef.current?.focus()
      minuteRef.current?.select()
    }
  }

  function handleMinuteChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 2)
    setEditing({ hourText, minuteText: digits })
    commit(hourText, digits)
  }

  function handleHourKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowRight') {
      minuteRef.current?.focus()
    }
    if (event.key === 'Escape' || event.key === 'Enter') {
      hourRef.current?.blur()
      minuteRef.current?.blur()
      setOpen(false)
    }
  }

  function handleMinuteKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && minuteText === '') {
      hourRef.current?.focus()
    }
    if (event.key === 'ArrowLeft' && minuteRef.current?.selectionStart === 0) {
      hourRef.current?.focus()
    }
    if (event.key === 'Escape' || event.key === 'Enter') {
      hourRef.current?.blur()
      minuteRef.current?.blur()
      setOpen(false)
    }
  }

  function handleSelectOption(optionMinutes: number) {
    setEditing(splitValue(optionMinutes))
    onChange(optionMinutes)
    setOpen(false)
  }

  const options = useMemo(() => {
    const items: number[] = []
    for (let m = 0; m <= maxHour * 60 + 59; m += stepMinutes) {
      items.push(m)
    }
    return items
  }, [maxHour, stepMinutes])

  const currentTotal =
    hourText === '' && minuteText === ''
      ? null
      : (hourText === '' ? 0 : Number.parseInt(hourText, 10)) * 60 + (minuteText === '' ? 0 : Number.parseInt(minuteText, 10))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
      {label && (
        <Typography variant="body2" component="label" htmlFor={inputId} sx={{ fontWeight: 600, color: 'text.primary' }}>
          {label}
          {required && (
            <Box component="span" sx={{ color: 'error.main' }}>
              {' *'}
            </Box>
          )}
        </Typography>
      )}
      <ClickAwayListener
        onClickAway={() => {
          setOpen(false)
          setEditing(null)
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            ref={setAnchorEl}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '42px',
              boxSizing: 'border-box',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: focused ? 'primary.main' : 'divider',
              boxShadow: focused ? (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
              backgroundColor: 'background.paper',
              opacity: disabled ? 0.5 : 1,
              pl: '14px',
              pr: '4px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                id={inputId}
                component="input"
                ref={hourRef}
                value={hourText}
                disabled={disabled}
                placeholder="--"
                inputMode="numeric"
                maxLength={2}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleHourChange}
                onKeyDown={handleHourKeyDown}
                sx={{
                  width: '18px',
                  border: 'none',
                  outline: 'none',
                  p: 0,
                  fontSize: (theme) => theme.typography.body1.fontSize,
                  fontFamily: 'inherit',
                  textAlign: 'right',
                  backgroundColor: 'transparent',
                  color: 'text.primary',
                  '&::placeholder': { color: 'text.disabled', opacity: 1 },
                }}
              />
              <Typography component="span" sx={{ px: '2px', color: 'text.primary' }}>
                :
              </Typography>
              <Box
                component="input"
                ref={minuteRef}
                value={minuteText}
                disabled={disabled}
                placeholder="--"
                inputMode="numeric"
                maxLength={2}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleMinuteChange}
                onKeyDown={handleMinuteKeyDown}
                sx={{
                  width: '18px',
                  border: 'none',
                  outline: 'none',
                  p: 0,
                  fontSize: (theme) => theme.typography.body1.fontSize,
                  fontFamily: 'inherit',
                  backgroundColor: 'transparent',
                  color: 'text.primary',
                  '&::placeholder': { color: 'text.disabled', opacity: 1 },
                }}
              />
            </Box>
            <IconButton
              size="small"
              disabled={disabled}
              tabIndex={-1}
              onClick={() => {
                setOpen((prev) => !prev)
                hourRef.current?.focus()
              }}
            >
              <AccessTimeIcon fontSize="small" color={focused || open ? 'primary' : 'action'} />
            </IconButton>
          </Box>

          <Popper open={open && !disabled} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
            <Paper
              ref={paperRef}
              variant="outlined"
              sx={{ mt: '4px', minWidth: 96, maxHeight: 260, overflowY: 'auto', borderRadius: '8px' }}
            >
              <MenuList dense>
                {options.map((option) => (
                  <MenuItem key={option} selected={currentTotal === option} onClick={() => handleSelectOption(option)}>
                    {pad2(Math.floor(option / 60))}:{pad2(option % 60)}
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Popper>
        </Box>
      </ClickAwayListener>
    </Box>
  )
}
