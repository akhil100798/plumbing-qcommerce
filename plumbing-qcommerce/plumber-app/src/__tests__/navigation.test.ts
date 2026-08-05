import { describe, it, expect } from 'vitest';
import { AppStackParamList, MainTabParamList } from '../types/navigation';

describe('Plumber App Navigation Contract', () => {
  it('defines valid MainTabParamList screens', () => {
    const tabs: Array<keyof MainTabParamList> = [
      'HomeTab',
      'JobsTab',
      'MaterialsTab',
      'EarningsTab',
      'ProfileTab',
    ];
    expect(tabs).toHaveLength(5);
    expect(tabs).toContain('MaterialsTab');
  });

  it('defines StoreSelection and MaterialTracking routes in AppStackParamList', () => {
    const storeSelectionRoute: keyof AppStackParamList = 'StoreSelection';
    const trackingRoute: keyof AppStackParamList = 'MaterialTracking';
    expect(storeSelectionRoute).toBe('StoreSelection');
    expect(trackingRoute).toBe('MaterialTracking');
  });

  it('ensures all authenticated sub-screens remain within AppStackParamList', () => {
    const routes: Array<keyof AppStackParamList> = [
      'Auth',
      'Main',
      'Home',
      'ActiveJob',
      'JobDetails',
      'StoreSelection',
      'MaterialRequest',
      'MaterialTracking',
      'Earnings',
      'Profile',
    ];
    expect(routes).toContain('StoreSelection');
    expect(routes).toContain('MaterialTracking');
  });
});
