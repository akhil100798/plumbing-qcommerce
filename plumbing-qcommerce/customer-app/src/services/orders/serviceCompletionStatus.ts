/** True while the customer must review a plumber-completed service. */
export function isServiceCompletionPendingCustomerAction(status?: string) {
  return status === 'COMPLETED' || status === 'WORK_COMPLETED';
}
