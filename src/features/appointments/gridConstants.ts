export const SLOT_HEIGHT_PX = 48
export const TIME_COLUMN_WIDTH = 64
export const HEADER_HEIGHT = 56
export const DAY_COLUMN_MIN_WIDTH = 150
export const MIN_CARD_HEIGHT = 32

// Right edge of every day column that cards never cover, so an empty part of an occupied slot can still be clicked
// to book another appointment there.
export const SLOT_GUTTER_WIDTH = 24
// Space between a card and the column's left edge (and between neighbouring cards).
export const CARD_GAP = 4

// Monday-first column order, using .NET's DayOfWeek numeric values (Sunday = 0).
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
