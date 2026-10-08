import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToasterContext, type ToastSeverity } from './ToasterContext'
import { setToasterInstance } from './toasterInstance'

interface Toast {
  key: number
  message: string
  severity: ToastSeverity
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [open, setOpen] = useState(false)
  const nextKey = useRef(0)

  // The latest toast wins: it replaces whatever is showing, immediately. A queue that advances on the exit
  // transition can deadlock when two toasts are raised in the same tick (the first is never drawn, so it never
  // "exits"), and after that no toast would show until a page reload. It also means that when a global handler and
  // a caller both report the same failure, the caller's (later, more specific) message is the one the user sees.
  const show = useCallback((message: string, severity: ToastSeverity) => {
    nextKey.current += 1
    setToast({ key: nextKey.current, message, severity })
    setOpen(true)
  }, [])

  function handleClose(_: unknown, reason?: string) {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const value = useMemo(
    () => ({
      success: (message: string) => show(message, 'success'),
      error: (message: string) => show(message, 'error'),
      info: (message: string) => show(message, 'info'),
      warning: (message: string) => show(message, 'warning'),
    }),
    [show],
  )

  useEffect(() => {
    setToasterInstance(value)
    return () => setToasterInstance(null)
  }, [value])

  return (
    <ToasterContext.Provider value={value}>
      {children}
      {/* Keyed so a new toast remounts the Snackbar and restarts its auto-hide timer. */}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={toast?.severity} variant="filled" sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToasterContext.Provider>
  )
}
