import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import type { CalendarAddAction } from './ResourceGrid'

interface AddActionsPopoverProps {
  /** Where the empty slot was clicked, in screen coordinates; the popover is closed when there is none. */
  position: { top: number; left: number } | null
  actions: CalendarAddAction[]
  onSelect: (action: CalendarAddAction) => void
  onClose: () => void
}

/** The buttons offered at a clicked empty slot, one per kind of thing that can be added there. */
export function AddActionsPopover({ position, actions, onSelect, onClose }: AddActionsPopoverProps) {
  return (
    <Popover
      open={!!position}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ?? undefined}
    >
      <Stack sx={{ p: 1, alignItems: 'stretch' }}>
        {actions.map((action) => (
          <Button key={action.key} variant="text" onClick={() => onSelect(action)} sx={{ justifyContent: 'flex-start' }}>
            {action.label}
          </Button>
        ))}
      </Stack>
    </Popover>
  )
}
