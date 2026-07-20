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
  const toastRef = useRef<Toast | null>(null)
  const pending = useRef<Toast[]>([])
  const nextKey = useRef(0)

  const enqueue = useCallback((message: string, severity: ToastSeverity) => {
    nextKey.current += 1
    const item: Toast = { key: nextKey.current, message, severity }

    if (toastRef.current === null) {
      toastRef.current = item
      setToast(item)
      setOpen(true)
    } else {
      // A toast is already showing — queue this one and close the current
      // toast so its exit transition can advance the queue.
      pending.current.push(item)
      setOpen(false)
    }
  }, [])

  function handleClose(_: unknown, reason?: string) {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  function handleExited() {
    const next = pending.current.shift() ?? null
    toastRef.current = next
    setToast(next)
    if (next) {
      setOpen(true)
    }
  }

  const value = useMemo(
    () => ({
      success: (message: string) => enqueue(message, 'success'),
      error: (message: string) => enqueue(message, 'error'),
      info: (message: string) => enqueue(message, 'info'),
      warning: (message: string) => enqueue(message, 'warning'),
    }),
    [enqueue],
  )

  useEffect(() => {
    setToasterInstance(value)
    return () => setToasterInstance(null)
  }, [value])

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ transition: { onExited: handleExited } }}
      >
        <Alert onClose={handleClose} severity={toast?.severity} variant="filled" sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToasterContext.Provider>
  )
}
