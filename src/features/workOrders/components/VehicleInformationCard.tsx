import Autocomplete from '@mui/material/Autocomplete'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { useBrandsQuery, useCreateBrandMutation } from '../../brands/queries'
import { useCustomerVehiclesQuery } from '../../vehicles/queries'
import type { Vehicle } from '../../vehicles/types'
import { useCreateVehicleModelMutation, useModelsByBrandQuery } from '../../vehicleModels/queries'
import { CreatableAutocomplete, type CreatableOption } from './CreatableAutocomplete'

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
  const toasters = useToasters()
  const { data: vehicles } = useCustomerVehiclesQuery(customerId)
  const { data: brands, isLoading: brandsLoading } = useBrandsQuery()
  const { data: models, isLoading: modelsLoading } = useModelsByBrandQuery(value.brandId)
  const createBrandMutation = useCreateBrandMutation()
  const createModelMutation = useCreateVehicleModelMutation()

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
        toasters.error(extractErrorMessage(error, 'Failed to create brand.'))
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
          toasters.error(extractErrorMessage(error, 'Failed to create model.'))
        },
      },
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h2">
          Vehicle Information
        </Typography>

        <Autocomplete<Vehicle, false, false, false>
          options={vehicles ?? []}
          disabled={!customerId}
          onChange={(_event, newValue) => handleSelectVehicle(newValue)}
          getOptionLabel={(option) =>
            [option.brandName, option.modelName, option.licensePlate].filter(Boolean).join(' ')
          }
          isOptionEqualToValue={(option, val) => option.id === val.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search a vehicle"
              placeholder={customerId ? 'Start typing…' : 'Select a customer first'}
            />
          )}
        />

        <CreatableAutocomplete
          label="Brand"
          placeholder="Select a brand"
          value={value.brandId ? { id: value.brandId, label: value.brandName } : null}
          options={(brands ?? []).map((brand) => ({ id: brand.id, label: brand.name }))}
          loading={brandsLoading}
          creating={createBrandMutation.isPending}
          onChange={handleBrandChange}
          onCreate={handleCreateBrand}
        />

        <CreatableAutocomplete
          label="Model"
          placeholder="Select a model"
          value={value.modelId ? { id: value.modelId, label: value.modelName } : null}
          options={(models ?? []).map((model) => ({ id: model.id, label: model.name }))}
          loading={modelsLoading}
          creating={createModelMutation.isPending}
          disabled={!value.brandId}
          onChange={handleModelChange}
          onCreate={handleCreateModel}
        />

        <FormControl fullWidth>
          <InputLabel id="vehicle-year-label">Year</InputLabel>
          <Select<number | ''>
            labelId="vehicle-year-label"
            label="Year"
            value={value.year ?? ''}
            onChange={(event) =>
              onChange({ ...value, year: event.target.value === '' ? null : Number(event.target.value) })
            }
          >
            <MenuItem value="">
              <em>Select a year</em>
            </MenuItem>
            {YEARS.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Plates"
          value={value.licensePlate}
          onChange={(event) => onChange({ ...value, licensePlate: event.target.value })}
          fullWidth
        />

        <TextField
          label="VIN"
          value={value.vin}
          onChange={(event) => onChange({ ...value, vin: event.target.value })}
          fullWidth
        />

        <TextField
          label="Mileage"
          value={value.mileage}
          onChange={(event) => onChange({ ...value, mileage: event.target.value.replace(/[^0-9]/g, '') })}
          fullWidth
        />
      </Stack>
    </Paper>
  )
}
