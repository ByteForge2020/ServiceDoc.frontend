import { useEffect, useRef } from 'react'
import type { CalendarEntry, CalendarMode, CalendarRow } from './types'

/**
 * In `editEntry` mode: once the first real load is in (which is for the entry's own date), reports when the entry
 * can't be shown: it may have been deleted since the list was rendered, or sit on a row that is no longer listed
 * (a technician who is gone, a deleted service bay). Checked only once, so browsing to other dates is never reported.
 */
export function useFocusedEntryCheck(
  mode: CalendarMode,
  ready: boolean,
  entries: CalendarEntry[] | undefined,
  rows: CalendarRow[] | undefined,
  onMissing: (() => void) | undefined,
) {
  const checkedRef = useRef(false)
  const entryId = mode.kind === 'editEntry' ? mode.entryId : null

  useEffect(() => {
    if (!entryId || !ready || checkedRef.current) {
      return
    }

    checkedRef.current = true
    const entry = entries?.find((item) => item.id === entryId)
    if (!entry || !rows?.some((row) => row.id === entry.rowId)) {
      onMissing?.()
    }
  }, [entryId, ready, entries, rows, onMissing])
}
