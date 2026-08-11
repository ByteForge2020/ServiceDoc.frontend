export type Role = 'Administrator' | 'Technician' | 'Owner'

export interface TeamMember {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: Role
}

export interface CreateTeamMemberPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  subdomainName: string
}

export interface UpdateTeamMemberPayload {
  email: string
  password: string | null
  firstName: string
  lastName: string
  role: Role
  subdomainName: string
}
