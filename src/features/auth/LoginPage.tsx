import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useToasters } from '../../app/toasters/useToasters'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { FormTextField } from '../../components/form/FormTextField'
import { login } from './authSlice'

export function LoginPage() {
  const { t } = useTranslation()
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
        toasters.success(t('auth.signedInSuccess'))
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
              {t('common.appName')}
            </Typography>

            <FormTextField
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <FormTextField
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <Button type="submit" variant="contained" size="large" loading={status === 'loading'}>
              {t('auth.signIn')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
