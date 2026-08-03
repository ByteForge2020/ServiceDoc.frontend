import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

interface SelectedEntityFieldProps {
  label: string
  displayText: string
  onChange: () => void
}

export function SelectedEntityField({ label, displayText, onChange }: SelectedEntityFieldProps) {
  const { t } = useTranslation()

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}
      </Typography>
      <Box
        sx={{
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          minHeight: '42px',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          pl: '14px',
          pr: '8px',
        }}
      >
        <Typography variant="body1" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayText}
        </Typography>
        <Button
          variant="text"
          onClick={onChange}
          sx={{ flexShrink: 0, px: '8px', py: '4px', minWidth: 'auto' }}
        >
          {t('common.change')}
        </Button>
      </Box>
    </Stack>
  )
}
