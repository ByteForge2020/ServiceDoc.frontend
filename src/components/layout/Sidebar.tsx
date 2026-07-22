import AssignmentIcon from '@mui/icons-material/Assignment'
import SettingsIcon from '@mui/icons-material/Settings'
import WorkIcon from '@mui/icons-material/Work'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import { useLocation, useNavigate } from 'react-router-dom'
import { drawerWidth } from '../../theme'

const navItems = [
  { label: 'Work orders', path: '/orders', icon: <AssignmentIcon />, disabled: false },
  { label: 'Jobs', path: '/jobs', icon: <WorkIcon />, disabled: true },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon />, disabled: true },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Drawer
      variant="permanent"
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
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body1' } }} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}
