/** The service-completion flow is terminal; it must not remain in back-stack history. */
export function serviceCompletionHomeReset() {
  return {
    index: 0,
    routes: [{ name: 'Main' as const, params: { screen: 'HomeTab' } }],
  };
}
