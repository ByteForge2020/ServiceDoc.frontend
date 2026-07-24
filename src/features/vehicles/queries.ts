import { useQuery } from '@tanstack/react-query'
import { vehiclesApi } from '../../api/vehiclesApi'

export const vehicleKeys = {
  byCustomer: (customerId: string) => ['vehicles', 'byCustomer', customerId] as const,
}

export function useCustomerVehiclesQuery(customerId: string | null) {
  return useQuery({
    queryKey: vehicleKeys.byCustomer(customerId ?? ''),
    queryFn: () => vehiclesApi.getByCustomer(customerId!),
    enabled: !!customerId,
  })
}
