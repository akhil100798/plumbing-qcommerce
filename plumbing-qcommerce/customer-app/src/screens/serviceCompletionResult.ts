/** The backend rejects duplicate ratings, but the customer completion flow is already complete. */
export function isAlreadySubmittedRatingError(error: unknown) {
  return error instanceof Error && /rating has already been submitted/i.test(error.message);
}
