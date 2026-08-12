import { describe, expect, it } from 'vitest';
import { isAlreadySubmittedRatingError } from './serviceCompletionResult';

describe('isAlreadySubmittedRatingError', () => {
  it('treats an existing rating as a completed finish flow', () => {
    expect(isAlreadySubmittedRatingError(new Error('Rating has already been submitted for order #8'))).toBe(true);
  });
});
