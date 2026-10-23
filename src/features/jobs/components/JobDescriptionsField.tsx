import { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { FormTextField } from '../../../components/form/FormTextField'

/** A description in the form: `id` is the server id of a saved one (null while new); `key` identifies it in the list. */
export interface JobDescriptionDraft {
  key: string
  id: string | null
  estimateItemId: string | null
  name: string
}

export interface DescriptionServiceOption {
  id: string
  name: string
}

interface ServiceOption {
  kind: 'service'
  id: string
  label: string
}

interface CustomOption {
  kind: 'custom'
  label: string
}

type Option = ServiceOption | CustomOption

interface JobDescriptionsFieldProps {
  /** The order's services that can be picked. */
  services: DescriptionServiceOption[]
  descriptions: JobDescriptionDraft[]
  disabled?: boolean
  placeholder?: string
  onChange: (descriptions: JobDescriptionDraft[]) => void
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

export function JobDescriptionsField({ services, descriptions, disabled, placeholder, onChange }: JobDescriptionsFieldProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')

  const query = normalize(inputValue)
  const isAlreadyAdded = query.length > 0 && descriptions.some((description) => normalize(description.name) === query)

  // Services already in the list are left out, so removing one from the list brings it back here (while the order still has it).
  const options = useMemo<Option[]>(() => {
    const addedServiceIds = new Set(descriptions.map((description) => description.estimateItemId))
    const matching = services
      .filter((service) => !addedServiceIds.has(service.id))
      .filter((service) => query.length === 0 || normalize(service.name).includes(query))
      .map<ServiceOption>((service) => ({ kind: 'service', id: service.id, label: service.name }))

    if (matching.length > 0 || query.length === 0 || isAlreadyAdded) {
      return matching
    }

    // Nothing to pick from: the typed text can only be added as a custom description.
    return [{ kind: 'custom', label: inputValue.trim() }]
  }, [services, descriptions, query, inputValue, isAlreadyAdded])

  function handleSelect(option: Option) {
    onChange([
      ...descriptions,
      {
        key: crypto.randomUUID(),
        id: null,
        estimateItemId: option.kind === 'service' ? option.id : null,
        name: option.label,
      },
    ])
    setInputValue('')
  }

  function handleRemove(key: string) {
    onChange(descriptions.filter((description) => description.key !== key))
  }

  return (
    <Stack spacing={2}>
      <Autocomplete<Option, false, false, false>
        value={null}
        inputValue={inputValue}
        onInputChange={(_event, value, reason) => setInputValue(reason === 'reset' ? '' : value)}
        onChange={(_event, option) => {
          if (option) {
            handleSelect(option)
          }
        }}
        options={options}
        filterOptions={(opts) => opts}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.label === value.label}
        noOptionsText={isAlreadyAdded ? t('jobs.addJobModal.alreadyAdded') : t('jobs.addJobModal.noServicesLeft')}
        openOnFocus
        autoHighlight
        disabled={disabled}
        fullWidth
        renderOption={(props, option) =>
          option.kind === 'custom' ? (
            <li {...props} key="custom">
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
                <AddIcon fontSize="small" />
                <span>{t('jobs.addJobModal.addCustomDescription', { name: option.label })}</span>
              </Stack>
            </li>
          ) : (
            <li {...props} key={option.id}>
              {option.label}
            </li>
          )
        }
        renderInput={(params) => (
          <FormTextField {...params} label={t('jobs.addJobModal.addDescriptionLabel')} placeholder={placeholder} />
        )}
      />

      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('jobs.addJobModal.jobDescriptions')}
        </Typography>

        {descriptions.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('jobs.addJobModal.noDescriptions')}
          </Typography>
        ) : (
          <Box component="ul" sx={{ m: 0, pl: 3, listStyleType: 'disc' }}>
            {descriptions.map((description) => (
              <Box key={description.key} component="li" sx={{ display: 'list-item', py: '2px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    {description.name}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={t('jobs.addJobModal.removeDescriptionAria')}
                    onClick={() => handleRemove(description.key)}
                    sx={{ flexShrink: 0 }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Stack>
  )
}
