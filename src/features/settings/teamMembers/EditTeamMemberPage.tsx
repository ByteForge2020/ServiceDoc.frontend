import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { resolveSubdomain } from '../../auth/subdomain'
import { TeamMemberFormLayout } from './components/TeamMemberFormLayout'
import { useTeamMemberQuery, useUpdateTeamMemberMutation } from './queries'
import { EMPTY_TEAM_MEMBER, buildUpdateTeamMemberPayload, teamMemberToFormState } from './teamMemberForm'

const subdomainName = resolveSubdomain()

export function EditTeamMemberPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toasters = useToasters()
  const { data: teamMember, isPending: isLoading } = useTeamMemberQuery(id)
  const mutation = useUpdateTeamMemberMutation(id ?? '')

  const [value, setValue] = useState(EMPTY_TEAM_MEMBER)
  const [emailConflict, setEmailConflict] = useState(false)
  const [initializedId, setInitializedId] = useState<string | undefined>(undefined)
  const initialized = initializedId === teamMember?.id

  if (teamMember && !initialized) {
    setInitializedId(teamMember.id)
    setValue(teamMemberToFormState(teamMember))
  }

  const canSave =
    value.firstName.trim().length > 0 &&
    value.lastName.trim().length > 0 &&
    value.email.trim().length > 0 &&
    value.role !== '' &&
    (value.password.trim().length === 0 || value.password.trim().length >= 8) &&
    !!subdomainName &&
    !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!canSave || !subdomainName) {
      return
    }

    setEmailConflict(false)

    mutation.mutate(buildUpdateTeamMemberPayload(value, subdomainName), {
      onSuccess: () => {
        toasters.success(t('teamMemberForm.updateSuccess'))
        navigate('/settings', { replace: true })
      },
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.status === 409) {
          setEmailConflict(true)
          toasters.error(t('teamMemberForm.emailConflict'))
          return
        }
        toasters.error(extractErrorMessage(error, t('teamMemberForm.updateError')))
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
    <TeamMemberFormLayout
      title={t('teamMemberForm.editTitle')}
      onBack={() => navigate('/settings')}
      onCancel={() => navigate('/settings')}
      value={value}
      onChange={(next) => {
        setValue(next)
        setEmailConflict(false)
      }}
      emailError={emailConflict}
      emailErrorMessage={t('teamMemberForm.emailConflict')}
      passwordHelperText={t('teamMemberForm.passwordHelperEdit')}
      passwordRequired={false}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('teamMemberForm.saveLabel')}
      canSave={canSave}
    />
  )
}
