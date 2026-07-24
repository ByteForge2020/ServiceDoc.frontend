export interface Vehicle {
  id: string
  customerId: string | null
  brandId: string | null
  brandName: string | null
  modelId: string | null
  modelName: string | null
  year: number | null
  vin: string | null
  licensePlate: string | null
  mileage: number | null
}
