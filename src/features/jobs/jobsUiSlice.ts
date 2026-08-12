import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DateTime } from 'luxon'

export interface JobsUiState {
  selectedDate: string
}

const initialState: JobsUiState = {
  selectedDate: DateTime.utc().toISODate(),
}

const jobsUiSlice = createSlice({
  name: 'jobsUi',
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload
    },
  },
})

export const { setSelectedDate } = jobsUiSlice.actions
export default jobsUiSlice.reducer
