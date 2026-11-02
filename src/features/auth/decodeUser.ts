import { jwtDecode } from 'jwt-decode'
import type { AuthUser } from './types'

interface AccessTokenClaims {
  name?: string
  email?: string
  RepairShopId?: string
}

export function buildUserFromToken(accessToken: string): AuthUser | null {
  try {
    const claims = jwtDecode<AccessTokenClaims>(accessToken)
    return {
      username: claims.name ?? claims.email ?? 'Unknown',
      email: claims.email,
      repairShopId: claims.RepairShopId,
    }
  } catch {
    return null
  }
}
