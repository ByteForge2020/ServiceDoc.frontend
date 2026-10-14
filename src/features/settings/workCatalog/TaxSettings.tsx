import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useShopSettingsQuery, useUpdateTaxSettingsMutation } from '../../../app/shop/queries'
import type { ShopSettings } from '../../../app/shop/shopApi'
import { useToasters } from '../../../app/toasters/useToasters'

const MIN_PERCENT = 1
const MAX_PERCENT = 99
const INPUT_WIDTH = 120

function percentToField(percent: number | null): string {
  return percent !== null ? String(percent) : ''
}

function parsePercent(value: string): number | null {
  const parsed = value === '' ? NaN : Number(value)
  return Number.isInteger(parsed) && parsed >= MIN_PERCENT && parsed <= MAX_PERCENT ? parsed : null
}

/** "Price includes tax" shop setting: a checkbox plus the rate (1-99). Applies to items added from now on. */
export function TaxSettings() {
  const { data } = useShopSettingsQuery()

  return data ? <TaxSettingsForm settings={data} /> : null
}

function TaxSettingsForm({ settings }: { settings: ShopSettings }) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const mutation = useUpdateTaxSettingsMutation()

  const [enabled, setEnabled] = useState(settings.priceIncludesTax)
  const [percent, setPercent] = useState(percentToField(settings.taxPercent))

  const parsed = parsePercent(percent)
  // The rate is only required while the setting is on; it is kept (when valid) while off so it can be re-enabled.
  const invalid = enabled && parsed === null
  const dirty = enabled !== settings.priceIncludesTax || parsed !== settings.taxPercent

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (invalid || !dirty || mutation.isPending) {
      return
    }

    mutation.mutate(
      { priceIncludesTax: enabled, taxPercent: parsed },
      {
        onSuccess: () => toasters.success(t('workCatalog.tax.saveSuccess')),
        onError: (error) => toasters.error(extractErrorMessage(error, t('workCatalog.tax.saveError'))),
      },
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={1}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <FormControlLabel
            control={<Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />}
            label={t('workCatalog.tax.priceIncludesTax')}
          />
          <TextField
            size="small"
            value={percent}
            onChange={(event) => setPercent(event.target.value.replace(/\D/g, '').slice(0, 2))}
            disabled={!enabled}
            error={invalid}
            sx={{ width: INPUT_WIDTH }}
            slotProps={{
              htmlInput: { 'aria-label': t('workCatalog.tax.rateAria'), inputMode: 'numeric' },
              input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
            }}
          />
          <Button type="submit" variant="outlined" disabled={invalid || !dirty} loading={mutation.isPending}>
            {t('workCatalog.save')}
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ color: invalid ? 'error.main' : 'text.secondary' }}>
          {invalid ? t('workCatalog.tax.rateRange', { min: MIN_PERCENT, max: MAX_PERCENT }) : t('workCatalog.tax.hint')}
        </Typography>
      </Stack>
    </Box>
  )
}
