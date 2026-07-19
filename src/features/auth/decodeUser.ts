import { jwtDecode } from 'jwt-decode'
import type { AuthUser } from './types'

interface KeycloakAccessTokenClaims {
  preferred_username?: string
  email?: string
  RepairShopId?: string
  repairShopId?: string
}

export function buildUserFromToken(accessToken: string): AuthUser | null {
  try {
    const claims = jwtDecode<KeycloakAccessTokenClaims>(accessToken)
    return {
      username: claims.preferred_username ?? claims.email ?? 'Unknown',
      email: claims.email,
      repairShopId: claims.RepairShopId ?? claims.repairShopId,
    }
  } catch {
    return null
  }
}
