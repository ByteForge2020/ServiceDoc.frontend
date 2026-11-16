import { useMemo, useState } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Checkbox from '@mui/material/Checkbox'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
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
 * The employees doing an estimate item, in one field of a fixed height, so the row never grows however many there are:
 * one executor shows their name, several show a stack of avatars and a count. A click opens the checklist of the team
 * (with everyone's share once there are several); from it the 100% is split between the executors. The shares stored
 * on the item always add up to 100.
 */
export function ExecutorsCell({ executors, onChange }: ExecutorsCellProps) {
  const { t } = useTranslation()
  const { data: members } = useTeamMembersQuery()
  // The popovers hang off the whole cell, not off the trigger: the trigger is swapped for another one when the first
  // executor is added, and a popover whose anchor leaves the page jumps to the corner of the screen.
  const [cell, setCell] = useState<HTMLElement | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sharesOpen, setSharesOpen] = useState(false)

  const membersById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members])
  const multiple = executors.length > 1
  const unknown = t('estimate.executors.unknown')
  const names = executors.map((executor) => memberName(membersById.get(executor.userId), unknown))

  return (
    <Box ref={setCell} sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
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
        // Looks like the other fields of the row: the same height and border, so the column reads as one of them.
        <Tooltip title={pickerOpen || sharesOpen ? '' : names.join(', ')} disableInteractive>
          <ButtonBase
            onClick={() => setPickerOpen(true)}
            aria-label={t('estimate.executors.manage', { names: names.join(', ') })}
            sx={{
              width: '100%',
              height: 40,
              px: 1,
              gap: 1,
              justifyContent: 'flex-start',
              border: 1,
              borderColor: 'divider',
              borderRadius: '8px',
              bgcolor: 'background.paper',
              '&:hover': { borderColor: 'text.disabled' },
            }}
          >
            <AvatarGroup
              max={4}
              sx={{
                '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 11, borderColor: 'background.paper' },
              }}
            >
              {executors.map((executor) => (
                <Avatar key={executor.userId} sx={{ bgcolor: 'primary.main' }}>
                  {initials(membersById.get(executor.userId))}
                </Avatar>
              ))}
            </AvatarGroup>
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              {multiple
                ? t('estimate.executors.count', { count: executors.length })
                : shortName(membersById.get(executors[0].userId), unknown)}
            </Typography>
            <ArrowDropDownIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          </ButtonBase>
        </Tooltip>
      )}

      <ExecutorPicker
        anchor={cell}
        open={pickerOpen}
        members={members ?? []}
        executors={executors}
        onChange={onChange}
        onClose={() => setPickerOpen(false)}
        onOpenShares={() => {
          setPickerOpen(false)
          setSharesOpen(true)
        }}
      />

      <Popover
        open={sharesOpen && multiple && cell !== null}
        anchorEl={cell}
        onClose={() => setSharesOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <SharesPopoverBody
          executors={executors}
          membersById={membersById}
          onApply={(shares) => {
            onChange(shares)
            setSharesOpen(false)
          }}
          onCancel={() => setSharesOpen(false)}
        />
      </Popover>
    </Box>
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

interface ExecutorPickerProps {
  anchor: HTMLElement | null
  open: boolean
  members: TeamMember[]
  executors: ExecutorShare[]
  onChange: (executors: ExecutorShare[]) => void
  onClose: () => void
  /** Closes the checklist and opens the split of the shares. */
  onOpenShares: () => void
}

/**
 * A checklist of the team under the cell: ticking adds an executor, unticking removes them, and it stays open. With
 * several executors every ticked one shows their share, and the footer opens the split of the 100%.
 */
function ExecutorPicker({ anchor, open, members, executors, onChange, onClose, onOpenShares }: ExecutorPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const multiple = executors.length > 1

  const { selected, others } = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = (member: TeamMember) =>
      needle.length === 0 || `${technicianDisplayName(member)} ${member.email}`.toLowerCase().includes(needle)
    const byId = new Map(members.map((member) => [member.id, member]))
    const selectedIds = new Set(executors.map((executor) => executor.userId))

    return {
      // The executors come first, in the order they were added; everyone else keeps the team's own order below them.
      selected: executors
        .map((executor) => byId.get(executor.userId))
        .filter((member): member is TeamMember => !!member && matches(member)),
      others: members.filter((member) => !selectedIds.has(member.id) && matches(member)),
    }
  }, [members, executors, query])

  function toggle(userId: string) {
    const isSelected = executors.some((executor) => executor.userId === userId)

    if (!isSelected && executors.length >= MAX_EXECUTORS) {
      return
    }

    onChange(isSelected ? removeExecutor(executors, userId) : addExecutor(executors, userId))
  }

  function renderRow(member: TeamMember) {
    const executor = executors.find((candidate) => candidate.userId === member.id)

    return (
      <ListItemButton key={member.id} selected={!!executor} onClick={() => toggle(member.id)} sx={{ py: 0.25 }}>
        <Checkbox edge="start" size="small" checked={!!executor} tabIndex={-1} disableRipple />
        <Avatar sx={{ width: 28, height: 28, fontSize: 12, mr: 1.5, bgcolor: 'primary.main' }}>{initials(member)}</Avatar>
        {/* One line each, cut with an ellipsis: a long name must not squeeze the share into a column of its own. */}
        <ListItemText
          primary={technicianDisplayName(member)}
          secondary={t(`teamMemberForm.roles.${member.role.toLowerCase()}`)}
          slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
          sx={{ minWidth: 0 }}
        />
        {executor && multiple && (
          <Typography
            variant="caption"
            aria-label={t('estimate.executors.shareOf', { name: technicianDisplayName(member) })}
            sx={{
              ml: 1,
              flexShrink: 0,
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {executor.percent}%
          </Typography>
        )}
      </ListItemButton>
    )
  }

  const sectionTitleSx = { display: 'block', px: 2, pt: 1, pb: 0.5, color: 'text.secondary', fontWeight: 600 } as const

  return (
    <Popover
      open={open && anchor !== null}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{ transition: { onExited: () => setQuery('') } }}
    >
      <Box sx={{ width: 300 }}>
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
        <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto', pb: 0.5 }}>
          {selected.length === 0 && others.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
              {t('estimate.executors.noResults')}
            </Typography>
          )}

          {selected.length > 0 && (
            <Typography variant="caption" sx={sectionTitleSx}>
              {t('estimate.executors.selectedTitle', { count: selected.length })}
            </Typography>
          )}
          {selected.map(renderRow)}

          {selected.length > 0 && others.length > 0 && (
            <Typography variant="caption" sx={{ ...sectionTitleSx, pt: 1.5 }}>
              {t('estimate.executors.othersTitle')}
            </Typography>
          )}
          {others.map(renderRow)}
        </List>

        {multiple && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <Button size="small" fullWidth onClick={onOpenShares}>
              {t('estimate.executors.splitShares')}
            </Button>
          </Box>
        )}
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
