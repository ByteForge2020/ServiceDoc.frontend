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
import AdminApp from './AdminApp.tsx'
import { adminStore } from './app/adminStore'
import { getToasterInstance } from '../app/toasters/toasterInstance'
import { ToasterProvider } from '../app/toasters/ToasterProvider'
import { extractErrorMessage } from './api/errorMessage'
import '../index.css'
import { theme } from '../theme'

function notifyError(error: unknown, meta: Record<string, unknown> | undefined) {
  if (meta?.skipErrorToast) {
    return
  }
  getToasterInstance()?.error(extractErrorMessage(error))
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
    <Provider store={adminStore}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToasterProvider>
            <AdminApp />
          </ToasterProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
