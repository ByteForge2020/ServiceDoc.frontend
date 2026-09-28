import { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { VirtualizedListbox } from '../../../components/form/VirtualizedListbox'
import {
  useCreateEstimateMasterListItemMutation,
  useEstimateMasterListItemsQuery,
} from '../../workOrders/estimateMasterListQueries'
import type { AppointmentReason } from '../types'

interface SearchOption {
  id: string
  name: string
  label: string
}

interface CreateOption {
  id: '__create__'
  label: string
  isCreateOption: true
}

type Option = SearchOption | CreateOption

interface AppointmentReasonsFieldProps {
  reasons: AppointmentReason[]
  onChange: (reasons: AppointmentReason[]) => void
}

export function AppointmentReasonsField({ reasons, onChange }: AppointmentReasonsFieldProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const [active, setActive] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { data: items, isLoading } = useEstimateMasterListItemsQuery()
  const createMutation = useCreateEstimateMasterListItemMutation()

  const selectedIds = useMemo(() => new Set(reasons.map((r) => r.id)), [reasons])

  const options = useMemo<SearchOption[]>(() => {
    const query = inputValue.trim().toLowerCase()

    return (items ?? [])
      .filter((item) => !selectedIds.has(item.id))
      .filter((item) => query.length === 0 || item.name.toLowerCase().includes(query))
      .map((item) => ({ id: item.id, name: item.name, label: item.name }))
  }, [items, inputValue, selectedIds])

  const trimmed = inputValue.trim()
  const hasExactMatch =
    options.some((option) => option.label.toLowerCase() === trimmed.toLowerCase()) ||
    reasons.some((reason) => reason.name.trim().toLowerCase() === trimmed.toLowerCase())

  const displayOptions: Option[] =
    trimmed.length > 0 && !hasExactMatch ? [...options, { id: '__create__', label: trimmed, isCreateOption: true }] : options

  function reset() {
    setActive(false)
    setInputValue('')
  }

  function addReason(reason: AppointmentReason) {
    onChange([...reasons, reason])
    reset()
  }

  function removeReason(id: string) {
    onChange(reasons.filter((reason) => reason.id !== id))
  }

  function handleCreate(name: string) {
    createMutation.mutate(name, {
      onSuccess: (created) => {
        addReason({ id: created.id, name: created.name })
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('appointmentForm.createReasonError')))
      },
    })
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {t('appointmentForm.reasonLabel')}
        <Box component="span" sx={{ color: 'error.main' }}>
          {' *'}
        </Box>
      </Typography>

      {reasons.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {reasons.map((reason) => (
            <Chip key={reason.id} label={reason.name} onDelete={() => removeReason(reason.id)} />
          ))}
        </Stack>
      )}

      {active ? (
        <Autocomplete<Option, false, false, false>
          autoFocus
          openOnFocus
          options={displayOptions}
          loading={isLoading}
          inputValue={inputValue}
          onInputChange={(_event, newValue) => setInputValue(newValue)}
          onChange={(_event, newValue) => {
            if (!newValue) {
              return
            }
            if ('isCreateOption' in newValue) {
              handleCreate(newValue.label)
              return
            }
            addReason({ id: newValue.id, name: newValue.name })
          }}
          onBlur={() => {
            if (!inputValue) {
              setActive(false)
            }
          }}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          filterOptions={(opts) => opts}
          noOptionsText={t('appointmentForm.noReasonsFound')}
          slots={{ listbox: VirtualizedListbox }}
          fullWidth
          renderOption={(props, option) =>
            'isCreateOption' in option ? (
              <li {...props} key="create">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
                  <AddIcon fontSize="small" />
                  <span>{t('common.createOption', { name: option.label })}</span>
                </Stack>
              </li>
            ) : (
              <li {...props} key={option.id}>
                {option.label}
              </li>
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              fullWidth
              placeholder={t('appointmentForm.reasonSearchPlaceholder')}
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  endAdornment: (
                    <>
                      {(isLoading || createMutation.isPending) && <CircularProgress color="inherit" size={16} />}
                      {params.slotProps.input.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      ) : (
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setActive(true)} sx={{ alignSelf: 'flex-start' }}>
          {t('appointmentForm.addReason')}
        </Button>
      )}
    </Stack>
  )
}
