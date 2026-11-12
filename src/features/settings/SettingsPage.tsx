import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { AppointmentsTab } from './appointments/AppointmentsTab'
import { LocationTab } from './location/LocationTab'
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
        <Tab label={t('locationInfo.tabLabel')} value={1} />
        <Tab label={t('appointments.tabLabel')} value={2} />
        <Tab label={t('phases.tabLabel')} value={3} />
        <Tab label={t('workCatalog.tabLabel')} value={4} />
        <Tab label={t('workOrderSettings.tabLabel')} value={5} />
        <Tab label={t('serviceBays.tabLabel')} value={6} />
      </Tabs>

      {tab === 0 && <TeamMembersTab />}
      {tab === 1 && <LocationTab />}
      {tab === 2 && <AppointmentsTab />}
      {tab === 3 && <PhasesTab />}
      {tab === 4 && <WorkCatalogTab />}
      {tab === 5 && <WorkOrdersTab />}
      {tab === 6 && <ServiceBaysTab />}
    </Stack>
  )
}
