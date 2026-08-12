import AssignmentIcon from '@mui/icons-material/Assignment'
import SettingsIcon from '@mui/icons-material/Settings'
import WorkIcon from '@mui/icons-material/Work'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { drawerWidth } from '../../theme'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { label: t('nav.workOrders'), path: '/orders', icon: <AssignmentIcon />, disabled: false },
    { label: t('nav.jobs'), path: '/jobs', icon: <WorkIcon />, disabled: false },
    { label: t('nav.settings'), path: '/settings', icon: <SettingsIcon />, disabled: false },
  ]

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            disabled={item.disabled}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path)
              onClose()
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body1' } }} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}
