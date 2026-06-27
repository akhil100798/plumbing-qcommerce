import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Store } from '../../types';

interface ProfileState {
  storeProfile: Store | null;
  bankDetails: any;
  documents: any;
  timings: any;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  storeProfile: null,
  bankDetails: null,
  documents: null,
  timings: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess: (
      state,
      action: PayloadAction<{ storeProfile: Store; bankDetails: any; documents: any; timings: any }>
    ) => {
      state.loading = false;
      state.storeProfile = action.payload.storeProfile;
      state.bankDetails = action.payload.bankDetails;
      state.documents = action.payload.documents;
      state.timings = action.payload.timings;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfileInSlice: (state, action: PayloadAction<Store>) => {
      state.storeProfile = action.payload;
    },
  },
});

export const { fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, updateProfileInSlice } = profileSlice.actions;
export default profileSlice.reducer;
