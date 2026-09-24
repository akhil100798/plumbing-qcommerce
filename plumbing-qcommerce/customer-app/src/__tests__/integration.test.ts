import { mapBackendStatusToUI, mapBackendOrderToUI } from '../services/orderMappers';
import { ServiceOrder, OrderStatus } from '../types/backend';
import { API_BASE_URL, BACKEND_URL } from '../services/api/apiClient';
import { boundCartQuantity, parsePersistedCart, CART_STORAGE_VERSION } from '../services/cartPersistence';
import { isValidIndianPostalCode, normalizePostalCode } from '../services/addressValidation';
import { buildProductCheckoutRequest, isStoreCompatibleWithCart, productCheckoutSubtotal } from '../services/checkoutService';
import { CartItem } from '../services/cartService';
import { extractLocalQaCode } from '../services/qaOtp';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

export function runCustomerUnitTests() {
  console.log('--- Running FixKart Customer App Unit & Contract Tests ---');

  // Test 1: API Base URL and Endpoint structure
  assert(
    BACKEND_URL === 'https://plumbing-qcommerce.onrender.com' || BACKEND_URL.startsWith('http'),
    'BACKEND_URL must be valid'
  );
  assert(
    BACKEND_URL !== 'https://fixkart-dev2-backend.onrender.com',
    'BACKEND_URL must not target stale backend'
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

  runCartRegressionTests();
  runAddressValidationTests();
  runProductCheckoutRegressionTests();
  runOtpContractTests();

  console.log('--- ALL CUSTOMER APP TESTS PASSED ---');
}

export function runOtpContractTests() {
  assert(extractLocalQaCode({ message: 'OTP sent successfully', qaCode: '654321' }) === '654321', 'local QA code is accepted only from the backend response');
  assert(extractLocalQaCode({ message: 'OTP sent successfully' }) === undefined, 'ordinary OTP responses do not invent a QA code');
  assert(extractLocalQaCode({ qaCode: 'not-a-code' }) === undefined, 'malformed QA code responses are ignored');
  console.log('âœ“ OTP response mapping and truthful local QA-code contract verified');
}

export function runProductCheckoutRegressionTests() {
  const productItem: CartItem = {
    id: 'prod_42',
    itemType: 'product',
    title: 'QA Pipe',
    price: 145,
    originalPrice: 160,
    quantity: 2,
  };

  const request = buildProductCheckoutRequest([productItem], 7);
  assert(request.storeId === 7, 'product checkout preserves selected Store ID');
  assert(request.items[0].productId === 42, 'product checkout sends the backend product ID');
  assert(request.items[0].quantity === 2, 'product checkout preserves cart quantity');
  assert(productCheckoutSubtotal([productItem]) === 290, 'product checkout subtotal uses item price and quantity');
  assert(
    isStoreCompatibleWithCart(
      { id: 7, name: 'QA Store' },
      [{ product: { id: 42 }, availableQuantity: 2 }],
      [productItem],
    ),
    'Store compatibility requires available stock for every cart item',
  );

  let rejectedMixedCart = false;
  try {
    buildProductCheckoutRequest([
      productItem,
      { ...productItem, id: 'srv_1', itemType: 'service' },
    ], 7);
  } catch {
    rejectedMixedCart = true;
  }
  assert(rejectedMixedCart, 'mixed service/product carts cannot enter product checkout');
  console.log('✓ Product checkout contract, Store propagation, quantity, pricing, and mixed-cart boundary verified');
}

export function runAddressValidationTests() {
  assert(isValidIndianPostalCode('500001'), 'six-digit Indian postal code is valid');
  assert(isValidIndianPostalCode(' 500081 '), 'postal code is trimmed before validation');
  assert(normalizePostalCode(' 500081 ') === '500081', 'postal code normalization is stable');
  for (const value of ['abc', '12345', '1234567', '12A456', '500 001', '１２３４５６', '']) {
    assert(!isValidIndianPostalCode(value), `malformed postal code rejected: ${value || 'blank'}`);
  }
  console.log('✓ Indian postal-code contract validation verified');
}

export function runCartRegressionTests() {
  const valid = JSON.stringify({
    version: CART_STORAGE_VERSION,
    items: [{ id: 'prod_1', itemType: 'product', title: 'Pipe', price: 10, originalPrice: 12, quantity: 2, availableQuantity: 2 }],
  });
  assert(parsePersistedCart(valid).length === 1, 'persisted cart rehydrates valid items');
  assert(parsePersistedCart('{not-json').length === 0, 'corrupt persistence falls back to empty');
  assert(parsePersistedCart(JSON.stringify({ version: 99, items: [] })).length === 0, 'unknown cart version is ignored');
  assert(boundCartQuantity(1, 1, 2) === 2, 'quantity reaches exact stock maximum');
  assert(boundCartQuantity(2, 1, 2) === 2, 'quantity cannot exceed stock maximum');
  assert(boundCartQuantity(1, -1, 2) === 0, 'decrement removes the final item');
  assert(boundCartQuantity(1, -2, 2) === 0, 'quantity cannot become negative');
  console.log('✓ Cart persistence, hydration safety, stock boundary, and non-positive quantity regressions verified');
}

// Execute directly if run with node
if (typeof require !== 'undefined' && require.main === module) {
  runCustomerUnitTests();
  runCartRegressionTests();
}
