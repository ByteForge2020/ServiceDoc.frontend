import type { KeyboardEvent, ReactNode } from 'react'
import Box from '@mui/material/Box'

// Everything that can be clicked or typed into, native or not (a chip, a select, a slider...).
const INTERACTIVE = [
  'input',
  'textarea',
  'select',
  'button',
  'a',
  '[role="button"]',
  '[role="combobox"]',
  '[role="slider"]',
  '[role="switch"]',
  '[tabindex]',
]
  .map((selector) => `& ${selector}`)
  .join(', ')

// Tab still moves through the page and the usual shortcuts (copy, select all) still work; every other key is swallowed
// before a control can act on it.
function blockEditingKeys(event: KeyboardEvent<HTMLElement>) {
  if (event.key === 'Tab' || event.ctrlKey || event.metaKey) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
}

interface ReadOnlyScopeProps {
  active: boolean
  children: ReactNode
}

/**
 * Makes everything inside look and behave read-only while `active`, without every control having to know about it:
 * native controls are disabled through a fieldset, the rest (chips, selects, links) take no clicks or keys. Scrolling
 * and tab switching around it keep working. The wrapper stays in place when `active` flips, so nothing inside remounts.
 */
export function ReadOnlyScope({ active, children }: ReadOnlyScopeProps) {
  return (
    <Box
      component="fieldset"
      disabled={active}
      onKeyDownCapture={active ? blockEditingKeys : undefined}
      onKeyUpCapture={active ? blockEditingKeys : undefined}
      sx={{
        border: 0,
        p: 0,
        m: 0,
        minWidth: 0,
        ...(active && { opacity: 0.65, [INTERACTIVE]: { pointerEvents: 'none' } }),
      }}
    >
      {children}
    </Box>
  )
}
