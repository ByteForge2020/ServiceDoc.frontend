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
import { useAppointmentsSearchQuery, useUpcomingAppointmentsQuery } from '../../appointments/queries'
import { useAppointmentDetails } from '../useAppointmentDetails'
import type { AppointmentSummary } from '../../appointments/types'

/** What the picker needs to know about the chosen appointment; the rest is looked up when it is needed. */
export type AppointmentRef = Pick<AppointmentSummary, 'id' | 'number'>

interface AppointmentPickerProps {
  selectedAppointment: AppointmentRef | null
  /** Hides the "change appointment" link: the selected appointment is fixed. */
  locked?: boolean
  onSelect: (appointment: AppointmentSummary) => void
  onChangeAppointment: () => void
}

/**
 * Picks the appointment to book time for: the nearest upcoming ones as chips, or a search by number, customer or the
 * vehicle's plate. Converted appointments are not offered: their slots have become the work order's.
 */
export function AppointmentPicker({
  selectedAppointment,
  locked = false,
  onSelect,
  onChangeAppointment,
}: AppointmentPickerProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebouncedValue(inputValue, 300)
  const { data: upcomingAppointments } = useUpcomingAppointmentsQuery(6)
  const { data: searchResults, isFetching } = useAppointmentsSearchQuery(debouncedSearch)
  const details = useAppointmentDetails()

  const options = useMemo(() => searchResults ?? [], [searchResults])

  if (selectedAppointment) {
    return (
      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {t('appointmentSlots.picker.selectAppointment')}
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
            {t('appointmentSlots.picker.appointmentLabel', { number: selectedAppointment.number })}
          </Typography>
          {!locked && (
            <Button variant="text" onClick={onChangeAppointment} sx={{ px: '8px', py: '4px', minWidth: 'auto' }}>
              ({t('appointmentSlots.picker.changeAppointment')})
            </Button>
          )}
        </Box>
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {t('appointmentSlots.picker.selectAppointment')}
      </Typography>

      {upcomingAppointments && upcomingAppointments.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {upcomingAppointments.map((appointment) => (
            <Chip
              key={appointment.id}
              label={`#${appointment.number}${appointment.customerName ? ` · ${appointment.customerName}` : ''}`}
              variant="outlined"
              clickable
              onClick={() => onSelect(appointment)}
              sx={{ maxWidth: 220 }}
            />
          ))}
        </Stack>
      )}

      <Autocomplete<AppointmentSummary, false, false, false>
        options={options}
        loading={isFetching}
        inputValue={inputValue}
        onInputChange={(_event, newValue) => setInputValue(newValue)}
        onChange={(_event, newValue) => {
          if (newValue) {
            onSelect(newValue)
          }
        }}
        getOptionLabel={(option) => option.number}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        filterOptions={(opts) => opts}
        noOptionsText={
          inputValue.trim().length === 0
            ? t('appointmentSlots.picker.keepTyping')
            : t('appointmentSlots.picker.noResults')
        }
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                #{option.number}
              </Typography>
              <Typography variant="caption" noWrap>
                {details(option)}
              </Typography>
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            fullWidth
            placeholder={t('appointmentSlots.picker.searchPlaceholder')}
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
