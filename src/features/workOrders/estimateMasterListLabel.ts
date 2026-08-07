import type { TFunction } from 'i18next'

const DEFAULT_PREFIX = 'default_'

export function isDefaultEstimateMasterListName(name: string): boolean {
  return name.startsWith(DEFAULT_PREFIX)
}

export function estimateMasterListLabel(name: string, t: TFunction): string {
  if (!isDefaultEstimateMasterListName(name)) {
    return name
  }

  const fallback = name.slice(DEFAULT_PREFIX.length).replace(/_/g, ' ')
  return t(`estimateMasterList.defaults.${name}`, { defaultValue: fallback })
}
