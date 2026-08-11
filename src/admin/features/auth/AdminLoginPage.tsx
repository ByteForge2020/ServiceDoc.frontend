import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FormTextField } from '../../../components/form/FormTextField'
import { useAdminAppDispatch, useAdminAppSelector } from '../../app/hooks'
import { adminLogin } from './adminAuthSlice'

export function AdminLoginPage() {
  const dispatch = useAdminAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const credentials = useAdminAppSelector((state) => state.adminAuth.credentials)
  const status = useAdminAppSelector((state) => state.adminAuth.status)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (credentials) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/shops'
    return <Navigate to={redirectTo} replace />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    dispatch(adminLogin({ username, password }))
      .unwrap()
      .then(() => {
        navigate((location.state as { from?: string } | null)?.from ?? '/shops', { replace: true })
      })
      .catch((message: string) => setError(message))
  }

  return (
    <Box sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="xs">
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Typography variant="h3" component="h1" sx={{ textAlign: 'center' }}>
              ServiceDoc Admin
            </Typography>

            <FormTextField
              label="Username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />

            <FormTextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && (
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {error}
              </Typography>
            )}

            <Button type="submit" variant="contained" size="large" loading={status === 'loading'}>
              Sign in
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
