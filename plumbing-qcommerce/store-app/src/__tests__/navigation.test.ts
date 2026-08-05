import { describe, it, expect } from 'vitest';
import { AppStackParamList, MainTabParamList } from '../types/navigation';

describe('Store App Navigation Contract', () => {
  it('defines valid MainTabParamList screens', () => {
    const tabs: Array<keyof MainTabParamList> = [
      'HomeTab',
      'OrdersTab',
      'InventoryTab',
      'MaterialsTab',
      'AccountTab',
    ];
    expect(tabs).toHaveLength(5);
    expect(tabs).toContain('MaterialsTab');
    expect(tabs).not.toContain('DispatchTab' as any);
  });

  it('defines MaterialRequestDetail route in AppStackParamList', () => {
    const routeName: keyof AppStackParamList = 'MaterialRequestDetail';
    expect(routeName).toBe('MaterialRequestDetail');
  });

  it('ensures all authenticated sub-screens are part of AppStackParamList', () => {
    const routes: Array<keyof AppStackParamList> = [
      'Auth',
      'Main',
      'Dashboard',
      'SalesAnalytics',
      'Wallet',
      'LowStockAlert',
      'Orders',
      'OrderDetails',
      'Packing',
      'ReadyForPickup',
      'Inventory',
      'ProductDetails',
      'AddProduct',
      'MaterialRequests',
      'MaterialRequestDetail',
      'StoreProfile',
      'Account',
    ];
    expect(routes).toContain('MaterialRequestDetail');
    expect(routes).toContain('ReadyForPickup');
  });
});
