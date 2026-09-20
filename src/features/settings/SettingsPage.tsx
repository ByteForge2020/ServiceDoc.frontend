import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { AppointmentsTab } from './appointments/AppointmentsTab'
import { TeamMembersTab } from './teamMembers/TeamMembersTab'

export function SettingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  return (
    <Stack spacing={3}>
      <Typography variant="h2" component="h1">
        {t('nav.settings')}
      </Typography>

      <Tabs value={tab} onChange={(_event, newValue: number) => setTab(newValue)}>
        <Tab label={t('teamMembers.tabLabel')} value={0} />
        <Tab label={t('appointments.tabLabel')} value={1} />
      </Tabs>

      {tab === 0 && <TeamMembersTab />}
      {tab === 1 && <AppointmentsTab />}
    </Stack>
  )
}
