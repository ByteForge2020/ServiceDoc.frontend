import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vehicleModelsApi } from '../../api/vehicleModelsApi'

export const vehicleModelKeys = {
  byBrand: (brandId: string) => ['vehicleModels', 'byBrand', brandId] as const,
}

export function useModelsByBrandQuery(brandId: string | null) {
  return useQuery({
    queryKey: vehicleModelKeys.byBrand(brandId ?? ''),
    queryFn: () => vehicleModelsApi.getByBrand(brandId!),
    enabled: !!brandId,
  })
}

export function useCreateVehicleModelMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ brandId, name }: { brandId: string; name: string }) =>
      vehicleModelsApi.create(brandId, name),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleModelKeys.byBrand(variables.brandId) })
    },
  })
}
