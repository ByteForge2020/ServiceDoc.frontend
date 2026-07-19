# Design System — Slate (Grey-Blue)

Single source of truth for design. Claude Code must strictly follow these values and must not invent new colors, spacing, or radii.

## Color Palette

Based on Tailwind `slate` (grey-blue tones). One accent color — blue.

### Background & Surfaces
| Purpose | Variable | Value |
|---|---|---|
| Page background (dark theme) | `--bg-page` | `#0f172a` (slate-900) |
| Page background (light theme) | `--bg-page-light` | `#f8fafc` (slate-50) |
| Surface (cards, panels) | `--surface` | `#1e293b` (slate-800) |
| Surface (light theme) | `--surface-light` | `#ffffff` |
| Surface hover | `--surface-hover` | `#334155` (slate-700) |
| Border | `--border` | `#334155` (slate-700) |
| Border (light theme) | `--border-light` | `#e2e8f0` (slate-200) |

### Text
| Purpose | Variable | Value |
|---|---|---|
| Text primary | `--text-primary` | `#f1f5f9` (slate-100) |
| Text primary (light theme) | `--text-primary-light` | `#0f172a` (slate-900) |
| Text secondary | `--text-secondary` | `#94a3b8` (slate-400) |
| Text muted | `--text-muted` | `#64748b` (slate-500) |

### Accent (blue)
| Purpose | Variable | Value |
|---|---|---|
| Accent default | `--accent` | `#3b82f6` (blue-500) |
| Accent hover | `--accent-hover` | `#2563eb` (blue-600) |
| Accent active/pressed | `--accent-active` | `#1d4ed8` (blue-700) |
| Accent bg (subtle, for badges) | `--accent-bg` | `#1e3a8a20` (blue-900, 12% opacity) |

### Status Colors (use only for states)
| Purpose | Value |
|---|---|
| Success | `#22c55e` (green-500) |
| Error | `#ef4444` (red-500) |
| Warning | `#f59e0b` (amber-500) |

## Buttons

### Primary Button
- Background: `--accent` (`#3b82f6`)
- Text: `#ffffff`
- Hover: background `--accent-hover` (`#2563eb`)
- Active: background `--accent-active` (`#1d4ed8`)
- Radius: `8px`
- Padding: `10px 20px`
- Font-weight: `600`
- Disabled: opacity `0.5`, cursor `not-allowed`

### Secondary Button
- Background: `--surface-hover` (`#334155`)
- Text: `--text-primary` (`#f1f5f9`)
- Border: `1px solid var(--border)`
- Hover: slightly lighter background — `#3f4d63`
- Radius: `8px`
- Padding: `10px 20px`

### Ghost / Text Button
- Background: `transparent`
- Text: `--accent` (`#3b82f6`)
- Hover: background `--surface-hover` at 40% opacity
- Padding: `8px 12px`

## Inputs (input, textarea, select)
- Background: `--surface` (`#1e293b`)
- Border: `1px solid var(--border)` (`#334155`)
- Border (focus): `1px solid var(--accent)` (`#3b82f6`) + box-shadow `0 0 0 3px rgba(59,130,246,0.15)`
- Text: `--text-primary`
- Placeholder: `--text-muted`
- Radius: `8px`
- Padding: `10px 14px`

## Cards / Modals
- Background: `--surface`
- Border: `1px solid var(--border)`
- Radius: `12px`
- Shadow: `0 4px 12px rgba(0,0,0,0.25)`
- Padding: `20px` (or `24px` for larger ones)

## Typography

Font: `Inter, system-ui, sans-serif`

### Headings
| Style | Size / Weight | Line-height |
|---|---|---|
| Display | 36px / 700 | 44px |
| H1 | 30px / 700 | 38px |
| H2 | 24px / 600 | 32px |
| H3 | 20px / 600 | 28px |
| H4 | 18px / 600 | 26px |
| H5 | 16px / 600 | 24px |

