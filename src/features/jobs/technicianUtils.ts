import type { TeamMember } from '../settings/teamMembers/types'

/** Attribute used to find a technician's timeline in the DOM at drop time. */
export const TIMELINE_ATTRIBUTE = 'data-technician-timeline'

/** Attribute holding a job's id, used to find its card in the DOM (e.g. to scroll it into view). */
export const JOB_ID_ATTRIBUTE = 'data-job-id'

/** Attribute used to find the dragged job's card in the DOM when a drag starts. */
export const JOB_CARD_ATTRIBUTE = 'data-job-card'

export function technicianDisplayName(technician: TeamMember): string {
  const name = `${technician.firstName ?? ''} ${technician.lastName ?? ''}`.trim()
  return name.length > 0 ? name : technician.email
}
