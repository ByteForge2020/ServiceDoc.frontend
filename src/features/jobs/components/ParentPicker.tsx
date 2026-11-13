import { useMemo, useState } from 'react'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, type Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useAppointmentsSearchQuery, useRecentAppointmentsQuery } from '../../appointments/queries'
import { useAppointmentDetails } from '../../appointmentSlots/useAppointmentDetails'
import { useDebouncedValue } from '../../workOrders/components/useDebouncedValue'
import { useRecentWorkOrdersQuery, useWorkOrdersSearchQuery } from '../../workOrders/queries'
import { appointmentParent, orderParent, type SlotParent, type SlotParentKind } from '../slotParent'

const CHIPS_PER_KIND = 4

interface PickerOption {
  parent: SlotParent
  /** The second line: who it is for and when (appointments only). */
  details: string | null
}

/** The look that tells the two kinds apart everywhere: a work order is solid blue, an appointment dashed violet. */
function kindSx(kind: SlotParentKind) {
  const palette = kind === 'appointment' ? 'appointment' : 'primary'

  return {
    color: `${palette}.dark`,
    borderColor: `${palette}.light`,
    borderStyle: kind === 'appointment' ? 'dashed' : 'solid',
    bgcolor: (theme: Theme) => alpha(theme.palette[palette].main, 0.08),
    '& .MuiChip-icon': { color: 'inherit' },
  }
}

/** "Work order" / "Appointment": says which kind of thing the time is booked for. */
export function ParentBadge({ kind }: { kind: SlotParentKind }) {
  const { t } = useTranslation()

  return (
    <Chip
      size="small"
      variant="outlined"
      label={t(kind === 'appointment' ? 'slotForm.appointmentBadge' : 'slotForm.orderBadge')}
      icon={kind === 'appointment' ? <CalendarMonthIcon /> : undefined}
      sx={{ ...kindSx(kind), fontWeight: 600 }}
    />
  )
}

/** "#123" for a work order, "№45" for an appointment. */
function parentNumberLabel(parent: SlotParent): string {
  return parent.kind === 'appointment' ? `№${parent.number}` : `#${parent.number}`
}

interface ParentPickerProps {
  selectedParent: SlotParent | null
  /** Hides the "change" link: the selected work order or appointment is fixed. */
  locked?: boolean
  onSelect: (parent: SlotParent) => void
  onChange: () => void
}

/**
 * Picks what the time is booked for, a work order or an appointment, in one place: the recent work orders and the
 * recent appointments as chips (two separate lists), or a search over both (by number, customer or the vehicle's plate). The kind of what
 * was picked decides what is created. Converted appointments are not offered.
 */
export function ParentPicker({ selectedParent, locked = false, onSelect, onChange }: ParentPickerProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebouncedValue(inputValue, 300)
  const { data: recentOrders } = useRecentWorkOrdersQuery(CHIPS_PER_KIND)
  const { data: recentAppointments } = useRecentAppointmentsQuery(CHIPS_PER_KIND)
  const { data: orderResults, isFetching: isFetchingOrders } = useWorkOrdersSearchQuery(debouncedSearch)
  const { data: appointmentResults, isFetching: isFetchingAppointments } = useAppointmentsSearchQuery(debouncedSearch)
  const appointmentDetails = useAppointmentDetails()

  const isFetching = isFetchingOrders || isFetchingAppointments

  // Grouped by kind, so the work orders come first and the appointments after them.
  const options = useMemo<PickerOption[]>(
    () => [
      ...(orderResults ?? []).map((order) => ({ parent: orderParent(order), details: null })),
      ...(appointmentResults ?? []).map((appointment) => ({
        parent: appointmentParent(appointment),
        details: appointmentDetails(appointment),
      })),
    ],
    [orderResults, appointmentResults, appointmentDetails],
  )

  if (selectedParent) {
    return (
      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('slotForm.parentLabel')}
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
          <ParentBadge kind={selectedParent.kind} />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {parentNumberLabel(selectedParent)}
          </Typography>
          {!locked && (
            <Button variant="text" onClick={onChange} sx={{ px: '8px', py: '4px', minWidth: 'auto' }}>
              ({t('slotForm.change')})
            </Button>
          )}
        </Box>
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {t('slotForm.parentLabel')}
      </Typography>

      {(recentOrders?.length ?? 0) > 0 && (
        <Stack spacing={0.5}>
          <Typography variant="caption">{t('slotForm.recentOrders')}</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {(recentOrders ?? []).slice(0, CHIPS_PER_KIND).map((order) => (
              <Chip
                key={order.id}
                label={`#${order.orderNumber}`}
                variant="outlined"
                clickable
                onClick={() => onSelect(orderParent(order))}
                sx={{ ...kindSx('order'), maxWidth: 160 }}
              />
            ))}
          </Stack>
        </Stack>
      )}

      {(recentAppointments?.length ?? 0) > 0 && (
        <Stack spacing={0.5}>
          <Typography variant="caption">{t('slotForm.recentAppointments')}</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {(recentAppointments ?? []).slice(0, CHIPS_PER_KIND).map((appointment) => (
              <Chip
                key={appointment.id}
                icon={<CalendarMonthIcon />}
                label={`№${appointment.number}${appointment.customerName ? ` · ${appointment.customerName}` : ''}`}
                variant="outlined"
                clickable
                onClick={() => onSelect(appointmentParent(appointment))}
                sx={{ ...kindSx('appointment'), maxWidth: 220 }}
              />
            ))}
          </Stack>
        </Stack>
      )}

      <Autocomplete<PickerOption, false, false, false>
        options={options}
        loading={isFetching}
        inputValue={inputValue}
        onInputChange={(_event, newValue) => setInputValue(newValue)}
        onChange={(_event, newValue) => {
          if (newValue) {
            onSelect(newValue.parent)
          }
        }}
        groupBy={(option) => option.parent.kind}
        getOptionLabel={(option) => option.parent.number}
        getOptionKey={(option) => `${option.parent.kind}:${option.parent.id}`}
        isOptionEqualToValue={(option, value) =>
          option.parent.kind === value.parent.kind && option.parent.id === value.parent.id
        }
        filterOptions={(opts) => opts}
        noOptionsText={inputValue.trim().length === 0 ? t('slotForm.keepTyping') : t('slotForm.noResults')}
        renderGroup={(params) => (
          <li key={params.key}>
            <Typography
              variant="overline"
              sx={{ display: 'block', px: 2, pt: 1, color: 'text.secondary', bgcolor: 'background.paper' }}
            >
              {t(params.group === 'appointment' ? 'slotForm.groupAppointments' : 'slotForm.groupOrders')}
            </Typography>
            <Box component="ul" sx={{ p: 0 }}>
              {params.children}
            </Box>
          </li>
        )}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props

          return (
            <li key={key} {...optionProps}>
              <Stack sx={{ minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {parentNumberLabel(option.parent)}
                </Typography>
                {option.details && (
                  <Typography variant="caption" noWrap>
                    {option.details}
                  </Typography>
                )}
              </Stack>
            </li>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            fullWidth
            placeholder={t('slotForm.searchPlaceholder')}
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
