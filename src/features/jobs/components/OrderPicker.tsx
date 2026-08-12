import { useMemo, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../../workOrders/components/useDebouncedValue'
import { useRecentWorkOrdersQuery, useWorkOrdersSearchQuery } from '../../workOrders/queries'
import type { WorkOrderSummary } from '../../workOrders/types'

interface OrderPickerProps {
  selectedOrder: WorkOrderSummary | null
  onSelect: (order: WorkOrderSummary) => void
  onChangeOrder: () => void
}

export function OrderPicker({ selectedOrder, onSelect, onChangeOrder }: OrderPickerProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebouncedValue(inputValue, 300)
  const { data: recentOrders } = useRecentWorkOrdersQuery(6)
  const { data: searchResults, isFetching } = useWorkOrdersSearchQuery(debouncedSearch)

  const options = useMemo(() => searchResults ?? [], [searchResults])

  if (selectedOrder) {
    return (
      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('jobs.addJobModal.selectOrder')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minHeight: '42px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            px: '14px',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {t('jobs.addJobModal.orderLabel', { orderNumber: selectedOrder.orderNumber })}
          </Typography>
          <Button variant="text" onClick={onChangeOrder} sx={{ px: '8px', py: '4px', minWidth: 'auto' }}>
            ({t('jobs.addJobModal.changeOrder')})
          </Button>
        </Box>
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {t('jobs.addJobModal.selectOrder')}
      </Typography>

      {recentOrders && recentOrders.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {recentOrders.map((order) => (
            <Chip
              key={order.id}
              label={`#${order.orderNumber}`}
              variant="outlined"
              clickable
              onClick={() => onSelect(order)}
              sx={{ maxWidth: 160 }}
            />
          ))}
        </Stack>
      )}

      <Autocomplete<WorkOrderSummary, false, false, false>
        options={options}
        loading={isFetching}
        inputValue={inputValue}
        onInputChange={(_event, newValue) => setInputValue(newValue)}
        onChange={(_event, newValue) => {
          if (newValue) {
            onSelect(newValue)
          }
        }}
        getOptionLabel={(option) => option.orderNumber}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        filterOptions={(opts) => opts}
        noOptionsText={
          inputValue.trim().length === 0 ? t('jobs.addJobModal.keepTyping') : t('jobs.addJobModal.noResults')
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            fullWidth
            placeholder={t('jobs.addJobModal.searchOrderPlaceholder')}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {isFetching && <CircularProgress color="inherit" size={16} />}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    </Stack>
  )
}
