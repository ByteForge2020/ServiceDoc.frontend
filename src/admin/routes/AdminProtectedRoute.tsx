import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAppSelector } from '../app/hooks'

export function AdminProtectedRoute() {
  const credentials = useAdminAppSelector((state) => state.adminAuth.credentials)
  const location = useLocation()

  if (!credentials) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
