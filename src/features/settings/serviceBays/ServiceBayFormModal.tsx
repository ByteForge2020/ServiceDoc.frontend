import { useState, type FormEvent } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import { FormTextField } from '../../../components/form/FormTextField'

const MAX_NAME_LENGTH = 100

interface ServiceBayFormModalProps {
  open: boolean
  title: string
  initialName: string
  isSaving: boolean
  onClose: () => void
  onSave: (name: string) => void
}

/** Name form for adding a service bay or renaming one. */
export function ServiceBayFormModal({ open, title, initialName, isSaving, onClose, onSave }: ServiceBayFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && !isSaving

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (canSave) {
      onSave(trimmed)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: '12px' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton onClick={onClose} size="small" aria-label={t('common.cancel')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormTextField
              label={t('serviceBays.nameLabel')}
              placeholder={t('serviceBays.namePlaceholder')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
              autoFocus
              required
            />

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button variant="text" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="contained" disabled={!canSave} loading={isSaving}>
                {t('serviceBays.save')}
              </Button>
            </Stack>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  )
}
