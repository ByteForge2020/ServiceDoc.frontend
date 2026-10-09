import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { EstimateType } from '../../api/estimateMasterListApi'
import type { CellSelectOption } from '../../components/form/CellSelect'

/** The Fixed / Hourly choices, labelled in the current language. Shared by the Estimate tab and the Work Catalog. */
export function useEstimateTypeOptions() {
  const { t } = useTranslation()

  return useMemo<CellSelectOption<EstimateType>[]>(
    () => [
      { value: 'Fixed', label: t('estimate.typeFixed') },
      { value: 'Hourly', label: t('estimate.typeHourly') },
    ],
    [t],
  )
}

/** Label of a single type, for read-only display. */
export function useEstimateTypeLabel() {
  const options = useEstimateTypeOptions()

  return (type: EstimateType) => options.find((option) => option.value === type)?.label ?? type
}
