import { createContext } from 'react'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /** Only the confirm button: an information dialog that is just acknowledged. */
  hideCancel?: boolean
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn | null>(null)
