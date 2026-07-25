import { AxiosError } from 'axios'
import i18n from '../i18n'

interface ApiErrorBody {
  message?: string
  title?: string
}

export function extractErrorMessage(error: unknown, fallback = i18n.t('errors.somethingWentWrong')): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined
    return data?.message ?? data?.title ?? error.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
