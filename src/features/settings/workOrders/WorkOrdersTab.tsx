import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useShopSettingsQuery, useUpdateWorkOrderSettingsMutation } from '../../../app/shop/queries'
import type { DiscountType, ShopSettings } from '../../../app/shop/shopApi'
import { useToasters } from '../../../app/toasters/useToasters'

export function WorkOrdersTab() {
  const { data } = useShopSettingsQuery()

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return <WorkOrderSettingsForm settings={data} />
}

function WorkOrderSettingsForm({ settings }: { settings: ShopSettings }) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const mutation = useUpdateWorkOrderSettingsMutation()

  const [discountType, setDiscountType] = useState<DiscountType>(settings.discountType)
  const dirty = discountType !== settings.discountType

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!dirty || mutation.isPending) {
      return
    }

    mutation.mutate(
      { discountType },
      {
        onSuccess: () => toasters.success(t('workOrderSettings.saveSuccess')),
        onError: (error) => toasters.error(extractErrorMessage(error, t('workOrderSettings.saveError'))),
      },
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={2}>
            <Typography variant="h3" component="h2">
              {t('workOrderSettings.discountTypeTitle')}
            </Typography>
            <RadioGroup
              aria-label={t('workOrderSettings.discountTypeTitle')}
              value={discountType}
              onChange={(event) => setDiscountType(event.target.value as DiscountType)}
            >
              <FormControlLabel value="Percent" control={<Radio />} label={t('workOrderSettings.discountTypePercent')} />
              <FormControlLabel value="Fixed" control={<Radio />} label={t('workOrderSettings.discountTypeFixed')} />
            </RadioGroup>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('workOrderSettings.discountTypeHint')}
            </Typography>
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={!dirty} loading={mutation.isPending}>
            {t('workOrderSettings.save')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
