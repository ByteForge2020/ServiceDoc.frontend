import { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../../api/errorMessage'
import { useToasters } from '../../../../app/toasters/useToasters'
import { FormTextField } from '../../../../components/form/FormTextField'
import { estimateMasterListLabel } from '../../estimateMasterListLabel'
import {
  useCreateEstimateMasterListItemMutation,
  useEstimateMasterListDefaultsQuery,
  useEstimateMasterListSearchQuery,
} from '../../estimateMasterListQueries'
import { useDebouncedValue } from '../useDebouncedValue'

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

interface SearchInputDropdownProps {
  onSelect: (name: string) => void
}

export function SearchInputDropdown({ onSelect }: SearchInputDropdownProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const [active, setActive] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebouncedValue(inputValue, 300)
  const { data: defaults } = useEstimateMasterListDefaultsQuery()
  const { data: searchResults, isFetching } = useEstimateMasterListSearchQuery(debouncedSearch)
  const createMutation = useCreateEstimateMasterListItemMutation()

  const options = useMemo<SearchOption[]>(() => {
    const query = debouncedSearch.trim().toLowerCase()

    const defaultMatches = (defaults ?? [])
      .map((item) => ({ id: item.id, name: item.name, label: estimateMasterListLabel(item.name, t) }))
      .filter((item) => query.length === 0 || item.label.toLowerCase().includes(query))

    const shopMatches = (searchResults ?? []).map((item) => ({ id: item.id, name: item.name, label: item.name }))

    return [...defaultMatches, ...shopMatches]
  }, [defaults, searchResults, debouncedSearch, t])

  const trimmed = inputValue.trim()
  const hasExactMatch = options.some((option) => option.label.toLowerCase() === trimmed.toLowerCase())

  const displayOptions: Option[] =
    trimmed.length > 0 && !hasExactMatch ? [...options, { id: '__create__', label: trimmed, isCreateOption: true }] : options

  function reset() {
    setActive(false)
    setInputValue('')
  }

  function handleCreate(name: string) {
    createMutation.mutate(name, {
      onSuccess: (created) => {
        onSelect(created.name)
        reset()
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('estimate.createItemError')))
      },
    })
  }

  if (!active) {
    return (
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setActive(true)}>
        {t('estimate.addItem')}
      </Button>
    )
  }

  return (
    <Autocomplete<Option, false, false, false>
      autoFocus
      openOnFocus
      options={displayOptions}
      loading={isFetching}
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
        onSelect(newValue.name)
        reset()
      }}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterOptions={(opts) => opts}
      noOptionsText={trimmed.length < 2 ? t('estimate.keepTyping') : t('estimate.noResults')}
      fullWidth
      sx={{ maxWidth: 360 }}
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
        <FormTextField
          {...params}
          label={t('estimate.addItem')}
          placeholder={t('estimate.searchPlaceholder')}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {(isFetching || createMutation.isPending) && <CircularProgress color="inherit" size={16} />}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
