import { AxiosError } from 'axios'
import { extractErrorMessage } from '../../api/errorMessage'
import i18n from '../../i18n'

/** 409 means the service bay is already booked for that time; the server's plain-text body isn't shown as is. */
export function bookingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.status === 409) {
    return i18n.t('serviceBayBookings.conflict')
  }
  return extractErrorMessage(error, fallback)
}
