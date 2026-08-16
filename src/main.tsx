import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import { AppLocalizationProvider } from './app/localization/AppLocalizationProvider'
import { ConfirmProvider } from './app/confirm/ConfirmProvider'
import { store } from './app/store'
import { getToasterInstance } from './app/toasters/toasterInstance'
import { ToasterProvider } from './app/toasters/ToasterProvider'
import './index.css'
import i18n from './i18n'
import { theme } from './theme'

function notifyError(error: unknown, meta: Record<string, unknown> | undefined) {
  if (meta?.skipErrorToast) {
    return
  }
  const message = error instanceof Error ? error.message : i18n.t('errors.somethingWentWrong')
  getToasterInstance()?.error(message)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => notifyError(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => notifyError(error, mutation.meta),
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppLocalizationProvider>
            <ToasterProvider>
              <ConfirmProvider>
                <App />
              </ConfirmProvider>
            </ToasterProvider>
          </AppLocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
