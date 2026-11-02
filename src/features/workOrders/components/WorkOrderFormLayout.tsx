import type { FormEvent } from 'react'
import { useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PrintIcon from '@mui/icons-material/Print'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { DiscountType } from '../../../app/shop/shopApi'
import { ReadOnlyScope } from '../../../components/ReadOnlyScope'
import type { EstimateFormState, SparePartRow } from '../workOrderForm'
import { CustomerInformationCard, type CustomerFormState } from './CustomerInformationCard'
import { EstimateTab } from './estimate/EstimateTab'
import { OrderInformationCard } from './OrderInformationCard'
import { ProductsTab } from './products/ProductsTab'
import { VehicleInformationCard, type VehicleFormState } from './VehicleInformationCard'

interface WorkOrderFormLayoutProps {
  title: string
  onBack: () => void
  customer: CustomerFormState
  onCustomerChange: (value: CustomerFormState) => void
  vehicle: VehicleFormState
  onVehicleChange: (value: VehicleFormState) => void
  orderNumber: string
  onOrderNumberChange: (value: string) => void
  orderNumberError: boolean
  phaseId: string
  onPhaseChange: (value: string) => void
  savedPhase?: { id: string; name: string }
  notes: string
  onNotesChange: (value: string) => void
  estimates: EstimateFormState[]
  onEstimatesChange: (value: EstimateFormState[]) => void
  /** How the estimate's discounts are read: the order's own type when editing, the shop's current one when creating. */
  discountType: DiscountType
  /** The tax rate the estimate's taxes are worked out at: the order's own when editing, the shop's current one when creating. */
  taxPercent: number | null
  spareParts: SparePartRow[]
  onSparePartsChange: (value: SparePartRow[]) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
  canSave: boolean
  /** A closed order: every field is locked, Save is gone and the Close button turns into "Return to work". */
  readOnly?: boolean
  /** Asks to save and close the order (with its own confirmation). */
  onCloseOrder: () => void
  onReopen?: () => void
  reopening?: boolean
  onPrintPdf?: () => void
  printingPdf?: boolean
}

export function WorkOrderFormLayout({
  title,
  onBack,
  customer,
  onCustomerChange,
  vehicle,
  onVehicleChange,
  orderNumber,
  onOrderNumberChange,
  orderNumberError,
  phaseId,
  onPhaseChange,
  savedPhase,
  notes,
  onNotesChange,
  estimates,
  onEstimatesChange,
  discountType,
  taxPercent,
  spareParts,
  onSparePartsChange,
  onSubmit,
  onCancel,
  saving,
  saveLabel,
  canSave,
  readOnly = false,
  onCloseOrder,
  onReopen,
  reopening = false,
  onPrintPdf,
  printingPdf = false,
}: WorkOrderFormLayoutProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label={t('workOrderForm.backAria')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_event, newValue: number) => setTab(newValue)} sx={{ flexGrow: 1, borderBottom: 'none' }}>
              <Tab label={t('workOrderForm.generalInformation')} value={0} />
              <Tab label={t('workOrderForm.estimate')} value={1} />
              <Tab label={t('workOrderForm.products')} value={2} />
            </Tabs>
            {onPrintPdf && (
              <Tooltip title={t('workOrderForm.printPdf')}>
                <span>
                  <IconButton onClick={onPrintPdf} disabled={printingPdf} aria-label={t('workOrderForm.printPdf')}>
                    {printingPdf ? <CircularProgress size={24} /> : <PrintIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>

          {/* The tabs stay clickable on a closed order; only what is inside them is locked. */}
          <ReadOnlyScope active={readOnly}>
            {tab === 0 && (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    alignItems: 'start',
                    gap: 4,
                  }}
                >
                  <CustomerInformationCard value={customer} onChange={onCustomerChange} />
                  <VehicleInformationCard value={vehicle} onChange={onVehicleChange} customerId={customer.customerId} />
                  <OrderInformationCard
                    orderNumber={orderNumber}
                    onOrderNumberChange={onOrderNumberChange}
                    orderNumberError={orderNumberError}
                    phaseId={phaseId}
                    onPhaseChange={onPhaseChange}
                    savedPhase={savedPhase}
                    onRequestClose={onCloseOrder}
                    notes={notes}
                    onNotesChange={onNotesChange}
                  />
                </Box>
              </Paper>
            )}

            {tab === 1 && (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
                <EstimateTab
                  estimates={estimates}
                  onEstimatesChange={onEstimatesChange}
                  discountType={discountType}
                  taxPercent={taxPercent}
                />
              </Paper>
            )}

            {tab === 2 && (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
                <ProductsTab spareParts={spareParts} onSparePartsChange={onSparePartsChange} />
              </Paper>
            )}
          </ReadOnlyScope>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {readOnly ? (
              <Button variant="outlined" startIcon={<LockOpenOutlinedIcon />} onClick={onReopen} loading={reopening}>
                {t('workOrderForm.reopenOrder')}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LockOutlinedIcon />}
                onClick={onCloseOrder}
                disabled={!canSave || saving}
              >
                {t('workOrderForm.closeOrder')}
              </Button>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="text" onClick={onCancel} disabled={saving}>
                {readOnly ? t('common.back') : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button type="submit" variant="contained" loading={saving} disabled={!canSave}>
                  {saveLabel}
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  )
}
