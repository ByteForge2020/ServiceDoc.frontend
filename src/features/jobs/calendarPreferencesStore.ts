import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarTabKey, CalendarView } from './types'

interface CalendarPreferencesState {
  /** Day or week; shared by the technicians and the service bays calendars. */
  view: CalendarView
  tab: CalendarTabKey
  /** The technicians the week shows; empty means all of them. */
  technicianFilterIds: string[]
  /** The service bays the week shows; empty means all of them. */
  serviceBayFilterIds: string[]
  setView: (view: CalendarView) => void
  setTab: (tab: CalendarTabKey) => void
  setTechnicianFilterIds: (ids: string[]) => void
  setServiceBayFilterIds: (ids: string[]) => void
}

function toIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}

/**
 * What the occupancy calendar remembers between visits, kept in localStorage so that it survives a page reload.
 * The date is not here on purpose: the calendar always opens on today (or this week).
 */
export const useCalendarPreferencesStore = create<CalendarPreferencesState>()(
  persist(
    (set) => ({
      view: 'day',
      tab: 'technicians',
      technicianFilterIds: [],
      serviceBayFilterIds: [],
      setView: (view) => set({ view }),
      setTab: (tab) => set({ tab }),
      setTechnicianFilterIds: (technicianFilterIds) => set({ technicianFilterIds }),
      setServiceBayFilterIds: (serviceBayFilterIds) => set({ serviceBayFilterIds }),
    }),
    {
      name: 'servicedoc.occupancyCalendar',
      partialize: (state) => ({
        view: state.view,
        tab: state.tab,
        technicianFilterIds: state.technicianFilterIds,
        serviceBayFilterIds: state.serviceBayFilterIds,
      }),
      // Whatever was stored (an old format, a hand-edited value) falls back to the defaults.
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<CalendarPreferencesState>

        return {
          ...current,
          view: stored.view === 'week' ? 'week' : 'day',
          tab: stored.tab === 'serviceBays' ? 'serviceBays' : 'technicians',
          technicianFilterIds: toIds(stored.technicianFilterIds),
          serviceBayFilterIds: toIds(stored.serviceBayFilterIds),
        }
      },
    },
  ),
)
