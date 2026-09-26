import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActiveJob, JobOffer } from '../../types';

interface JobState {
  incomingJobs: JobOffer[];
  activeJob: ActiveJob | null;
  loading: boolean;
  error: string | null;
}

const initialState: JobState = {
  incomingJobs: [],
  activeJob: null,
  loading: false,
  error: null,
};

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addIncomingJob: (state, action: PayloadAction<JobOffer>) => {
      // Avoid duplicate offers
      if (!state.incomingJobs.find((j) => j.jobId === action.payload.jobId)) {
        state.incomingJobs.push(action.payload);
      }
    },
    removeIncomingJob: (state, action: PayloadAction<string>) => {
      state.incomingJobs = state.incomingJobs.filter((j) => j.jobId !== action.payload);
    },
    setActiveJob: (state, action: PayloadAction<ActiveJob | null>) => {
      state.activeJob = action.payload;
    },
    updateJobStatus: (
      state,
      action: PayloadAction<{
        status: ActiveJob['status'];
        timelineField: keyof ActiveJob['timeline'];
        timestamp: string;
      }>
    ) => {
      if (state.activeJob) {
        state.activeJob.status = action.payload.status;
        state.activeJob.timeline[action.payload.timelineField] = action.payload.timestamp;
      }
    },
    clearJobState: (state) => {
      state.incomingJobs = [];
      state.activeJob = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  addIncomingJob,
  removeIncomingJob,
  setActiveJob,
  updateJobStatus,
  clearJobState,
} = jobSlice.actions;
export default jobSlice.reducer;
