import { createTheme, alpha } from '@mui/material/styles'

// Slate (grey-blue) design system — see DESIGN.md for the source tokens.
const slate = {
  900: '#0f172a',
  500: '#64748b',
  400: '#94a3b8',
  300: '#cbd5e1',
  200: '#e2e8f0',
  50: '#f8fafc',
}

const blue = {
  700: '#1d4ed8',
  600: '#2563eb',
  500: '#3b82f6',
  400: '#60a5fa',
}

const secondaryButtonHover = '#e9edf3'

export const drawerWidth = 240

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: slate[50],
      paper: '#ffffff',
    },
    primary: {
      main: blue[500],
      light: blue[400],
      dark: blue[600],
      contrastText: '#ffffff',
    },
    text: {
      primary: slate[900],
      secondary: slate[500],
      disabled: slate[400],
    },
    divider: slate[200],
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: { fontSize: '30px', fontWeight: 700, lineHeight: '38px' },
    h2: { fontSize: '24px', fontWeight: 600, lineHeight: '32px' },
    h3: { fontSize: '20px', fontWeight: 600, lineHeight: '28px' },
    h4: { fontSize: '18px', fontWeight: 600, lineHeight: '26px' },
    h5: { fontSize: '16px', fontWeight: 600, lineHeight: '24px' },
    body1: { fontSize: '14px', fontWeight: 400, lineHeight: '20px' },
    body2: { fontSize: '13px', fontWeight: 400, lineHeight: '18px' },
    caption: { fontSize: '12px', fontWeight: 400, lineHeight: '16px', color: slate[500] },
    overline: { fontSize: '11px', fontWeight: 600, lineHeight: '14px', letterSpacing: '0.5px' },
    button: { textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        },
        outlined: {
          backgroundColor: slate[200],
          color: slate[900],
          border: `1px solid ${slate[200]}`,
          '&:hover': {
            backgroundColor: secondaryButtonHover,
            border: `1px solid ${slate[200]}`,
          },
        },
        text: {
          color: blue[500],
          padding: '8px 12px',
          '&:hover': {
            backgroundColor: alpha(slate[200], 0.4),
          },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            '&:hover': { backgroundColor: blue[600] },
            '&:active': { backgroundColor: blue[700] },
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: `1px solid ${slate[200]}`,
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: slate[200],
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: slate[400],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: blue[500],
            borderWidth: 1,
            boxShadow: `0 0 0 3px ${alpha(blue[500], 0.15)}`,
          },
        },
        input: {
          padding: '10px 14px',
          '&::placeholder': {
            color: slate[400],
            opacity: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          color: slate[900],
          borderBottom: `1px solid ${slate[200]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          borderBottom: `2px solid ${slate[300]}`,
          fontWeight: 600,
          color: slate[900],
        },
        root: {
          borderBottom: `1px solid ${slate[200]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${slate[200]}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          width: 'auto',
          color: slate[500],
          '&:hover': {
            backgroundColor: slate[50],
            color: slate[900],
          },
          '&.Mui-selected': {
            backgroundColor: alpha(blue[500], 0.1),
            color: blue[600],
            '&:hover': {
              backgroundColor: alpha(blue[500], 0.15),
            },
          },
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 32,
          color: 'inherit',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${slate[200]}`,
          minHeight: 44,
        },
        indicator: {
          backgroundColor: blue[500],
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: 'none',
          fontWeight: 600,
          color: slate[500],
          '&.Mui-selected': {
            color: blue[600],
          },
          '&.Mui-disabled': {
            color: slate[400],
          },
        },
      },
    },
  },
})
