import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { AdminLoginPage } from '../features/auth/AdminLoginPage'
import { CreateRepairShopPage } from '../features/repairShops/CreateRepairShopPage'
import { EditRepairShopPage } from '../features/repairShops/EditRepairShopPage'
import { RepairShopsPage } from '../features/repairShops/RepairShopsPage'
import { AdminProtectedRoute } from './AdminProtectedRoute'

export function AdminRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/shops" element={<RepairShopsPage />} />
          <Route path="/shops/new" element={<CreateRepairShopPage />} />
          <Route path="/shops/:id" element={<EditRepairShopPage />} />
          <Route path="/" element={<Navigate to="/shops" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/shops" replace />} />
    </Routes>
  )
}
