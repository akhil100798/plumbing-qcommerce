import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AddressItem {
  id: number;
  label: string;
  name: string;
  addressLine: string;
  phone: string;
}

interface AddressState {
  addresses: AddressItem[];
  selectedId: number;
}

const initialState: AddressState = {
  addresses: [
    {
      id: 1,
      label: 'Home',
      name: 'Akhil Kumar',
      addressLine: 'Flat 402, Block A, Green Meadows Apartments, Madhapur, Hyderabad, 500081',
      phone: '+91 98765 43210',
    },
    {
      id: 2,
      label: 'Office',
      name: 'Akhil Kumar (PlumbCommerce)',
      addressLine: 'CoWork Zone, 3rd Floor, Image Gardens Lane, Madhapur, Hyderabad, 500081',
      phone: '+91 98765 43210',
    },
  ],
  selectedId: 1,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddresses: (state, action: PayloadAction<AddressItem[]>) => {
      state.addresses = action.payload;
      if (state.addresses.length > 0 && !state.addresses.some((a) => a.id === state.selectedId)) {
        state.selectedId = state.addresses[0].id;
      }
    },
    addAddress: (state, action: PayloadAction<AddressItem>) => {
      state.addresses.push(action.payload);
      state.selectedId = action.payload.id;
    },
    deleteAddress: (state, action: PayloadAction<number>) => {
      state.addresses = state.addresses.filter((a) => a.id !== action.payload);
      if (state.selectedId === action.payload && state.addresses.length > 0) {
        state.selectedId = state.addresses[0].id;
      }
    },
    setSelectedAddress: (state, action: PayloadAction<number>) => {
      state.selectedId = action.payload;
    },
  },
});

export const { setAddresses, addAddress, deleteAddress, setSelectedAddress } = addressSlice.actions;
export default addressSlice.reducer;
