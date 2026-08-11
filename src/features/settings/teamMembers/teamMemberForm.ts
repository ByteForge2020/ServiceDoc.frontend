import type { TeamMemberFormState } from './components/TeamMemberFormLayout'
import type { CreateTeamMemberPayload, Role, TeamMember, UpdateTeamMemberPayload } from './types'

export const EMPTY_TEAM_MEMBER: TeamMemberFormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  password: '',
}

export function teamMemberToFormState(teamMember: TeamMember): TeamMemberFormState {
  return {
    firstName: teamMember.firstName ?? '',
    lastName: teamMember.lastName ?? '',
    email: teamMember.email,
    role: teamMember.role,
    password: '',
  }
}

export function buildCreateTeamMemberPayload(
  value: TeamMemberFormState,
  subdomainName: string,
): CreateTeamMemberPayload {
  return {
    email: value.email.trim(),
    password: value.password,
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    role: value.role as Role,
    subdomainName,
  }
}

export function buildUpdateTeamMemberPayload(
  value: TeamMemberFormState,
  subdomainName: string,
): UpdateTeamMemberPayload {
  return {
    email: value.email.trim(),
    password: value.password.trim() ? value.password : null,
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    role: value.role as Role,
    subdomainName,
  }
}