### Body
| Style | Size / Weight | Line-height |
|---|---|---|
| Body Large | 16px / 400 | 24px |
| Body | 14px / 400 | 20px |
| Body Medium | 14px / 500 | 20px |
| Body Small | 13px / 400 | 18px |

### Supporting
| Style | Size / Weight | Line-height | Notes |
|---|---|---|---|
| Caption | 12px / 400 | 16px | color `--text-secondary` |
| Overline | 11px / 600 | 14px | uppercase, letter-spacing 0.5px |
| Label | 13px / 500 | 16px | for input labels |

### Code
| Style | Size / Weight | Line-height | Notes |
|---|---|---|---|
| Code inline | 13px / 400 | — | monospace font |
| Code block | 14px / 400 | 22px | monospace font |

## Spacing Scale
Use only steps from this scale: `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px`.
Do not use arbitrary values like `13px`, `18px`, etc.

## Radii
- Small elements (badges, tags): `6px`
- Buttons, inputs: `8px`
- Cards, modals: `12px`
- Large containers: `16px`

## Rules for Claude Code
1. Use only colors from the tables above — no hardcoded hex values outside this list.
2. If a new shade is needed, use only adjacent steps within the `slate` (50–900) or `blue` (500–700) palettes — do not mix in other color families (except status colors: success/error/warning).
3. Register these values in the MUI theme (see below) via `createTheme()` and reference theme tokens (`theme.palette.*`) instead of hardcoded hex values in components.
4. Do not use gradients unless explicitly specified elsewhere.
5. All interactive elements must have states: default, hover, active/focus, disabled.

## Example MUI Theme

```ts
// theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b',   // slate-800
    },
    primary: {
      main: '#3b82f6',    // blue-500
      light: '#60a5fa',
      dark: '#2563eb',    // blue-600
      contrastText: '#ffffff',
    },
    text: {
      primary: '#f1f5f9',   // slate-100
      secondary: '#94a3b8', // slate-400
      disabled: '#64748b',  // slate-500
    },
    divider: '#334155', // slate-700
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
    caption: { fontSize: '12px', fontWeight: 400, lineHeight: '16px' },
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
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
```

Usage in components: reference `theme.palette.primary.main`, `theme.palette.background.paper`, etc. via `useTheme()` or `sx` prop — never hardcode hex values directly in component styles.

## Tech Stack Conventions

Use these libraries/patterns consistently across the project. Do not introduce alternatives without explicit approval.

- **HTTP client**: `axios` (not `fetch`) — use a shared configured instance (base URL, interceptors for auth/errors).
- **UI library**: `MUI` (Material UI) — use MUI components as the base; do not mix in other component libraries.
- **Icons**: `@mui/icons-material` — do not mix in other icon sets (e.g. lucide, react-icons) unless a specific icon is missing.
- **Server state / data fetching**: `React Query` (`useQuery` / `useMutation`) for all server-state fetching, caching, and invalidation. Do not fetch data manually in `useEffect`.
- **Client/global state**: `Redux Toolkit` — use `createAsyncThunk` for async actions that mutate global state; use React Query for read-only server state instead of duplicating it in Redux where possible.
- **Routing**: `React Router` — use `useNavigate`, `useParams`, nested routes; protected routes via a wrapper component.
- **Notifications**: `useToasters` hook for all success/error/info feedback — do not use inline error text or `alert()`.
- **Dates**: `Luxon` for date/time handling — do not mix in `moment` or raw `Date` manipulation.

### Conventions checklist for Claude Code
1. New API calls → `axios` instance + wrapped in a `useQuery`/`useMutation` hook.
2. New global/cross-page state → Redux slice with `createAsyncThunk` for async logic.
3. New user feedback (success/error) → `useToasters`, never inline text or browser `alert`.
4. New icons → pull from `@mui/icons-material` first.
5. New pages/routes → register via `React Router`, wrap protected ones in the auth guard component.