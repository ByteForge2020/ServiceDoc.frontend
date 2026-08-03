import { useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { FormTextField } from '../../../components/form/FormTextField'
import { SelectedEntityField } from '../../../components/form/SelectedEntityField'
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
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const { data: results, isFetching } = useSearchCustomersQuery(debouncedSearch)
  const showSearch = isSearching || !value.customerId

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
    setIsSearching(false)
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        {t('customerInformation.title')}
      </Typography>

      {showSearch ? (
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
          fullWidth
          sx={{ flex: 1, minWidth: 0 }}
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
            <FormTextField
              {...params}
              label={t('customerInformation.searchLabel')}
              placeholder={t('customerInformation.searchPlaceholder')}
            />
          )}
        />
      ) : (
        <SelectedEntityField
          label={t('customerInformation.searchLabel')}
          displayText={`${value.firstName} ${value.lastName}`.trim()}
          onChange={() => setIsSearching(true)}
        />
      )}

      <FormTextField
        label={t('customerInformation.name')}
        placeholder={t('customerInformation.namePlaceholder')}
        value={value.firstName}
        onChange={(event) => onChange({ ...value, firstName: event.target.value })}
      />

      <FormTextField
        label={t('customerInformation.lastName')}
        placeholder={t('customerInformation.lastNamePlaceholder')}
        value={value.lastName}
        onChange={(event) => onChange({ ...value, lastName: event.target.value })}
      />

      <FormTextField
        label={t('customerInformation.email')}
        placeholder={t('customerInformation.emailPlaceholder')}
        value={value.email}
        onChange={(event) => onChange({ ...value, email: event.target.value })}
      />

      <FormTextField
        label={t('customerInformation.mobile')}
        placeholder={t('customerInformation.mobilePlaceholder')}
        value={value.phone}
        onChange={(event) => onChange({ ...value, phone: event.target.value })}
      />
    </Stack>
  )
}
