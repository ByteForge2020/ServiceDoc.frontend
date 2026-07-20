import type { ToastersContextValue } from './ToasterContext'

// Lets code outside the React tree (e.g. the QueryClient's global error
// handlers) show toasts without needing a hook.
let instance: ToastersContextValue | null = null

export function setToasterInstance(value: ToastersContextValue | null) {
  instance = value
}

export function getToasterInstance(): ToastersContextValue | null {
  return instance
}
