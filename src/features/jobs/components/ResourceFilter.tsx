import Autocomplete from '@mui/material/Autocomplete'
import Checkbox from '@mui/material/Checkbox'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import type { CalendarRow } from '../types'

const FILTER_WIDTH = 280
// What the field's own paddings and the dropdown arrow / clear button take, so the value text fits beside them.
const FIELD_CHROME = 96
const MORE_WIDTH = 32

interface ResourceFilterProps {
  /** What the empty field asks for, e.g. "Select service bays"; it is also the field's accessible name. */
  placeholder: string
  options: CalendarRow[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

/** Picks which technicians / service bays the week shows; nothing picked means all of them. */
export function ResourceFilter({ placeholder, options, selectedIds, onChange }: ResourceFilterProps) {
  // In the order they were picked: the first one is what the field shows.
  const selected = selectedIds
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is CalendarRow => option !== undefined)

  return (
    <Autocomplete
      multiple
      size="small"
      disableCloseOnSelect
      options={options}
      value={selected}
      getOptionLabel={(option) => option.name}
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={(_event, value) => onChange(value.map((option) => option.id))}
      renderOption={(props, option, { selected: isSelected }) => {
        const { key, ...optionProps } = props

        return (
          <li key={key} {...optionProps}>
            <Checkbox size="small" checked={isSelected} tabIndex={-1} disableRipple sx={{ mr: 1, p: 0.5 }} />
            {option.name}
          </li>
        )
      }}
      // The first pick and how many more: one short line, so the field keeps its size however many are picked.
      renderValue={(value) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, pl: 0.5 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ maxWidth: FILTER_WIDTH - FIELD_CHROME - (value.length > 1 ? MORE_WIDTH : 0) }}
          >
            {value[0].name}
          </Typography>
          {value.length > 1 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
              {`+${value.length - 1}`}
            </Typography>
          )}
        </Stack>
      )}
      // No label: the placeholder says what to pick, and nothing picked still shows everything.
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, 'aria-label': placeholder },
          }}
        />
      )}
      slotProps={{
        listbox: {
          sx: {
            '& .MuiAutocomplete-option[aria-selected="true"]': {
              color: 'primary.dark',
              fontWeight: 600,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            },
          },
        },
      }}
      sx={{ width: FILTER_WIDTH, '& .MuiAutocomplete-inputRoot': { flexWrap: 'nowrap' } }}
    />
  )
}
