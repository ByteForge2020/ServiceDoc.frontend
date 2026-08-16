import { useShopSettingsQuery } from './queries'

export function useShopTimeZone(): string {
  const { data } = useShopSettingsQuery()
  return data?.timeZoneIana ?? 'UTC'
}
