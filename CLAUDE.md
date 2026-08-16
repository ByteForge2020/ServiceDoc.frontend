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
- **Dates**: `Luxon` for date/time handling — do not mix in `moment` or raw `Date` manipulation. All API/DB datetimes are UTC; when rendering or editing a datetime for the user, convert it to the shop's zone via `useShopTimeZone()` (see below) — never render a raw UTC value or the browser's local zone.

## Shared / Common Components

Before building a new UI primitive (form field, picker, dialog, provider/hook), check whether one already exists and reuse or extend it — never build a feature-local one-off duplicate.

- **Form fields** (`src/components/form/`): `FormTextField`, `FormSelect`, `FormCreatableAutocomplete`, `SelectedEntityField`, `AppDatePicker`, `AppTimeField`. All share the same label-above-field pattern (`Typography` label with a red `*` when `required`, wrapped in `Stack spacing={1}`) and the same outlined-input look from `theme.ts`. Match this pattern exactly when adding a new field component so every form in the app looks consistent.
- **Confirmation dialogs** (`src/app/confirm/`): `useConfirm()` — `const ok = await confirm({ message, title?, confirmLabel?, cancelLabel?, destructive? })`. One dialog is mounted once at the app root; every "are you sure?" prompt (deletes, discards, etc.) anywhere in the app must go through this hook instead of a new `Dialog` built inline.
- **Toasts** (`src/app/toasters/`): `useToasters()` — see Notifications above.
- **Localization** (`src/app/localization/`): `AppLocalizationProvider` wraps MUI X's `LocalizationProvider` and keeps its locale in sync with the active i18next language. Never add a second `LocalizationProvider` in a feature — date/time pickers must go through `AppDatePicker`/`AppTimeField` so they inherit this automatically.
- **Shop time zone** (`src/app/shop/`): `useShopTimeZone()` — returns the logged-in shop's IANA time zone string (e.g. `"America/New_York"`, defaults to `"UTC"` while loading), backed by a React Query hook (`useShopSettingsQuery`) hitting `GET /api/v1/general/shop`. Use it whenever a component displays or edits a UTC API timestamp: `DateTime.fromISO(isoUtc, { zone: 'utc' }).setZone(zone)` to display, and `.toUTC().toISO()` to convert a shop-local picked value back before sending to the API. See `src/features/jobs/timeUtils.ts` and `src/features/jobs/components/JobCard.tsx`/`JobFormModal.tsx` for the established pattern. Only exception: admin-panel views that span multiple shops (e.g. `src/admin/features/repairShops/RepairShopsPage.tsx`) have no single "current shop" and must not use this hook — it requires the shop-scoped JWT the admin panel doesn't have.

If a genuinely new reusable primitive is needed, add it under `src/components/` (plain components) or `src/app/<name>/` (provider + hook pairs, mirroring `confirm/` and `toasters/`) so every feature can reuse it — do not implement a look-alike inside a `features/*` folder.

### Conventions checklist for Claude Code
1. New API calls → `axios` instance + wrapped in a `useQuery`/`useMutation` hook.
2. New global/cross-page state → Redux slice with `createAsyncThunk` for async logic.
3. New user feedback (success/error) → `useToasters`, never inline text or browser `alert`.
4. New icons → pull from `@mui/icons-material` first.
5. New pages/routes → register via `React Router`, wrap protected ones in the auth guard component.
6. New colors/styles → add to `theme.ts` first, then reference — never hardcode.
7. New form field, dialog, or provider/hook → check `src/components/form/` and `src/app/` first; reuse what's there, or add it there if missing — never duplicate inside a `features/*` folder.