import { Fragment } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'
import type { EstimateStatus } from '../../types'
import {
  createEstimateFormState,
  createEstimateItemRow,
  type EstimateFormState,
  type EstimateItemRow,
} from '../../workOrderForm'
import { estimateMasterListLabel } from '../../estimateMasterListLabel'
import { SearchInputDropdown } from './SearchInputDropdown'

const segmentBorder = { borderLeft: 2, borderLeftColor: 'divider' } as const

interface EstimateTabProps {
  estimates: EstimateFormState[]
  onEstimatesChange: (estimates: EstimateFormState[]) => void
}

export function EstimateTab({ estimates, onEstimatesChange }: EstimateTabProps) {
  const { t } = useTranslation()

  function updateEstimate(key: string, patch: Partial<EstimateFormState>) {
    onEstimatesChange(estimates.map((estimate) => (estimate.key === key ? { ...estimate, ...patch } : estimate)))
  }

  function updateSubItem(estimateKey: string, subKey: string, patch: Partial<EstimateItemRow>) {
    const estimate = estimates.find((item) => item.key === estimateKey)
    if (!estimate) {
      return
    }

    updateEstimate(estimateKey, {
      subItems: estimate.subItems.map((row) => (row.key === subKey ? { ...row, ...patch } : row)),
    })
  }

  return (
    <Stack spacing={3}>
      {estimates.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ minWidth: 200 }}>
                  {t('estimate.name')}
                </TableCell>
                <TableCell rowSpan={2}>{t('estimate.status')}</TableCell>
                <TableCell colSpan={5} align="center" sx={segmentBorder}>
                  {t('estimate.part')}
                </TableCell>
                <TableCell colSpan={2} align="center" sx={segmentBorder}>
                  {t('estimate.labor')}
                </TableCell>
                <TableCell rowSpan={2} align="center" sx={segmentBorder}>
                  {t('estimate.discount')}
                </TableCell>
                <TableCell rowSpan={2} align="center" sx={segmentBorder}>
                  {t('estimate.total')}
                </TableCell>
                <TableCell rowSpan={2} />
              </TableRow>
              <TableRow>
                <TableCell sx={segmentBorder}>{t('estimate.partNumber')}</TableCell>
                <TableCell>{t('estimate.qty')}</TableCell>
                <TableCell>{t('estimate.availQty')}</TableCell>
                <TableCell>{t('estimate.cost')}</TableCell>
                <TableCell>{t('estimate.price')}</TableCell>
                <TableCell sx={segmentBorder}>{t('estimate.hours')}</TableCell>
                <TableCell>{t('estimate.priceHr')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {estimates.map((estimate) => (
                <Fragment key={estimate.key}>
                  <EstimateItemRowView
                    row={estimate.root}
                    status={estimate.status}
                    onStatusChange={(status) => updateEstimate(estimate.key, { status })}
                    onChange={(patch) => updateEstimate(estimate.key, { root: { ...estimate.root, ...patch } })}
                    onRemove={() => onEstimatesChange(estimates.filter((item) => item.key !== estimate.key))}
                    onAddSubItem={() =>
                      updateEstimate(estimate.key, {
                        subItems: [...estimate.subItems, createEstimateItemRow(true)],
                      })
                    }
                  />
                  {estimate.subItems.map((sub) => (
                    <EstimateItemRowView
                      key={sub.key}
                      row={sub}
                      onChange={(patch) => updateSubItem(estimate.key, sub.key, patch)}
                      onRemove={() =>
                        updateEstimate(estimate.key, {
                          subItems: estimate.subItems.filter((row) => row.key !== sub.key),
                        })
                      }
                    />
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box>
        <SearchInputDropdown
          onSelect={(name) => onEstimatesChange([...estimates, createEstimateFormState(name)])}
        />
      </Box>
    </Stack>
  )
}

interface CellFieldProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
}

function CellField({ value, onChange, ariaLabel }: CellFieldProps) {
  return (
    <TextField
      size="small"
      variant="outlined"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{ htmlInput: { 'aria-label': ariaLabel, inputMode: 'decimal' } }}
    />
  )
}

interface EstimateItemRowViewProps {
  row: EstimateItemRow
  onChange: (patch: Partial<EstimateItemRow>) => void
  onRemove: () => void
  onAddSubItem?: () => void
  status?: EstimateStatus
  onStatusChange?: (status: EstimateStatus) => void
}

function EstimateItemRowView({
  row,
  onChange,
  onRemove,
  onAddSubItem,
  status,
  onStatusChange,
}: EstimateItemRowViewProps) {
  const { t } = useTranslation()

  return (
    <TableRow sx={row.subItem ? { backgroundColor: 'background.default' } : undefined}>
      <TableCell sx={row.subItem ? { pl: 4 } : undefined}>
        <TextField
          size="small"
          variant="outlined"
          fullWidth
          value={estimateMasterListLabel(row.name, t)}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder={row.subItem ? t('estimate.subItemNamePlaceholder') : undefined}
          slotProps={{ htmlInput: { 'aria-label': t('estimate.name') } }}
        />
      </TableCell>
      <TableCell>
        {/* Status belongs to the estimate, so only its root row shows it. */}
        {status && onStatusChange && (
          <Stack direction="row" spacing={0}>
            <IconButton
              size="small"
              onClick={() => onStatusChange(status === 'Approved' ? 'Draft' : 'Approved')}
              color={status === 'Approved' ? 'success' : 'default'}
              aria-label={t('estimate.approveAria')}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onStatusChange(status === 'Rejected' ? 'Draft' : 'Rejected')}
              color={status === 'Rejected' ? 'error' : 'default'}
              aria-label={t('estimate.rejectAria')}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </TableCell>
      <TableCell sx={segmentBorder}>
        <CellField value={row.partNumber} onChange={(value) => onChange({ partNumber: value })} ariaLabel={t('estimate.partNumber')} />
      </TableCell>
      <TableCell>
        <CellField value={row.partQty} onChange={(value) => onChange({ partQty: value })} ariaLabel={t('estimate.qty')} />
      </TableCell>
      <TableCell>
        <CellField value={row.availQty} onChange={(value) => onChange({ availQty: value })} ariaLabel={t('estimate.availQty')} />
      </TableCell>
      <TableCell>
        <CellField value={row.partCostU} onChange={(value) => onChange({ partCostU: value })} ariaLabel={t('estimate.cost')} />
      </TableCell>
      <TableCell>
        <CellField value={row.partPriceU} onChange={(value) => onChange({ partPriceU: value })} ariaLabel={t('estimate.price')} />
      </TableCell>
      <TableCell sx={segmentBorder}>
        <CellField value={row.hours} onChange={(value) => onChange({ hours: value })} ariaLabel={t('estimate.hours')} />
      </TableCell>
      <TableCell>
        <CellField value={row.priceHr} onChange={(value) => onChange({ priceHr: value })} ariaLabel={t('estimate.priceHr')} />
      </TableCell>
      <TableCell sx={segmentBorder}>
        <CellField value={row.discount} onChange={(value) => onChange({ discount: value })} ariaLabel={t('estimate.discount')} />
      </TableCell>
      <TableCell sx={segmentBorder}>
        <CellField value={row.total} onChange={(value) => onChange({ total: value })} ariaLabel={t('estimate.total')} />
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={0}>
          {onAddSubItem && (
            <IconButton size="small" onClick={onAddSubItem} aria-label={t('estimate.addSubItem')}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onRemove} aria-label={t('estimate.removeAria')}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
