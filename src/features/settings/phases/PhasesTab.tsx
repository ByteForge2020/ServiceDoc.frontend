import { useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import type { Phase } from '../../../api/phasesApi'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useToasters } from '../../../app/toasters/useToasters'
import {
  useCreatePhaseMutation,
  useDeletePhaseMutation,
  usePhasesQuery,
  useRenamePhaseMutation,
  useReorderPhasesMutation,
} from './queries'

const MAX_NAME_LENGTH = 100

// Space kept to the right of every card for its action buttons (two icon buttons), in MUI spacing units.
const ACTIONS_WIDTH = 11
// Every card has the same height, whatever it contains (lock icon, drag handle or a text field), in spacing units.
const CARD_MIN_HEIGHT = 7
// Width of the drag handle / lock slot at the left of a card, in MUI spacing units.
const LEAD_WIDTH = 5

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

export function PhasesTab() {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const { data: phases, isPending } = usePhasesQuery()
  const createMutation = useCreatePhaseMutation()
  const renameMutation = useRenamePhaseMutation()
  const deleteMutation = useDeletePhaseMutation()
  const reorderMutation = useReorderPhasesMutation()

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // Pointer covers mouse, pen and touch (the drag handle has touch-action: none); keyboard is Space/Enter + arrows.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const noPhase = phases?.find((phase) => phase.systemType === 'NoPhase')
  const closed = phases?.find((phase) => phase.systemType === 'Closed')
  const customPhases = phases?.filter((phase) => phase.systemType === 'None') ?? []

  function reportError(error: unknown, fallbackKey: string) {
    if (error instanceof AxiosError && error.response?.status === 409) {
      toasters.error(t('phases.nameConflict'))
      return
    }
    toasters.error(extractErrorMessage(error, t(fallbackKey)))
  }

  function handleCreate() {
    const name = newName.trim()

    if (!name || createMutation.isPending) {
      return
    }

    createMutation.mutate(name, {
      onSuccess: () => {
        setNewName('')
        setAdding(false)
      },
      onError: (error) => reportError(error, 'phases.createError'),
    })
  }

  function cancelAdding() {
    setAdding(false)
    setNewName('')
  }

  function startEditing(phase: Phase) {
    setEditingId(phase.id)
    setEditName(phase.name)
  }

  function handleRename(phase: Phase) {
    const name = editName.trim()

    if (!name || renameMutation.isPending) {
      return
    }

    if (name === phase.name) {
      setEditingId(null)
      return
    }

    renameMutation.mutate(
      { id: phase.id, name },
      {
        onSuccess: () => setEditingId(null),
        onError: (error) => reportError(error, 'phases.renameError'),
      },
    )
  }

  async function handleDelete(phase: Phase) {
    const confirmed = await confirm({
      message: t('phases.deleteConfirmMessage', { name: phase.name }),
      confirmLabel: t('phases.delete'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(phase.id, {
      onError: (error) => toasters.error(extractErrorMessage(error, t('phases.deleteError'))),
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return
    }

    const ids = customPhases.map((phase) => phase.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))

    if (from < 0 || to < 0) {
      return
    }

    reorderMutation.mutate(arrayMove(ids, from, to), {
      onError: (error) => toasters.error(extractErrorMessage(error, t('phases.reorderError'))),
    })
  }

  function onNameKeyDown(event: KeyboardEvent, onSubmit: () => void, onCancel: () => void) {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSubmit()
    } else if (event.key === 'Escape') {
      onCancel()
    }
  }

  if (isPending || !phases) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack spacing={1}>
          <Typography variant="h3" component="h2">
            {t('phases.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('phases.description')}
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)} disabled={adding}>
          {t('phases.newPhase')}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
        <Stack spacing={1} sx={{ bgcolor: 'background.default', borderRadius: '12px', p: 2 }}>
          {noPhase && <SystemPhaseRow phase={noPhase} />}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            accessibility={{ screenReaderInstructions: { draggable: t('phases.dragInstructions') } }}
          >
            <SortableContext items={customPhases.map((phase) => phase.id)} strategy={verticalListSortingStrategy}>
              {customPhases.map((phase) => (
                <SortablePhaseRow
                  key={phase.id}
                  phase={phase}
                  isEditing={editingId === phase.id}
                  editName={editName}
                  onEditNameChange={setEditName}
                  onEditKeyDown={(event) =>
                    onNameKeyDown(
                      event,
                      () => handleRename(phase),
                      () => setEditingId(null),
                    )
                  }
                  onStartEditing={() => startEditing(phase)}
                  onSaveEdit={() => handleRename(phase)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => handleDelete(phase)}
                  saveDisabled={!editName.trim() || renameMutation.isPending}
                  deleteDisabled={deleteMutation.isPending}
                />
              ))}
            </SortableContext>
          </DndContext>

          {adding && (
            <PhaseRowLayout
              lead={null}
              content={
                <TextField
                  autoFocus
                  size="small"
                  fullWidth
                  placeholder={t('phases.namePlaceholder')}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => onNameKeyDown(event, handleCreate, cancelAdding)}
                  slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH, 'aria-label': t('phases.nameLabel') } }}
                />
              }
              actions={
                <>
                  <IconButton
                    onClick={handleCreate}
                    disabled={!newName.trim() || createMutation.isPending}
                    aria-label={t('phases.save')}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton onClick={cancelAdding} aria-label={t('common.cancel')}>
                    <CloseIcon />
                  </IconButton>
                </>
              }
            />
          )}

          {closed && <SystemPhaseRow phase={closed} />}
        </Stack>
      </Paper>
    </Stack>
  )
}

