import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { FormSelectOption } from '../../components/form/FormSelect'
import { useServiceBaysQuery } from '../settings/serviceBays/queries'
import { useTeamMembersQuery } from '../settings/teamMembers/queries'
import { technicianDisplayName } from './technicianUtils'

/** The "who / where" field of the work forms: what it is called, and what can be picked. */
export interface ResourceField {
  label: string
  placeholder: string
  options: FormSelectOption<string>[]
}

/** The employee a job is assigned to: every member of the team, as in the technicians calendar. */
export function useTechnicianField(): ResourceField {
  const { t } = useTranslation()
  const { data: teamMembers } = useTeamMembersQuery()

  const options = useMemo(
    () => (teamMembers ?? []).map((member) => ({ value: member.id, label: technicianDisplayName(member) })),
    [teamMembers],
  )

  return { label: t('jobs.resource.technician'), placeholder: t('jobs.resource.technicianPlaceholder'), options }
}

/** The service bay a booking is for: every bay that isn't deleted. */
export function useServiceBayField(): ResourceField {
  const { t } = useTranslation()
  const { data: serviceBays } = useServiceBaysQuery()

  const options = useMemo(
    () => (serviceBays ?? []).map((bay) => ({ value: bay.id, label: bay.name })),
    [serviceBays],
  )

  return { label: t('jobs.resource.serviceBay'), placeholder: t('jobs.resource.serviceBayPlaceholder'), options }
}
