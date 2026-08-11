import LogoutIcon from '@mui/icons-material/Logout'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Outlet } from 'react-router-dom'
import { useAdminAppDispatch } from '../../app/hooks'
import { adminLogout } from '../../features/auth/adminAuthSlice'

export function AdminLayout() {
  const dispatch = useAdminAppDispatch()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
            ServiceDoc Admin
          </Typography>
          <Tooltip title="Sign out">
            <IconButton onClick={() => dispatch(adminLogout())} aria-label="Sign out">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth={false} sx={{ py: 4, width: '90%' }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