interface SortablePhaseRowProps {
  phase: Phase
  isEditing: boolean
  editName: string
  onEditNameChange: (value: string) => void
  onEditKeyDown: (event: KeyboardEvent) => void
  onStartEditing: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  saveDisabled: boolean
  deleteDisabled: boolean
}

function SortablePhaseRow({
  phase,
  isEditing,
  editName,
  onEditNameChange,
  onEditKeyDown,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  saveDisabled,
  deleteDisabled,
}: SortablePhaseRowProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: phase.id,
    disabled: isEditing,
  })

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ position: 'relative', zIndex: isDragging ? 1 : 'auto' }}
    >
      <PhaseRowLayout
        isDragging={isDragging}
        lead={
          <Tooltip title={t('phases.dragHint')}>
            <span>
              <IconButton
                ref={setActivatorNodeRef}
                size="small"
                disabled={isEditing}
                aria-label={t('phases.dragHint')}
                sx={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                {...attributes}
                {...listeners}
              >
                <DragIndicatorIcon />
              </IconButton>
            </span>
          </Tooltip>
        }
        content={
          isEditing ? (
            <TextField
              autoFocus
              size="small"
              fullWidth
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
              onKeyDown={onEditKeyDown}
              slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH, 'aria-label': t('phases.nameLabel') } }}
            />
          ) : (
            <Typography variant="body1" noWrap>
              {phase.name}
            </Typography>
          )
        }
        actions={
          isEditing ? (
            <>
              <IconButton onClick={onSaveEdit} disabled={saveDisabled} aria-label={t('phases.save')}>
                <CheckIcon />
              </IconButton>
              <IconButton onClick={onCancelEdit} aria-label={t('common.cancel')}>
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton onClick={onStartEditing} aria-label={t('phases.rename')}>
                <EditOutlinedIcon />
              </IconButton>
              <IconButton onClick={onDelete} disabled={deleteDisabled} aria-label={t('phases.delete')}>
                <DeleteOutlinedIcon />
              </IconButton>
            </>
          )
        }
      />
    </Box>
  )
}

function SystemPhaseRow({ phase }: { phase: Phase }) {
  const { t } = useTranslation()

  return (
    <PhaseRowLayout
      lead={null}
      content={
        <Tooltip title={t('phases.defaultHint')}>
          <Typography variant="body1" noWrap sx={{ color: 'text.secondary' }}>
            {phase.name}
          </Typography>
        </Tooltip>
      }
    />
  )
}

interface PhaseRowLayoutProps {
  lead: ReactNode
  content: ReactNode
  /** Buttons shown outside the card, on the right. Rows without actions keep the space so cards line up. */
  actions?: ReactNode
  isDragging?: boolean
}

// A status is a white card (lead | divider | content) with its action buttons beside it.
function PhaseRowLayout({ lead, content, actions, isDragging = false }: PhaseRowLayoutProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          minHeight: (theme) => theme.spacing(CARD_MIN_HEIGHT),
          borderRadius: '12px',
          bgcolor: 'background.paper',
          boxShadow: isDragging ? 2 : undefined,
        }}
      >
        <Box sx={{ width: (theme) => theme.spacing(LEAD_WIDTH), display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{lead}</Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>{content}</Box>
      </Paper>
      <Stack direction="row" sx={{ width: (theme) => theme.spacing(ACTIONS_WIDTH), justifyContent: 'flex-start', flexShrink: 0 }}>
        {actions}
      </Stack>
    </Stack>
  )
}
