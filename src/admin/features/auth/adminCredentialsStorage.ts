const CREDENTIALS_KEY = 'servicedoc.admin.credentials'

export const adminCredentialsStorage = {
  get(): string | null {
    return sessionStorage.getItem(CREDENTIALS_KEY)
  },
  set(credentials: string): void {
    sessionStorage.setItem(CREDENTIALS_KEY, credentials)
  },
  clear(): void {
    sessionStorage.removeItem(CREDENTIALS_KEY)
  },
}
