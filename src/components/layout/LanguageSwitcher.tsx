import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <ButtonGroup size="small" aria-label="Language">
      {LANGUAGES.map((language) => (
        <Button
          key={language.code}
          variant={i18n.resolvedLanguage === language.code ? 'contained' : 'outlined'}
          onClick={() => i18n.changeLanguage(language.code)}
        >
          {language.label}
        </Button>
      ))}
    </ButtonGroup>
  )
}
