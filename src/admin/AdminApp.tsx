import { BrowserRouter } from 'react-router-dom'
import { AdminRouter } from './routes/AdminRouter'

function AdminApp() {
  return (
    <BrowserRouter>
      <AdminRouter />
    </BrowserRouter>
  )
}

export default AdminApp
