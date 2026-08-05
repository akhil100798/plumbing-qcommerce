import { describe, it, expect } from 'vitest';
import { AppStackParamList, MainTabParamList } from '../types/navigation';

describe('Plumber App Navigation Contract', () => {
  it('defines valid MainTabParamList screens', () => {
    const tabs = [
      'Home',
      'Jobs',
      'Earnings',
      'Materials',
      'Profile',
    ] satisfies Array<keyof MainTabParamList>;

    expect(tabs).toHaveLength(5);
    expect(tabs).toContain('Materials');
  });

  it('defines StoreSelection and MaterialTracking routes in AppStackParamList', () => {
    const storeSelectionRoute: keyof AppStackParamList = 'StoreSelection';
    const trackingRoute: keyof AppStackParamList = 'MaterialTracking';
    expect(storeSelectionRoute).toBe('StoreSelection');
    expect(trackingRoute).toBe('MaterialTracking');
  });

  it('ensures all authenticated sub-screens remain within AppStackParamList', () => {
    const routes = [
      'Auth',
      'Main',
      'ActiveJob',
      'StoreSelection',
      'MaterialRequest',
      'MaterialTracking',
      'Earnings',
      'Profile',
    ] satisfies Array<keyof AppStackParamList>;

    expect(routes).toContain('StoreSelection');
    expect(routes).toContain('MaterialTracking');
  });
});
