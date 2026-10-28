import type { TeamMember } from '../settings/teamMembers/types'

/** Attribute used to find a row's timeline in the DOM at drop time. */
export const TIMELINE_ATTRIBUTE = 'data-calendar-timeline'

/** Attribute holding an entry's id, used to find its card in the DOM (e.g. to scroll it into view). */
export const ENTRY_ID_ATTRIBUTE = 'data-entry-id'

/** Attribute used to find the dragged entry's card in the DOM when a drag starts. */
export const ENTRY_CARD_ATTRIBUTE = 'data-entry-card'

export function technicianDisplayName(technician: TeamMember): string {
  const name = `${technician.firstName ?? ''} ${technician.lastName ?? ''}`.trim()
  return name.length > 0 ? name : technician.email
}
