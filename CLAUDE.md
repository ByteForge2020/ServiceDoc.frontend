# Design System — Slate (Grey-Blue)

The single source of truth for all colors, typography, and component styles is `theme.ts` (MUI theme, light mode, slate/grey-blue palette with blue accent). Claude Code must not hardcode hex values in components — always reference theme tokens instead.

## Rules for Claude Code
1. All styles must come from theme.ts only — colors, spacing, radii, and typography. Never hardcode hex colors, or arbitrary px values. Always use theme tokens: `theme.palette.background.default`, `theme.palette.text.secondary`, `theme.palette.divider`, etc. — via `useTheme()` or the `sx` prop.
2. If a new color/shade/token is needed, add it to `theme.ts` first (as a new palette token or component override), then reference it — do not inline a one-off value in a component.
3. Do not use gradients unless explicitly specified.
4. All interactive elements must have states: default, hover, active/focus, disabled — defined via MUI's built-in state handling or explicit `styleOverrides` in `theme.ts`.
5. Component-level style overrides (buttons, inputs, tables, cards, app bar, etc.) belong in `theme.ts` under `components`, not scattered across individual component files.

## Spacing Scale
Use only steps from this scale: `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px`.
Do not use arbitrary values like `13px`, `18px`, etc.

## Radii
- Small elements (badges, tags): `6px`
- Buttons, inputs: `8px`
- Cards, modals: `12px`
- Large containers: `16px`

(These are already registered in `theme.ts` via `shape.borderRadius` and component-level `styleOverrides`.)

## Typography Scale
Defined in `theme.ts` under `typography`. Use MUI's `variant` prop (`h1`–`h5`, `body1`, `body2`, `caption`, `overline`) rather than custom font-size/weight/line-height values in components.

| Variant | Size / Weight | Line-height |
|---|---|---|
| h1 | 30px / 700 | 38px |
| h2 | 24px / 600 | 32px |
| h3 | 20px / 600 | 28px |
| h4 | 18px / 600 | 26px |
| h5 | 16px / 600 | 24px |
| body1 | 14px / 400 | 20px |
| body2 | 13px / 400 | 18px |
| caption | 12px / 400 | 16px |
| overline | 11px / 600 | 14px |

Font family: `Inter, system-ui, sans-serif`.

## Where to look for specifics
- Colors, palette tokens, component overrides (buttons, inputs, paper, app bar, table cells): `theme.ts`
- Anything not yet covered in `theme.ts` (new component type, new state): add it there first, following the existing slate/blue palette, then use it.

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
6. New colors/styles → add to `theme.ts` first, then reference — never hardcode.