import type { ReactNode } from 'react'
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useTranslation } from 'react-i18next'

interface AppLocalizationProviderProps {
  children: ReactNode
}

export function AppLocalizationProvider({ children }: AppLocalizationProviderProps) {
  const { i18n } = useTranslation()

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={i18n.resolvedLanguage}>
      {children}
    </LocalizationProvider>
  )
}
