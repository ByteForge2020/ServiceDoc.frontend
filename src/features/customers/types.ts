export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}

export interface CustomerSearchResult {
  customerId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  vehicleId: string | null
  licensePlate: string | null
  vin: string | null
}
