import { useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { FormCreatableAutocomplete, type CreatableOption } from '../../../components/form/FormCreatableAutocomplete'
import { FormSelect } from '../../../components/form/FormSelect'
import { FormTextField } from '../../../components/form/FormTextField'
import { SelectedEntityField } from '../../../components/form/SelectedEntityField'
import { useBrandsQuery, useCreateBrandMutation } from '../../brands/queries'
import { useCustomerVehiclesQuery } from '../../vehicles/queries'
import type { Vehicle } from '../../vehicles/types'
import { useCreateVehicleModelMutation, useModelsByBrandQuery } from '../../vehicleModels/queries'

export interface VehicleFormState {
  vehicleId: string | null
  brandId: string | null
  brandName: string
  modelId: string | null
  modelName: string
  year: number | null
  vin: string
  licensePlate: string
  mileage: string
}

interface VehicleInformationCardProps {
  value: VehicleFormState
  onChange: (value: VehicleFormState) => void
  customerId: string | null
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 1950 + 1 }, (_, i) => CURRENT_YEAR + 1 - i)

export function VehicleInformationCard({ value, onChange, customerId }: VehicleInformationCardProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const [isSearching, setIsSearching] = useState(false)
  const { data: vehicles } = useCustomerVehiclesQuery(customerId)
  const { data: brands, isLoading: brandsLoading } = useBrandsQuery()
  const { data: models, isLoading: modelsLoading } = useModelsByBrandQuery(value.brandId)
  const createBrandMutation = useCreateBrandMutation()
  const createModelMutation = useCreateVehicleModelMutation()
  const showSearch = isSearching || !value.vehicleId

  function handleSelectVehicle(vehicle: Vehicle | null) {
    if (!vehicle) {
      return
    }

    onChange({
      vehicleId: vehicle.id,
      brandId: vehicle.brandId,
      brandName: vehicle.brandName ?? '',
      modelId: vehicle.modelId,
      modelName: vehicle.modelName ?? '',
      year: vehicle.year,
      vin: vehicle.vin ?? '',
      licensePlate: vehicle.licensePlate ?? '',
      mileage: vehicle.mileage != null ? String(vehicle.mileage) : '',
    })
    setIsSearching(false)
  }

  function handleBrandChange(option: CreatableOption | null) {
    onChange({
      ...value,
      brandId: option?.id ?? null,
      brandName: option?.label ?? '',
      modelId: null,
      modelName: '',
    })
  }

  function handleCreateBrand(name: string) {
    createBrandMutation.mutate(name, {
      onSuccess: (brand) => {
        onChange({ ...value, brandId: brand.id, brandName: brand.name, modelId: null, modelName: '' })
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('vehicleInformation.createBrandError')))
      },
    })
  }

  function handleModelChange(option: CreatableOption | null) {
    onChange({ ...value, modelId: option?.id ?? null, modelName: option?.label ?? '' })
  }

  function handleCreateModel(name: string) {
    if (!value.brandId) {
      return
    }

    createModelMutation.mutate(
      { brandId: value.brandId, name },
      {
        onSuccess: (model) => {
          onChange({ ...value, modelId: model.id, modelName: model.name })
        },
        onError: (error) => {
          toasters.error(extractErrorMessage(error, t('vehicleInformation.createModelError')))
        },
      },
    )
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        {t('vehicleInformation.title')}
      </Typography>

      {showSearch ? (
        <Autocomplete<Vehicle, false, false, false>
          options={vehicles ?? []}
          disabled={!customerId}
          onChange={(_event, newValue) => handleSelectVehicle(newValue)}
          getOptionLabel={(option) =>
            [option.brandName, option.modelName, option.licensePlate].filter(Boolean).join(' ')
          }
          isOptionEqualToValue={(option, val) => option.id === val.id}
          fullWidth
          sx={{ flex: 1, minWidth: 0 }}
          renderInput={(params) => (
            <FormTextField
              {...params}
              label={t('vehicleInformation.searchVehicle')}
              placeholder={customerId ? t('vehicleInformation.startTyping') : t('vehicleInformation.selectCustomerFirst')}
            />
          )}
        />
      ) : (
        <SelectedEntityField
          label={t('vehicleInformation.searchVehicle')}
          displayText={[value.brandName, value.modelName, value.licensePlate].filter(Boolean).join(' ')}
          onChange={() => setIsSearching(true)}
        />
      )}

      <FormCreatableAutocomplete
        label={t('vehicleInformation.brand')}
        placeholder={t('vehicleInformation.selectBrand')}
        value={value.brandId ? { id: value.brandId, label: value.brandName } : null}
        options={(brands ?? []).map((brand) => ({ id: brand.id, label: brand.name }))}
        loading={brandsLoading}
        creating={createBrandMutation.isPending}
        onChange={handleBrandChange}
        onCreate={handleCreateBrand}
      />

      <FormCreatableAutocomplete
        label={t('vehicleInformation.model')}
        placeholder={t('vehicleInformation.selectModel')}
        value={value.modelId ? { id: value.modelId, label: value.modelName } : null}
        options={(models ?? []).map((model) => ({ id: model.id, label: model.name }))}
        loading={modelsLoading}
        creating={createModelMutation.isPending}
        disabled={!value.brandId}
        onChange={handleModelChange}
        onCreate={handleCreateModel}
      />

      <FormSelect<number>
        label={t('vehicleInformation.year')}
        placeholder={t('vehicleInformation.selectYear')}
        value={value.year ?? ''}
        onChange={(year) => onChange({ ...value, year: year === '' ? null : Number(year) })}
        options={YEARS.map((year) => ({ value: year, label: String(year) }))}
      />

      <FormTextField
        label={t('vehicleInformation.plates')}
        placeholder={t('vehicleInformation.platesPlaceholder')}
        value={value.licensePlate}
        onChange={(event) => onChange({ ...value, licensePlate: event.target.value })}
      />

      <FormTextField
        label={t('vehicleInformation.vin')}
        placeholder={t('vehicleInformation.vinPlaceholder')}
        value={value.vin}
        onChange={(event) => onChange({ ...value, vin: event.target.value })}
      />

      <FormTextField
        label={t('vehicleInformation.mileage')}
        placeholder={t('vehicleInformation.mileagePlaceholder')}
        value={value.mileage}
        onChange={(event) => onChange({ ...value, mileage: event.target.value.replace(/[^0-9]/g, '') })}
      />
    </Stack>
  )
}
