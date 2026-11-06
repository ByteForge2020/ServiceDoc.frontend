export interface LayoutItem {
  id: string
  startMinutes: number
  endMinutes: number
}

export interface ColumnPlacement {
  /** Zero-based column the item sits in. */
  column: number
  /** How many columns the group of overlapping items is split into. */
  columnCount: number
}

/**
 * Splits the width of a day between appointments that overlap in time, the way calendars do: items that don't overlap
 * keep the full width; a group of overlapping items (a chain of items each overlapping the next) is divided into as many
 * side-by-side columns as its busiest moment needs, and every item of the group gets that same column count.
 */
export function layoutOverlappingItems(items: LayoutItem[]): Map<string, ColumnPlacement> {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes)
  const placements = new Map<string, ColumnPlacement>()

  let group: { id: string; column: number }[] = []
  let groupEnd = -Infinity
  // For each column of the current group: when its last item ends.
  let columnEnds: number[] = []

  function closeGroup() {
    for (const member of group) {
      placements.set(member.id, { column: member.column, columnCount: columnEnds.length })
    }
    group = []
    columnEnds = []
    groupEnd = -Infinity
  }

  for (const item of sorted) {
    if (item.startMinutes >= groupEnd) {
      closeGroup()
    }

    const freeColumn = columnEnds.findIndex((end) => end <= item.startMinutes)
    const column = freeColumn === -1 ? columnEnds.length : freeColumn
    columnEnds[column] = item.endMinutes

    group.push({ id: item.id, column })
    groupEnd = Math.max(groupEnd, item.endMinutes)
  }

  closeGroup()

  return placements
}
