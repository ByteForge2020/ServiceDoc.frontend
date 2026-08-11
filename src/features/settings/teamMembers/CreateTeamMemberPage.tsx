import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { resolveSubdomain } from '../../auth/subdomain'
import { TeamMemberFormLayout } from './components/TeamMemberFormLayout'
import { useCreateTeamMemberMutation } from './queries'
import { EMPTY_TEAM_MEMBER, buildCreateTeamMemberPayload } from './teamMemberForm'

const subdomainName = resolveSubdomain()

export function CreateTeamMemberPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toasters = useToasters()
  const mutation = useCreateTeamMemberMutation()

  const [value, setValue] = useState(EMPTY_TEAM_MEMBER)
  const [emailConflict, setEmailConflict] = useState(false)

  const canSave =
    value.firstName.trim().length > 0 &&
    value.lastName.trim().length > 0 &&
    value.email.trim().length > 0 &&
    value.role !== '' &&
    value.password.trim().length >= 8 &&
    !!subdomainName &&
    !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!canSave || !subdomainName) {
      return
    }

    setEmailConflict(false)

    mutation.mutate(buildCreateTeamMemberPayload(value, subdomainName), {
      onSuccess: () => {
        toasters.success(t('teamMemberForm.createSuccess'))
        navigate('/settings', { replace: true })
      },
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.status === 409) {
          setEmailConflict(true)
          toasters.error(t('teamMemberForm.emailConflict'))
          return
        }
        toasters.error(extractErrorMessage(error, t('teamMemberForm.createError')))
      },
    })
  }

  return (
    <TeamMemberFormLayout
      title={t('teamMemberForm.newTitle')}
      onBack={() => navigate('/settings')}
      onCancel={() => navigate('/settings')}
      value={value}
      onChange={(next) => {
        setValue(next)
        setEmailConflict(false)
      }}
      emailError={emailConflict}
      emailErrorMessage={t('teamMemberForm.emailConflict')}
      passwordHelperText={t('teamMemberForm.passwordHelperCreate')}
      passwordRequired
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('teamMemberForm.createLabel')}
      canSave={canSave}
    />
  )
}
