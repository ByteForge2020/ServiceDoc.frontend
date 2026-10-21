import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DateTime } from 'luxon'

export interface JobsUiState {
  selectedDate: string
}

const initialState: JobsUiState = {
  selectedDate: DateTime.local().toISODate(),
}

const jobsUiSlice = createSlice({
  name: 'jobsUi',
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload
    },
    shiftSelectedDate(state, action: PayloadAction<number>) {
      state.selectedDate = DateTime.fromISO(state.selectedDate, { zone: 'utc' }).plus({ days: action.payload }).toISODate()!
    },
  },
})

export const { setSelectedDate, shiftSelectedDate } = jobsUiSlice.actions
export default jobsUiSlice.reducer
