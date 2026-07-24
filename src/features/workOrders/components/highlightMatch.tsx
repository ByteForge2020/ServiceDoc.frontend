import type { ReactNode } from 'react'

export function highlightMatch(text: string, query: string): ReactNode {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return text
  }

  const index = text.toLowerCase().indexOf(trimmedQuery.toLowerCase())
  if (index === -1) {
    return text
  }

  const before = text.slice(0, index)
  const match = text.slice(index, index + trimmedQuery.length)
  const after = text.slice(index + trimmedQuery.length)

  return (
    <>
      {before}
      <strong>{match}</strong>
      {after}
    </>
  )
}
