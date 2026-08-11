import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { extractErrorMessage } from '../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { RepairShopFormLayout } from './components/RepairShopFormLayout'
import { useCreateRepairShopMutation } from './queries'
import { EMPTY_REPAIR_SHOP, buildRepairShopPayload, isValidSubdomain } from './repairShopForm'

export function CreateRepairShopPage() {
  const navigate = useNavigate()
  const toasters = useToasters()
  const mutation = useCreateRepairShopMutation()

  const [value, setValue] = useState(EMPTY_REPAIR_SHOP)
  const [subdomainConflict, setSubdomainConflict] = useState(false)

  const subdomainInvalid = value.subdomainName.trim().length > 0 && !isValidSubdomain(value.subdomainName.trim())
  const subdomainError = subdomainConflict || subdomainInvalid
  const canSave = value.name.trim().length > 0 && value.subdomainName.trim().length > 0 && !subdomainInvalid && !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    setSubdomainConflict(false)

    mutation.mutate(buildRepairShopPayload(value), {
      onSuccess: () => {
        toasters.success('Repair shop created')
        navigate('/shops', { replace: true })
      },
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.status === 409) {
          setSubdomainConflict(true)
          toasters.error('A repair shop with this subdomain already exists')
          return
        }
        toasters.error(extractErrorMessage(error, 'Failed to create repair shop'))
      },
    })
  }

  return (
    <RepairShopFormLayout
      title="New repair shop"
      onBack={() => navigate('/shops')}
      onCancel={() => navigate('/shops')}
      value={value}
      onChange={(next) => {
        setValue(next)
        setSubdomainConflict(false)
      }}
      subdomainError={subdomainError}
      subdomainErrorMessage={subdomainConflict ? 'This subdomain is already taken' : 'Lowercase letters, digits and hyphens only'}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel="Create"
      canSave={canSave}
    />
  )
}
