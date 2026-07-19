import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useToasters } from '../../app/toasters/useToasters'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { login } from './authSlice'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toasters = useToasters()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const status = useAppSelector((state) => state.auth.status)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (accessToken) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/orders'
    return <Navigate to={redirectTo} replace />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    dispatch(login({ email, password }))
      .unwrap()
      .then(() => {
        toasters.success('Signed in successfully.')
        navigate((location.state as { from?: string } | null)?.from ?? '/orders', { replace: true })
      })
      .catch((message: string) => toasters.error(message))
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
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Typography variant="h3" component="h1" sx={{ textAlign: 'center' }}>
              ServiceDoc
            </Typography>

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
