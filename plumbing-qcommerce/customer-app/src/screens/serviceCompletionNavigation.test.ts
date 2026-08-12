import { describe, expect, it } from 'vitest';
import { serviceCompletionHomeReset } from './serviceCompletionNavigation';

describe('serviceCompletionHomeReset', () => {
  it('resets the stack to the customer Home tab after rating submission', () => {
    expect(serviceCompletionHomeReset()).toEqual({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'HomeTab' } }],
    });
  });
});
