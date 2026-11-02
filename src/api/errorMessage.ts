import { AxiosError } from 'axios'
import i18n from '../i18n'

interface ApiErrorBody {
  message?: string
  title?: string
}

export function extractErrorMessage(error: unknown, fallback = i18n.t('errors.somethingWentWrong')): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const data = error.response?.data as ApiErrorBody | string | undefined

    // The API answers a business failure with the message as the bare body (BadRequest("...")).
    if (typeof data === 'string' && data.trim() && status >= 400 && status < 500) {
      return data.trim()
    }

    const body = typeof data === 'object' ? data : undefined

    return body?.message ?? body?.title ?? error.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
