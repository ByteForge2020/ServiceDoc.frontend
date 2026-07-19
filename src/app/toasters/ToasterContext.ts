import { createContext } from 'react'

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning'

export interface ToastersContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

export const ToasterContext = createContext<ToastersContextValue | null>(null)
