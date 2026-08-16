import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { extractErrorMessage } from '../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { RepairShopFormLayout } from './components/RepairShopFormLayout'
import { useRepairShopQuery, useTimeZonesQuery, useUpdateRepairShopMutation } from './queries'
import { EMPTY_REPAIR_SHOP, buildRepairShopPayload, isValidSubdomain, repairShopToFormState } from './repairShopForm'

export function EditRepairShopPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toasters = useToasters()
  const { data: repairShop, isPending: isLoading } = useRepairShopQuery(id)
  const { data: timeZones } = useTimeZonesQuery()
  const mutation = useUpdateRepairShopMutation(id ?? '')

  const [value, setValue] = useState(EMPTY_REPAIR_SHOP)
  const [subdomainConflict, setSubdomainConflict] = useState(false)
  const [initializedId, setInitializedId] = useState<string | undefined>(undefined)
  const initialized = initializedId === repairShop?.id

  if (repairShop && !initialized) {
    setInitializedId(repairShop.id)
    setValue(repairShopToFormState(repairShop))
  }

  const timeZoneOptions = (timeZones ?? []).map((tz) => ({ value: tz.id, label: tz.name }))
  const subdomainInvalid = value.subdomainName.trim().length > 0 && !isValidSubdomain(value.subdomainName.trim())
  const subdomainError = subdomainConflict || subdomainInvalid
  const canSave =
    value.name.trim().length > 0 &&
    value.subdomainName.trim().length > 0 &&
    value.timeZoneId.trim().length > 0 &&
    !subdomainInvalid &&
    !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    setSubdomainConflict(false)

    mutation.mutate(buildRepairShopPayload(value), {
      onSuccess: () => {
        toasters.success('Repair shop updated')
        navigate('/shops', { replace: true })
      },
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.status === 409) {
          setSubdomainConflict(true)
          toasters.error('A repair shop with this subdomain already exists')
          return
        }
        toasters.error(extractErrorMessage(error, 'Failed to update repair shop'))
      },
    })
  }

  if (isLoading || !initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <RepairShopFormLayout
      title="Edit repair shop"
      onBack={() => navigate('/shops')}
      onCancel={() => navigate('/shops')}
      value={value}
      onChange={(next) => {
        setValue(next)
        setSubdomainConflict(false)
      }}
      subdomainError={subdomainError}
      subdomainErrorMessage={subdomainConflict ? 'This subdomain is already taken' : 'Lowercase letters, digits and hyphens only'}
      timeZoneOptions={timeZoneOptions}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel="Save"
      canSave={canSave}
    />
  )
}
