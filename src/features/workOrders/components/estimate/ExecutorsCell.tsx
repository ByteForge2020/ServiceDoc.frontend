import { useEffect, useMemo, useRef, useState } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CloseIcon from '@mui/icons-material/Close'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Popover, { type PopoverActions } from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { technicianDisplayName } from '../../../jobs/technicianUtils'
import { useTeamMembersQuery } from '../../../settings/teamMembers/queries'
import type { TeamMember } from '../../../settings/teamMembers/types'
import { SharesBar } from './SharesBar'
import {
  MAX_EXECUTORS,
  addExecutor,
  equalShares,
  removeExecutor,
  type ExecutorShare,
} from '../../executorShares'

// Segment colours of the shares bar; an executor keeps the same colour in the bar and in its row.
const SEGMENT_COLORS = ['primary.main', 'secondary.main', 'success.main', 'warning.main', 'info.main', 'error.main']

interface ExecutorsCellProps {
  executors: ExecutorShare[]
  onChange: (executors: ExecutorShare[]) => void
}

/**
 * The employees doing an estimate item. One executor does all of it; with several, each pill shows a share whose
 * arrow opens one popover to split the 100% between everyone. The shares stored on the item always add up to 100.
 */
export function ExecutorsCell({ executors, onChange }: ExecutorsCellProps) {
  const { t } = useTranslation()
  const { data: members } = useTeamMembersQuery()
  // The picker hangs off the whole cell, not off its "add" button: that button is swapped for another one when the
  // first executor is added, and a popover whose anchor leaves the page jumps to the corner of the screen.
  const [cell, setCell] = useState<HTMLElement | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sharesAnchor, setSharesAnchor] = useState<HTMLElement | null>(null)

  const membersById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members])
  const multiple = executors.length > 1

  return (
    <Stack ref={setCell} direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5, minHeight: 40 }}>
      {executors.map((executor) => {
        const member = membersById.get(executor.userId)

        return (
          <ExecutorPill
            key={executor.userId}
            member={member}
            percent={multiple ? executor.percent : null}
            onOpenShare={setSharesAnchor}
            onRemove={() => onChange(removeExecutor(executors, executor.userId))}
          />
        )
      })}

      {executors.length === 0 ? (
        <Button
          size="small"
          startIcon={<PersonAddAlt1Icon fontSize="small" />}
          onClick={() => setPickerOpen(true)}
          sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          {t('estimate.executors.add')}
        </Button>
      ) : (
        <IconButton
          size="small"
          onClick={() => setPickerOpen(true)}
          aria-label={t('estimate.executors.add')}
        >
          <PersonAddAlt1Icon fontSize="small" />
        </IconButton>
      )}

      <ExecutorPicker
        anchor={cell}
        open={pickerOpen}
        members={members ?? []}
        executors={executors}
        onChange={onChange}
        onClose={() => setPickerOpen(false)}
      />

      <Popover
        open={sharesAnchor !== null && multiple}
        anchorEl={sharesAnchor}
        onClose={() => setSharesAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <SharesPopoverBody
          executors={executors}
          membersById={membersById}
          onApply={(shares) => {
            onChange(shares)
            setSharesAnchor(null)
          }}
          onCancel={() => setSharesAnchor(null)}
        />
      </Popover>
    </Stack>
  )
}

function memberName(member: TeamMember | undefined, fallback: string): string {
  return member ? technicianDisplayName(member) : fallback
}

/** "Ivan P." for a full name, otherwise whatever there is (first name, last name or the start of the email). */
function shortName(member: TeamMember | undefined, fallback: string): string {
  if (!member) {
    return fallback
  }

  const first = member.firstName?.trim()
  const last = member.lastName?.trim()

  if (first && last) {
    return `${first} ${last[0]}.`
  }

  return first || last || member.email.split('@')[0]
}

function initials(member: TeamMember | undefined): string {
  if (!member) {
    return '?'
  }

  const letters = [member.firstName, member.lastName].map((part) => part?.trim()[0]).filter(Boolean)

  return (letters.length > 0 ? letters.join('') : member.email[0]).toUpperCase()
}

interface ExecutorPillProps {
  member: TeamMember | undefined
  /** Shown only while the item has several executors. */
  percent: number | null
  onOpenShare: (anchor: HTMLElement) => void
  onRemove: () => void
}

function ExecutorPill({ member, percent, onOpenShare, onRemove }: ExecutorPillProps) {
  const { t } = useTranslation()
  const unknown = t('estimate.executors.unknown')
  const fullName = memberName(member, unknown)

  return (
    <Box
      title={fullName}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        maxWidth: '100%',
        pl: 0.5,
        pr: 0.25,
        gap: 0.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 14,
        bgcolor: 'background.paper',
      }}
    >
      <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: 'primary.main' }}>{initials(member)}</Avatar>
      <Typography variant="body2" noWrap sx={{ maxWidth: 96 }}>
        {shortName(member, unknown)}
      </Typography>
      {percent !== null && (
        <ButtonBase
          onClick={(event) => onOpenShare(event.currentTarget)}
          aria-label={t('estimate.executors.changeShare', { name: fullName })}
          sx={{
            height: 20,
            pl: 0.75,
            borderRadius: 10,
            typography: 'caption',
            fontWeight: 600,
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          {percent}%
          <ArrowDropDownIcon sx={{ fontSize: 18 }} />
        </ButtonBase>
      )}
      <IconButton
        size="small"
        onClick={onRemove}
        aria-label={t('estimate.executors.remove', { name: fullName })}
        sx={{ p: 0.25 }}
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  )
}

