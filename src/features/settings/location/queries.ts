import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopLocationApi, type LocationInfo } from '../../../api/shopLocationApi'

const locationKey = ['shopLocation'] as const

export function useLocationInfoQuery() {
  return useQuery({
    queryKey: locationKey,
    queryFn: shopLocationApi.getLocation,
  })
}

export function useUpdateLocationInfoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LocationInfo) => shopLocationApi.updateLocation(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(locationKey, data)
    },
  })
}
