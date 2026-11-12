import { Fragment, useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { DaySchedule } from '../../../api/appointmentSettingsApi'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { AppTimeField } from '../../../components/form/AppTimeField'
import { FormTextField } from '../../../components/form/FormTextField'
import { DAY_LABEL_KEYS, WEEKDAY_ORDER } from '../../appointments/gridConstants'
import { useAppointmentSettingsQuery, useUpdateWorkScheduleMutation } from '../appointments/queries'
import { useLocationInfoQuery, useUpdateLocationInfoMutation } from './queries'

// Match the limits the server keeps them to.
const MAX_ADDRESS_LENGTH = 500
const MAX_PHONE_LENGTH = 50
const MAX_LEGAL_NAME_LENGTH = 300
const MAX_TAX_ID_LENGTH = 30

interface DetailsForm {
  address: string
  phone: string
  legalName: string
  taxId: string
}

function isInvalidDay(day: DaySchedule): boolean {
  return day.isEnabled && day.openingTimeMinutes >= day.closingTimeMinutes
}

/** The shop's own details and its working hours, which every calendar is drawn from. */
export function LocationTab() {
  const { t } = useTranslation()
  const toasters = useToasters()
  const { data: location, isPending: isLocationPending } = useLocationInfoQuery()
  const { data: settings, isPending: isSettingsPending } = useAppointmentSettingsQuery()
  const locationMutation = useUpdateLocationInfoMutation()
  const scheduleMutation = useUpdateWorkScheduleMutation()

  const [details, setDetails] = useState<DetailsForm | null>(null)
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null)

  // Adopt what was loaded once, then the form owns the values.
  if (location && !details) {
    setDetails({
      address: location.address ?? '',
      phone: location.phone ?? '',
      legalName: location.legalName ?? '',
      taxId: location.taxId ?? '',
    })
  }
  if (settings && !schedule) {
    setSchedule(settings.schedule)
  }

  const saving = locationMutation.isPending || scheduleMutation.isPending

  function updateDetails(patch: Partial<DetailsForm>) {
    setDetails((previous) => (previous ? { ...previous, ...patch } : previous))
  }

  function updateDay(dayOfWeek: number, patch: Partial<DaySchedule>) {
    setSchedule((previous) =>
      previous ? previous.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)) : previous,
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!details || !schedule || saving || schedule.some(isInvalidDay)) {
      return
    }

    try {
      await Promise.all([
        locationMutation.mutateAsync({
          address: details.address,
          phone: details.phone,
          legalName: details.legalName,
          taxId: details.taxId,
        }),
        scheduleMutation.mutateAsync(schedule),
      ])
      toasters.success(t('locationInfo.saveSuccess'))
    } catch (error) {
      toasters.error(extractErrorMessage(error, t('locationInfo.saveError')))
    }
  }

  if (isLocationPending || isSettingsPending || !details || !schedule) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const hasInvalidDay = schedule.some(isInvalidDay)

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={3}>
            <Typography variant="h3" component="h2">
              {t('locationInfo.detailsTitle')}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box sx={{ gridColumn: { md: '1 / -1' }, display: 'flex' }}>
                <FormTextField
                  label={t('locationInfo.address')}
                  placeholder={t('locationInfo.addressPlaceholder')}
                  value={details.address}
                  onChange={(event) => updateDetails({ address: event.target.value })}
                  slotProps={{ htmlInput: { maxLength: MAX_ADDRESS_LENGTH } }}
                />
              </Box>
              <FormTextField
                label={t('locationInfo.phone')}
                placeholder={t('locationInfo.phonePlaceholder')}
                value={details.phone}
                onChange={(event) => updateDetails({ phone: event.target.value })}
                slotProps={{ htmlInput: { maxLength: MAX_PHONE_LENGTH, inputMode: 'tel' } }}
              />
              <Box />
              <FormTextField
                label={t('locationInfo.legalName')}
                placeholder={t('locationInfo.legalNamePlaceholder')}
                value={details.legalName}
                onChange={(event) => updateDetails({ legalName: event.target.value })}
                slotProps={{ htmlInput: { maxLength: MAX_LEGAL_NAME_LENGTH } }}
              />
              <FormTextField
                label={t('locationInfo.taxId')}
                placeholder={t('locationInfo.taxIdPlaceholder')}
                value={details.taxId}
                onChange={(event) => updateDetails({ taxId: event.target.value })}
                slotProps={{ htmlInput: { maxLength: MAX_TAX_ID_LENGTH } }}
              />
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h3" component="h2">
                {t('locationInfo.scheduleTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('locationInfo.scheduleHint')}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 1fr',
                columnGap: 3,
                rowGap: 2,
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('locationInfo.weekdaysLabel')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('locationInfo.openingTimeLabel')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('locationInfo.closingTimeLabel')}
              </Typography>

              {WEEKDAY_ORDER.map((dayOfWeek) => {
                const day = schedule.find((d) => d.dayOfWeek === dayOfWeek)
                if (!day) {
                  return null
                }

                return (
                  <Fragment key={dayOfWeek}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Switch
                        checked={day.isEnabled}
                        onChange={(event) => updateDay(dayOfWeek, { isEnabled: event.target.checked })}
                      />
                      <Typography variant="body1" sx={{ color: day.isEnabled ? 'text.primary' : 'text.secondary' }}>
                        {t(DAY_LABEL_KEYS[dayOfWeek])}
                      </Typography>
                    </Stack>
                    <AppTimeField
                      value={day.openingTimeMinutes}
                      onChange={(minutes) => updateDay(dayOfWeek, { openingTimeMinutes: minutes })}
                      disabled={!day.isEnabled}
                    />
                    <AppTimeField
                      value={day.closingTimeMinutes}
                      onChange={(minutes) => updateDay(dayOfWeek, { closingTimeMinutes: minutes })}
                      disabled={!day.isEnabled}
                    />
                  </Fragment>
                )
              })}
            </Box>

            {hasInvalidDay && (
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                {t('locationInfo.invalidRange')}
              </Typography>
            )}
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={saving} disabled={hasInvalidDay}>
            {t('locationInfo.saveLabel')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
