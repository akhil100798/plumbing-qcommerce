import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlumberProfile } from '../../types';

interface DocumentInfo {
  name: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  expiryDate?: string;
}

interface ProfileState {
  plumberProfile: PlumberProfile | null;
  rating: number;
  documents: DocumentInfo[];
  availability: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  plumberProfile: null,
  rating: 0,
  documents: [
    { name: 'Aadhaar Card', status: 'VERIFIED' },
    { name: 'Plumbing License', status: 'VERIFIED', expiryDate: '2028-12-31' },
    { name: 'Bank Passbook / Cancelled Cheque', status: 'VERIFIED' },
  ],
  availability: false,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProfileError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setProfileSuccess: (state, action: PayloadAction<PlumberProfile>) => {
      state.plumberProfile = action.payload;
      state.rating = action.payload.rating;
      state.availability = action.payload.availability;
      state.loading = false;
      state.error = null;
    },
    toggleAvailabilitySuccess: (state, action: PayloadAction<boolean>) => {
      state.availability = action.payload;
      if (state.plumberProfile) {
        state.plumberProfile.availability = action.payload;
      }
    },
  },
});

export const { setProfileLoading, setProfileError, setProfileSuccess, toggleAvailabilitySuccess } =
  profileSlice.actions;
export default profileSlice.reducer;
