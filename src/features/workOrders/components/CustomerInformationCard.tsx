import { useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSearchCustomersQuery } from '../../customers/queries'
import type { CustomerSearchResult } from '../../customers/types'
import { highlightMatch } from './highlightMatch'
import { useDebouncedValue } from './useDebouncedValue'

export interface CustomerFormState {
  customerId: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface CustomerInformationCardProps {
  value: CustomerFormState
  onChange: (value: CustomerFormState) => void
}

export function CustomerInformationCard({ value, onChange }: CustomerInformationCardProps) {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const { data: results, isFetching } = useSearchCustomersQuery(debouncedSearch)

  function handleSelect(result: CustomerSearchResult | null) {
    if (!result) {
      return
    }

    onChange({
      customerId: result.customerId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email ?? '',
      phone: result.phone ?? '',
    })
    setSearchInput('')
  }

  return (
    <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h2">
          Customer Information
        </Typography>

        <Autocomplete<CustomerSearchResult, false, false, false>
          options={results ?? []}
          filterOptions={(options) => options}
          loading={isFetching}
          inputValue={searchInput}
          onInputChange={(_event, newValue) => setSearchInput(newValue)}
          onChange={(_event, newValue) => handleSelect(newValue)}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
          isOptionEqualToValue={(option, val) =>
            option.customerId === val.customerId && option.vehicleId === val.vehicleId
          }
          noOptionsText={debouncedSearch.trim().length < 2 ? 'Keep typing to search…' : 'No customers found'}
          renderOption={(props, option) => (
            <li {...props} key={`${option.customerId}-${option.vehicleId ?? 'none'}`}>
              <Typography variant="body1">
                {highlightMatch(`${option.firstName} ${option.lastName}`, debouncedSearch)}
                {' / '}
                {highlightMatch(option.phone ?? '—', debouncedSearch)}
                {' / '}
                {highlightMatch(option.licensePlate ?? '—', debouncedSearch)}
                {' / '}
                {highlightMatch(option.vin ?? '—', debouncedSearch)}
              </Typography>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Search customer by name, mobile, plates or VIN" placeholder="Start typing…" />
          )}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Name"
            value={value.firstName}
            onChange={(event) => onChange({ ...value, firstName: event.target.value })}
            fullWidth
          />
          <TextField
            label="Last name"
            value={value.lastName}
            onChange={(event) => onChange({ ...value, lastName: event.target.value })}
            fullWidth
          />
        </Stack>

        <TextField
          label="Email"
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
          fullWidth
        />

        <TextField
          label="Mobile"
          value={value.phone}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
          fullWidth
        />
      </Stack>
    </Paper>
  )
}
