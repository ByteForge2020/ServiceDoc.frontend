import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { CreateTeamMemberPage } from '../features/settings/teamMembers/CreateTeamMemberPage'
import { EditTeamMemberPage } from '../features/settings/teamMembers/EditTeamMemberPage'
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
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team-members/new" element={<CreateTeamMemberPage />} />
          <Route path="/settings/team-members/:id" element={<EditTeamMemberPage />} />
          <Route path="/" element={<Navigate to="/orders" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  )
}
