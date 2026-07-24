import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { CreateWorkOrderPage } from '../features/workOrders/CreateWorkOrderPage'
import { EditWorkOrderPage } from '../features/workOrders/EditWorkOrderPage'
import { WorkOrdersPage } from '../features/workOrders/WorkOrdersPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/orders" element={<WorkOrdersPage />} />
          <Route path="/orders/new" element={<CreateWorkOrderPage />} />
          <Route path="/orders/:id" element={<EditWorkOrderPage />} />
          <Route path="/" element={<Navigate to="/orders" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  )
}
