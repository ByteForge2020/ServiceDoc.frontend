import { Children, cloneElement, forwardRef, isValidElement, type CSSProperties, type HTMLAttributes, type ReactElement } from 'react'
import { autocompleteClasses } from '@mui/material/Autocomplete'
import { styled } from '@mui/material/styles'
import { List, type RowComponentProps } from 'react-window'

const ROW_HEIGHT = 40
const MAX_VISIBLE_ROWS = 8

const ListboxRoot = styled('div')(({ theme }) => ({
  padding: '8px 0',
  [`& .${autocompleteClasses.option}`]: {
    minHeight: ROW_HEIGHT,
    display: 'flex',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',
    boxSizing: 'border-box',
    outline: 0,
    WebkitTapHighlightColor: 'transparent',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 16,
    paddingRight: 16,
    [`&.${autocompleteClasses.focused}`]: {
      backgroundColor: theme.palette.action.hover,
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&[aria-disabled="true"]': {
      opacity: theme.palette.action.disabledOpacity,
      pointerEvents: 'none',
    },
    [`&.${autocompleteClasses.focusVisible}`]: {
      backgroundColor: theme.palette.action.focus,
    },
    '&[aria-selected="true"]': {
      backgroundColor: theme.alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      [`&.${autocompleteClasses.focused}`]: {
        backgroundColor: theme.alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity),
      },
    },
  },
}))

interface RowProps {
  items: ReactElement[]
}

function Row({ index, style, items }: RowComponentProps<RowProps>) {
  const item = items[index]
  if (!isValidElement<{ style?: CSSProperties }>(item)) {
    return null
  }

  return cloneElement(item, { style: { ...item.props.style, ...style } })
}

/**
 * Drop-in replacement for MUI Autocomplete's `slots.listbox`. Renders only the options
 * currently in view via react-window, so lists with thousands of entries stay smooth.
 * Replicates MUI's default option padding/hover/selected styling, which normally comes
 * from a nested selector on the listbox MUI renders itself — lost when swapping the slot.
 */
export const VirtualizedListbox = forwardRef<HTMLDivElement, HTMLAttributes<HTMLElement>>(function VirtualizedListbox(
  { children, ...other },
  ref,
) {
  const items = Children.toArray(children) as ReactElement[]
  const itemCount = items.length
  const height = Math.max(1, Math.min(itemCount, MAX_VISIBLE_ROWS)) * ROW_HEIGHT

  return (
    <ListboxRoot ref={ref} {...other}>
      <List rowComponent={Row} rowCount={itemCount} rowHeight={ROW_HEIGHT} rowProps={{ items }} style={{ height, width: '100%' }} />
    </ListboxRoot>
  )
})
