import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { AppointmentsTab } from './appointments/AppointmentsTab'
import { PhasesTab } from './phases/PhasesTab'
import { ServiceBaysTab } from './serviceBays/ServiceBaysTab'
import { TeamMembersTab } from './teamMembers/TeamMembersTab'
import { WorkOrdersTab } from './workOrders/WorkOrdersTab'
import { WorkCatalogTab } from './workCatalog/WorkCatalogTab'

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
        <Tab label={t('phases.tabLabel')} value={2} />
        <Tab label={t('workCatalog.tabLabel')} value={3} />
        <Tab label={t('workOrderSettings.tabLabel')} value={4} />
        <Tab label={t('serviceBays.tabLabel')} value={5} />
      </Tabs>

      {tab === 0 && <TeamMembersTab />}
      {tab === 1 && <AppointmentsTab />}
      {tab === 2 && <PhasesTab />}
      {tab === 3 && <WorkCatalogTab />}
      {tab === 4 && <WorkOrdersTab />}
      {tab === 5 && <ServiceBaysTab />}
    </Stack>
  )
}
