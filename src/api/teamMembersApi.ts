import { apiClient } from './apiClient'
import type {
  CreateTeamMemberPayload,
  TeamMember,
  UpdateTeamMemberPayload,
} from '../features/settings/teamMembers/types'

const GENERAL_BASE_PATH = '/api/v1/general/teammembers'
const AUTH_BASE_PATH = '/api/v1/auth/teammembers'

export const teamMembersApi = {
  getAll() {
    return apiClient.get<TeamMember[]>(GENERAL_BASE_PATH).then((res) => res.data)
  },

  getById(id: string) {
    return apiClient.get<TeamMember>(`${GENERAL_BASE_PATH}/${id}`).then((res) => res.data)
  },

  create(request: CreateTeamMemberPayload) {
    return apiClient.post<{ id: string }>(AUTH_BASE_PATH, request).then((res) => res.data)
  },

  update(id: string, request: UpdateTeamMemberPayload) {
    return apiClient.put<void>(`${AUTH_BASE_PATH}/${id}`, request).then((res) => res.data)
  },
}
