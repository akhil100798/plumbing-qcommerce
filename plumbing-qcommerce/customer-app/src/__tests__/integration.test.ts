import { mapBackendStatusToUI, mapBackendOrderToUI } from '../services/orderMappers';
import { ServiceOrder, OrderStatus } from '../types/backend';
import { API_BASE_URL, BACKEND_URL } from '../services/api/apiClient';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

export function runCustomerUnitTests() {
  console.log('--- Running FixKart Customer App Unit & Contract Tests ---');

  // Test 1: API Base URL and Endpoint structure
  assert(
    BACKEND_URL === 'https://fixkart-dev2-backend.onrender.com' || BACKEND_URL.startsWith('http'),
    'BACKEND_URL must be valid'
  );
  assert(
    API_BASE_URL.endsWith('/api/v1'),
    'API_BASE_URL must target /api/v1'
  );
  console.log('✓ API Base URL configuration valid');

  // Test 2: Backend OrderStatus to UI mapping
  const statuses: OrderStatus[] = [
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMBINED_ORDER',
    'MATERIALS_REQUIRED',
    'WAITING_FOR_STORE',
    'READY_FOR_PRODUCT_PICKUP',
    'PLUMBER_COLLECTING_PRODUCTS',
    'PRODUCTS_COLLECTED',
    'RETURNING_TO_CUSTOMER',
    'WORK_RESUMED',
    'CUSTOMER_CONFIRMED',
    'COMPLETED',
    'PAID',
    'CANCELLED',
  ];

  statuses.forEach((status) => {
    const { uiStatus, label } = mapBackendStatusToUI(status);
    assert(!!uiStatus, `uiStatus must exist for ${status}`);
    assert(!!label && label.length > 0, `label must be non-empty for ${status}`);
  });
  console.log('✓ All 15 Backend OrderStatus enums correctly mapped to UI labels');

  // Test 3: ServiceOrder to UI Order transformation
  const mockBackendOrder: ServiceOrder = {
    id: 42,
    description: 'Tap & Faucet Repair | Address: HSR Layout',
    latitude: 12.9141,
    longitude: 77.6411,
    status: 'IN_PROGRESS',
    requestType: 'NEARBY_AUTO',
    plumber: {
      id: 7,
      fullName: 'Ramesh Sharma',
      rating: 4.9,
      phone: '+91 98765 43210',
    },
    createdAt: '2026-08-16T10:00:00Z',
    startedAt: '2026-08-16T10:30:00Z',
  };

  const uiOrder = mapBackendOrderToUI(mockBackendOrder);
  assert(uiOrder.id === '42', 'UI order ID matches backend');
  assert(uiOrder.orderNumber === 'FK-000042', 'Order number formatted correctly');
  assert(uiOrder.status === 'in_progress', 'Status mapped to in_progress');
  assert(uiOrder.plumber?.name === 'Ramesh Sharma', 'Plumber name mapped');
  assert(uiOrder.timeline.length === 5, 'Timeline has 5 standard steps');
  console.log('✓ ServiceOrder to UI Order transformation verified');

  console.log('--- ALL CUSTOMER APP TESTS PASSED ---');
}

// Execute directly if run with node
if (typeof require !== 'undefined' && require.main === module) {
  runCustomerUnitTests();
}
