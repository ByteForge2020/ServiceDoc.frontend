import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMenuOpen(true)}
            aria-label={t('common.openMenu')}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
            {t('common.appName')}
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
              {user.username}
            </Typography>
          )}
          <Box sx={{ mr: 2 }}>
            <LanguageSwitcher />
          </Box>
          <Tooltip title={t('common.signOut')}>
            <IconButton onClick={() => dispatch(logout())} aria-label={t('common.signOut')}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
