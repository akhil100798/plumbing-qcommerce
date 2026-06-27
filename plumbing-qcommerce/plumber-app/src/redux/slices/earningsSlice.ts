import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EarningsState {
  todayEarnings: number;
  weeklyEarnings: number;
  serviceCommission: number;
  materialCommission: number;
  tips: number;
  jobsCompleted: number;
  loading: boolean;
  error: string | null;
}

const initialState: EarningsState = {
  todayEarnings: 0,
  weeklyEarnings: 0,
  serviceCommission: 0,
  materialCommission: 0,
  tips: 0,
  jobsCompleted: 0,
  loading: false,
  error: null,
};

const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    setEarningsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setEarningsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setEarningsData: (
      state,
      action: PayloadAction<{
        todayEarnings: number;
        weeklyEarnings: number;
        serviceCommission: number;
        materialCommission: number;
        tips: number;
        jobsCompleted: number;
      }>
    ) => {
      state.todayEarnings = action.payload.todayEarnings;
      state.weeklyEarnings = action.payload.weeklyEarnings;
      state.serviceCommission = action.payload.serviceCommission;
      state.materialCommission = action.payload.materialCommission;
      state.tips = action.payload.tips;
      state.jobsCompleted = action.payload.jobsCompleted;
      state.loading = false;
      state.error = null;
    },
    addCompletedJobEarnings: (
      state,
      action: PayloadAction<{ service: number; material: number; tip: number }>
    ) => {
      const total = action.payload.service + action.payload.material + action.payload.tip;
      state.todayEarnings += total;
      state.weeklyEarnings += total;
      state.serviceCommission += action.payload.service;
      state.materialCommission += action.payload.material;
      state.tips += action.payload.tip;
      state.jobsCompleted += 1;
    },
  },
});

export const { setEarningsLoading, setEarningsError, setEarningsData, addCompletedJobEarnings } =
  earningsSlice.actions;
export default earningsSlice.reducer;
