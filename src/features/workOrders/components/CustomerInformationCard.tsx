import { useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          {t('customerInformation.title')}
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
          noOptionsText={
            debouncedSearch.trim().length < 2 ? t('customerInformation.keepTyping') : t('customerInformation.noCustomersFound')
          }
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
            <TextField
              {...params}
              label={t('customerInformation.searchLabel')}
              placeholder={t('customerInformation.searchPlaceholder')}
            />
          )}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label={t('customerInformation.name')}
            value={value.firstName}
            onChange={(event) => onChange({ ...value, firstName: event.target.value })}
            fullWidth
          />
          <TextField
            label={t('customerInformation.lastName')}
            value={value.lastName}
            onChange={(event) => onChange({ ...value, lastName: event.target.value })}
            fullWidth
          />
        </Stack>

        <TextField
          label={t('customerInformation.email')}
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
          fullWidth
        />

        <TextField
          label={t('customerInformation.mobile')}
          value={value.phone}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
          fullWidth
        />
      </Stack>
    </Paper>
  )
}
