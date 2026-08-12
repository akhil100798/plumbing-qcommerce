import { describe, expect, it } from 'vitest';
import { isServiceCompletionPendingCustomerAction } from './serviceCompletionStatus';

describe('isServiceCompletionPendingCustomerAction', () => {
  it('recognizes the backend COMPLETED status as requiring the customer completion flow', () => {
    expect(isServiceCompletionPendingCustomerAction('COMPLETED')).toBe(true);
  });
});
