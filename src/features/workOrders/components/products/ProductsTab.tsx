import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { CellField } from '../../../../components/form/CellField'
import {
  createSparePartRow,
  isSparePartRowMissingName,
  sparePartRowTotal,
  type SparePartRow,
} from '../../workOrderForm'

interface ProductsTabProps {
  spareParts: SparePartRow[]
  onSparePartsChange: (spareParts: SparePartRow[]) => void
}

export function ProductsTab({ spareParts, onSparePartsChange }: ProductsTabProps) {
  const { t, i18n } = useTranslation()
  const [focusKey, setFocusKey] = useState<string | null>(null)

  const formatMoney = (value: number) =>
    value.toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const total = spareParts.reduce((sum, row) => sum + (sparePartRowTotal(row) ?? 0), 0)

  function updateRow(key: string, patch: Partial<SparePartRow>) {
    onSparePartsChange(spareParts.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function addRow() {
    const row = createSparePartRow()
    setFocusKey(row.key)
    onSparePartsChange([...spareParts, row])
  }

  return (
    <Stack spacing={3}>
      {spareParts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('products.empty')}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 240 }}>{t('products.name')}</TableCell>
                <TableCell sx={{ minWidth: 160 }}>{t('products.partNumber')}</TableCell>
                <TableCell>{t('products.qty')}</TableCell>
                <TableCell>{t('products.availQty')}</TableCell>
                <TableCell>{t('products.cost')}</TableCell>
                <TableCell>{t('products.price')}</TableCell>
                <TableCell align="right">{t('products.total')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {spareParts.map((row) => {
                const rowTotal = sparePartRowTotal(row)

                return (
                  <TableRow key={row.key}>
                    <TableCell>
                      <CellField
                        value={row.name}
                        onChange={(value) => updateRow(row.key, { name: value })}
                        ariaLabel={t('products.name')}
                        placeholder={t('products.namePlaceholder')}
                        numeric={false}
                        error={isSparePartRowMissingName(row)}
                        autoFocus={row.key === focusKey}
                      />
                    </TableCell>
                    <TableCell>
                      <CellField
                        value={row.partNumber}
                        onChange={(value) => updateRow(row.key, { partNumber: value })}
                        ariaLabel={t('products.partNumber')}
                        numeric={false}
                      />
                    </TableCell>
                    <TableCell>
                      <CellField value={row.qty} onChange={(value) => updateRow(row.key, { qty: value })} ariaLabel={t('products.qty')} />
                    </TableCell>
                    <TableCell>
                      <CellField
                        value={row.availQty}
                        onChange={(value) => updateRow(row.key, { availQty: value })}
                        ariaLabel={t('products.availQty')}
                      />
                    </TableCell>
                    <TableCell>
                      <CellField
                        value={row.costU}
                        onChange={(value) => updateRow(row.key, { costU: value })}
                        ariaLabel={t('products.cost')}
                      />
                    </TableCell>
                    <TableCell>
                      <CellField
                        value={row.priceU}
                        onChange={(value) => updateRow(row.key, { priceU: value })}
                        ariaLabel={t('products.price')}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">{rowTotal != null ? formatMoney(rowTotal) : ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => onSparePartsChange(spareParts.filter((item) => item.key !== row.key))}
                        aria-label={t('products.removeAria')}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={6} align="right" sx={{ borderBottom: 'none' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {t('products.grandTotal')}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: 'none' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatMoney(total)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: 'none' }} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addRow}>
          {t('products.addProduct')}
        </Button>
      </Box>
    </Stack>
  )
}
