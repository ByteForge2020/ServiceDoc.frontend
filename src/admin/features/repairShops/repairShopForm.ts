import type { RepairShopFormState } from './components/RepairShopFormLayout'
import type { RepairShop, RepairShopPayload } from './types'

export const EMPTY_REPAIR_SHOP: RepairShopFormState = {
  name: '',
  subdomainName: '',
  address: '',
  phone: '',
  timeZoneId: '',
}

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export function isValidSubdomain(subdomainName: string): boolean {
  return SUBDOMAIN_PATTERN.test(subdomainName)
}

export function repairShopToFormState(repairShop: RepairShop): RepairShopFormState {
  return {
    name: repairShop.name,
    subdomainName: repairShop.subdomainName,
    address: repairShop.address ?? '',
    phone: repairShop.phone ?? '',
    timeZoneId: repairShop.timeZoneId,
  }
}

export function buildRepairShopPayload(value: RepairShopFormState): RepairShopPayload {
  return {
    name: value.name.trim(),
    subdomainName: value.subdomainName.trim().toLowerCase(),
    address: value.address.trim() || null,
    phone: value.phone.trim() || null,
    timeZoneId: value.timeZoneId,
  }
}
