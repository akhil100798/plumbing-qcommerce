import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MaterialItem } from '../../types';

interface MaterialState {
  requestedMaterials: MaterialItem[];
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DELIVERING' | 'DELIVERED' | null;
  deliveryTracking: {
    productOrderId?: number;
    riderName?: string;
    riderPhone?: string;
    riderRating?: number;
    eta?: string;
    statusTimeline?: {
      confirmed?: string;
      accepted?: string;
      packing?: string;
      delivering?: string;
      arrived?: string;
    };
  } | null;
  totalAmount: number;
  loading: boolean;
  error: string | null;
}

const initialState: MaterialState = {
  requestedMaterials: [],
  approvalStatus: null,
  deliveryTracking: null,
  totalAmount: 0,
  loading: false,
  error: null,
};

const materialSlice = createSlice({
  name: 'material',
  initialState,
  reducers: {
    setMaterialLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setMaterialError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    startMaterialRequest: (state) => {
      state.requestedMaterials = [];
      state.approvalStatus = null;
      state.deliveryTracking = null;
      state.totalAmount = 0;
      state.error = null;
    },
    submitMaterialRequestSuccess: (
      state,
      action: PayloadAction<{ items: MaterialItem[]; totalAmount: number; orderId: number }>
    ) => {
      state.requestedMaterials = action.payload.items;
      state.totalAmount = action.payload.totalAmount;
      state.approvalStatus = 'PENDING_APPROVAL';
      state.deliveryTracking = {
        productOrderId: action.payload.orderId,
      };
      state.loading = false;
    },
    updateApprovalStatus: (
      state,
      action: PayloadAction<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DELIVERING' | 'DELIVERED'>
    ) => {
      state.approvalStatus = action.payload;
    },
    setDeliveryTracking: (
      state,
      action: PayloadAction<NonNullable<MaterialState['deliveryTracking']>>
    ) => {
      state.deliveryTracking = {
        ...state.deliveryTracking,
        ...action.payload,
      };
    },
    clearMaterialState: (state) => {
      state.requestedMaterials = [];
      state.approvalStatus = null;
      state.deliveryTracking = null;
      state.totalAmount = 0;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setMaterialLoading,
  setMaterialError,
  startMaterialRequest,
  submitMaterialRequestSuccess,
  updateApprovalStatus,
  setDeliveryTracking,
  clearMaterialState,
} = materialSlice.actions;
export default materialSlice.reducer;