interface ExecutorPickerProps {
  anchor: HTMLElement | null
  open: boolean
  members: TeamMember[]
  executors: ExecutorShare[]
  onChange: (executors: ExecutorShare[]) => void
  onClose: () => void
}

/** A checklist of the team under the cell: ticking adds an executor, unticking removes them, and it stays open. */
function ExecutorPicker({ anchor, open, members, executors, onChange, onClose }: ExecutorPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const popoverActions = useRef<PopoverActions>(null)

  // Every executor ticked can make the cell taller (its pills wrap): keep the list right under it.
  useEffect(() => {
    if (open) {
      popoverActions.current?.updatePosition()
    }
  }, [open, executors.length])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return members.filter(
      (member) => needle.length === 0 || `${technicianDisplayName(member)} ${member.email}`.toLowerCase().includes(needle),
    )
  }, [members, query])

  function toggle(userId: string) {
    const selected = executors.some((executor) => executor.userId === userId)

    if (!selected && executors.length >= MAX_EXECUTORS) {
      return
    }

    onChange(selected ? removeExecutor(executors, userId) : addExecutor(executors, userId))
  }

  return (
    <Popover
      open={open && anchor !== null}
      anchorEl={anchor}
      action={popoverActions}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{ transition: { onExited: () => setQuery('') } }}
    >
      <Box sx={{ width: 280 }}>
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('estimate.executors.searchPlaceholder')}
            slotProps={{ htmlInput: { 'aria-label': t('estimate.executors.searchPlaceholder') } }}
          />
        </Box>
        <List dense disablePadding sx={{ maxHeight: 280, overflowY: 'auto', pb: 0.5 }}>
          {visible.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
              {t('estimate.executors.noResults')}
            </Typography>
          )}
          {visible.map((member) => {
            const selected = executors.some((executor) => executor.userId === member.id)

            return (
              <ListItemButton key={member.id} onClick={() => toggle(member.id)} sx={{ py: 0 }}>
                <Checkbox edge="start" size="small" checked={selected} tabIndex={-1} disableRipple />
                <Avatar sx={{ width: 24, height: 24, fontSize: 11, mr: 1.5, bgcolor: 'primary.main' }}>
                  {initials(member)}
                </Avatar>
                <ListItemText primary={technicianDisplayName(member)} secondary={t(`teamMemberForm.roles.${member.role.toLowerCase()}`)} />
              </ListItemButton>
            )
          })}
        </List>
      </Box>
    </Popover>
  )
}

interface SharesPopoverBodyProps {
  executors: ExecutorShare[]
  membersById: Map<string, TeamMember>
  onApply: (shares: ExecutorShare[]) => void
  onCancel: () => void
}

/**
 * Splits the 100% between the executors with the draggable bar; the numbers beside it only show the result.
 * It works on a draft that nothing reads until "Apply". A handle only moves percent between its two neighbours, so
 * the draft always adds up to 100 with at least 1% each and can be applied as it is.
 */
function SharesPopoverBody({ executors, membersById, onApply, onCancel }: SharesPopoverBodyProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<number[]>(() => executors.map((executor) => executor.percent))
  const names = executors.map((executor) =>
    memberName(membersById.get(executor.userId), t('estimate.executors.unknown')),
  )

  function splitBoundary(boundary: number, left: number) {
    setValues((current) => {
      const pair = current[boundary] + current[boundary + 1]
      const nextLeft = Math.min(Math.max(left, 1), pair - 1)

      if (pair < 2) {
        return current
      }

      return current.map((value, position) =>
        position === boundary ? nextLeft : position === boundary + 1 ? pair - nextLeft : value,
      )
    })
  }

  return (
    <Box sx={{ p: 2, width: 320 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {t('estimate.executors.sharesTitle')}
      </Typography>

      <SharesBar values={values} colors={SEGMENT_COLORS} labels={names} onSplit={splitBoundary} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 2 }}>
        {t('estimate.executors.dragHint')}
      </Typography>

      <Stack spacing={1}>
        {executors.map((executor, index) => (
          <Stack key={executor.userId} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
              }}
            />
            <Typography variant="body2" noWrap title={names[index]} sx={{ flex: 1, minWidth: 0 }}>
              {names[index]}
            </Typography>
            {/* Information only: the share is changed with the bar. */}
            <Typography
              variant="body2"
              aria-label={t('estimate.executors.shareOf', { name: names[index] })}
              sx={{
                minWidth: 52,
                flexShrink: 0,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: 'action.hover',
                fontWeight: 600,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {values[index]}%
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" sx={{ mt: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          size="small"
          onClick={() => setValues(equalShares(executors.map((executor) => executor.userId)).map((share) => share.percent))}
        >
          {t('estimate.executors.equal')}
        </Button>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={onCancel}>
            {t('estimate.executors.cancel')}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => onApply(executors.map((executor, index) => ({ userId: executor.userId, percent: values[index] })))}
          >
            {t('estimate.executors.apply')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}