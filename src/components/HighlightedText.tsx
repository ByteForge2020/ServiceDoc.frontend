import Box from '@mui/material/Box'

interface HighlightedTextProps {
  text: string
  /** Case-insensitive, matched literally. Nothing is highlighted when empty. */
  query: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Renders `text` with every occurrence of `query` highlighted. */
export function HighlightedText({ text, query }: HighlightedTextProps) {
  const needle = query.trim()

  if (!needle) {
    return <>{text}</>
  }

  // A capturing group makes split() keep the matches, at the odd indexes.
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Box key={index} component="mark" sx={{ bgcolor: 'warning.light', color: 'text.primary' }}>
            {part}
          </Box>
        ) : (
          part
        ),
      )}
    </>
  )
}
