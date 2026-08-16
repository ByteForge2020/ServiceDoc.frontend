export interface RepairShop {
  id: string
  name: string
  subdomainName: string
  address: string | null
  phone: string | null
  createdAt: string
  timeZoneId: string
}

export interface RepairShopPayload {
  name: string
  subdomainName: string
  address: string | null
  phone: string | null
  timeZoneId: string
}
