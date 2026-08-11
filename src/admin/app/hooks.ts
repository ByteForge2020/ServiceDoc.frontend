import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { AdminAppDispatch, AdminRootState } from './adminStore'

export const useAdminAppDispatch = useDispatch.withTypes<AdminAppDispatch>()
export const useAdminAppSelector: TypedUseSelectorHook<AdminRootState> = useSelector
