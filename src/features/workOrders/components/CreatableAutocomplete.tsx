import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

export interface CreatableOption {
  id: string
  label: string
}

interface CreateOption extends CreatableOption {
  isCreateOption: true
}

type Option = CreatableOption | CreateOption

const CREATE_OPTION_ID = '__create__'

const filter = createFilterOptions<Option>()

interface CreatableAutocompleteProps {
  label: string
  placeholder?: string
  value: CreatableOption | null
  options: CreatableOption[]
  loading?: boolean
  creating?: boolean
  disabled?: boolean
  onChange: (option: CreatableOption | null) => void
  onCreate: (name: string) => void
}

export function CreatableAutocomplete({
  label,
  placeholder,
  value,
  options,
  loading,
  creating,
  disabled,
  onChange,
  onCreate,
}: CreatableAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')

  return (
    <Autocomplete<Option, false, false, false>
      value={value}
      onChange={(_event, newValue) => {
        if (!newValue) {
          onChange(null)
          return
        }
        if ('isCreateOption' in newValue) {
          onCreate(newValue.label)
          return
        }
        onChange(newValue)
      }}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params)
        const trimmed = params.inputValue.trim()
        const hasExactMatch = opts.some((o) => o.label.toLowerCase() === trimmed.toLowerCase())

        if (trimmed.length > 0 && !hasExactMatch) {
          filtered.push({ id: CREATE_OPTION_ID, label: trimmed, isCreateOption: true })
        }

        return filtered
      }}
      renderOption={(props, option) =>
        'isCreateOption' in option ? (
          <li {...props} key={CREATE_OPTION_ID}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
              <AddIcon fontSize="small" />
              <span>Create &quot;{option.label}&quot;</span>
            </Stack>
          </li>
        ) : (
          <li {...props} key={option.id}>
            {option.label}
          </li>
        )
      }
      disabled={disabled}
      loading={loading || creating}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {(loading || creating) && <CircularProgress color="inherit" size={16} />}
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
