/** Returns the next work step after the store has confirmed collection. */
export function materialResumeRoute(jobId: string) {
  return { name: 'AfterPhotos' as const, params: { jobId } };
}
