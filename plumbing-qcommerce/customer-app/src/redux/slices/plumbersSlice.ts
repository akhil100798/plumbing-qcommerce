import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActiveJob {
  plumberId?: string;
  message?: string;
}

interface PlumbersState {
  activeJob: ActiveJob | null;
  isSearching: boolean;
  selectedMode: 'quick' | 'store' | 'expert';
  selectedCategory: string | null;
}

const initialState: PlumbersState = {
  activeJob: null,
  isSearching: false,
  selectedMode: 'quick',
  selectedCategory: null,
};

const plumbersSlice = createSlice({
  name: 'plumbers',
  initialState,
  reducers: {
    startSearching: (state) => {
      state.isSearching = true;
      state.activeJob = null;
    },
    stopSearching: (state) => {
      state.isSearching = false;
    },
    setActiveJob: (state, action: PayloadAction<ActiveJob | null>) => {
      state.activeJob = action.payload;
      state.isSearching = false;
    },
    setBookingConfig: (
      state,
      action: PayloadAction<{ mode: 'quick' | 'store' | 'expert'; category: string | null }>
    ) => {
      state.selectedMode = action.payload.mode;
      state.selectedCategory = action.payload.category;
    },
  },
});

export const { startSearching, stopSearching, setActiveJob, setBookingConfig } =
  plumbersSlice.actions;
export default plumbersSlice.reducer;
