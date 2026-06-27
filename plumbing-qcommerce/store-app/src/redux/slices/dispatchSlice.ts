import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Rider, Order } from '../../types';

interface DispatchState {
  riders: Rider[];
  assignedRider: Rider | null;
  readyForPickupOrders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: DispatchState = {
  riders: [],
  assignedRider: null,
  readyForPickupOrders: [],
  loading: false,
  error: null,
};

const dispatchSlice = createSlice({
  name: 'dispatch',
  initialState,
  reducers: {
    fetchRidersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRidersSuccess: (
      state,
      action: PayloadAction<{ riders: Rider[]; readyForPickupOrders: Order[] }>
    ) => {
      state.loading = false;
      state.riders = action.payload.riders;
      state.readyForPickupOrders = action.payload.readyForPickupOrders;
    },
    fetchRidersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setAssignedRider: (state, action: PayloadAction<Rider | null>) => {
      state.assignedRider = action.payload;
    },
  },
});

export const { fetchRidersStart, fetchRidersSuccess, fetchRidersFailure, setAssignedRider } = dispatchSlice.actions;
export default dispatchSlice.reducer;
