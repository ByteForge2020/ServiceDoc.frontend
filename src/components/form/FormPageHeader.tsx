import type { ReactNode } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button, { type ButtonProps } from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface FormPageHeaderProps {
  title: string
  onBack: () => void
  backAriaLabel: string
  /** The buttons on the right: put them in a `FormPageActions`. */
  actions: ReactNode
  /** Rides along under the title row inside the sticky block (e.g. tabs). */
  children?: ReactNode
}

/**
 * The header of a full-page form: where we are on the left, what can be done on the right. It sticks under the app bar,
 * so Save stays at hand however far the form scrolls. It has to sit inside the `<form>` for its Save button to submit it.
 */
export function FormPageHeader({ title, onBack, backAriaLabel, actions, children }: FormPageHeaderProps) {
  return (
    <Box
      sx={{
        position: 'sticky',
        // The app bar's height (MUI's default toolbar: 56px on a narrow screen, 64px otherwise).
        top: { xs: 56, sm: 64 },
        zIndex: 2,
        // A solid background hides what scrolls beneath the bar.
        bgcolor: 'background.default',
        // Pulls the bar over the container's top padding so nothing shows above it when it sticks.
        mt: -4,
        pt: 4,
        // The gap to the content is the bar's own padding, so nothing shows through it while it sticks.
        pb: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          pb: children ? 2 : 0,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
          <IconButton onClick={onBack} aria-label={backAriaLabel}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h2" component="h1">
            {title}
          </Typography>
        </Stack>

        {actions}
      </Box>

      {children}
    </Box>
  )
}

/** The row of header buttons: one compact size for all of them, 8px apart. */
export function FormPageActions({ children }: { children: ReactNode }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        '& .MuiButton-root': { height: 40, py: 0, px: 2.5, fontSize: 13, borderRadius: '12px' },
      }}
    >
      {children}
    </Stack>
  )
}

/** A ghost button: a thin border and no fill, so it reads as a button but stays quieter than the main action. */
export function FormCancelButton(props: ButtonProps) {
  return (
    <Button
      variant="outlined"
      color="inherit"
      {...props}
      sx={{
        bgcolor: 'transparent',
        color: 'text.secondary',
        borderColor: 'grey.400',
        '&:hover': { bgcolor: 'action.hover', borderColor: 'grey.500', color: 'text.primary' },
      }}
    />
  )
}

/** The main action: a thin, soft shadow lifts it; on hover it grows a little, on press it settles back. */
export function FormSaveButton(props: ButtonProps) {
  return (
    <Button
      type="submit"
      variant="contained"
      {...props}
      sx={{
        boxShadow: '0 1px 2px rgba(15,23,42,0.12), 0 1px 3px rgba(59,130,246,0.25)',
        transition: 'background-color 150ms, box-shadow 150ms',
        '&:hover': { boxShadow: '0 2px 4px rgba(15,23,42,0.14), 0 4px 10px rgba(59,130,246,0.3)' },
        '&:active': { boxShadow: '0 1px 2px rgba(15,23,42,0.12)' },
        '&.Mui-disabled': { boxShadow: 'none' },
      }}
    />
  )
}
