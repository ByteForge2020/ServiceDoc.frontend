import { apiClient } from './apiClient'
import type {
  CreateTeamMemberPayload,
  TeamMember,
  UpdateTeamMemberPayload,
} from '../features/settings/teamMembers/types'

const GENERAL_BASE_PATH = '/api/v1/general/teammembers'
const KEYCLOAK_BASE_PATH = '/api/v1/keycloak/teammembers'

export const teamMembersApi = {
  getAll() {
    return apiClient.get<TeamMember[]>(GENERAL_BASE_PATH).then((res) => res.data)
  },

  getById(id: string) {
    return apiClient.get<TeamMember>(`${GENERAL_BASE_PATH}/${id}`).then((res) => res.data)
  },

  create(request: CreateTeamMemberPayload) {
    return apiClient.post<{ id: string }>(KEYCLOAK_BASE_PATH, request).then((res) => res.data)
  },

  update(id: string, request: UpdateTeamMemberPayload) {
    return apiClient.put<void>(`${KEYCLOAK_BASE_PATH}/${id}`, request).then((res) => res.data)
  },
}
