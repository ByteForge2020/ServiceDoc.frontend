import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { login } from './authSlice'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const status = useAppSelector((state) => state.auth.status)
  const error = useAppSelector((state) => state.auth.error)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (accessToken) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/orders'
    return <Navigate to={redirectTo} replace />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    dispatch(login({ email, password }))
  }

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="xs">
        <Paper variant="outlined" sx={{ p: 4 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Typography variant="h5" component="h1" sx={{ textAlign: 'center' }}>
              ServiceDoc
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" loading={status === 'loading'}>
              Sign in
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
