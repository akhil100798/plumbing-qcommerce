import { ServiceOrder, OrderStatus as BackendOrderStatus } from '../types/backend';
import { Order, OrderStatus as UIOrderStatus, OrderItem } from '../data/orders';

export function mapBackendStatusToUI(status: BackendOrderStatus | string): {
  uiStatus: UIOrderStatus;
  label: string;
} {
  switch (status) {
    case 'PENDING':
      return { uiStatus: 'requested', label: 'Service Requested' };
    case 'ACCEPTED':
      return { uiStatus: 'assigned', label: 'Plumber Assigned' };
    case 'IN_PROGRESS':
      return { uiStatus: 'in_progress', label: 'Work In Progress' };
    case 'COMBINED_ORDER':
      return { uiStatus: 'in_progress', label: 'Work & Parts In Progress' };
    case 'MATERIALS_REQUIRED':
      return { uiStatus: 'materials_pending', label: 'Materials Required' };
    case 'WAITING_FOR_STORE':
      return { uiStatus: 'materials_pending', label: 'Store Reviewing Materials' };
    case 'READY_FOR_PRODUCT_PICKUP':
      return { uiStatus: 'materials_pending', label: 'Materials Ready At Store' };
    case 'PLUMBER_COLLECTING_PRODUCTS':
      return { uiStatus: 'materials_pending', label: 'Plumber Collecting Materials' };
    case 'PRODUCTS_COLLECTED':
      return { uiStatus: 'materials_pending', label: 'Materials Collected' };
    case 'RETURNING_TO_CUSTOMER':
      return { uiStatus: 'in_progress', label: 'Plumber Returning To Site' };
    case 'WORK_RESUMED':
      return { uiStatus: 'in_progress', label: 'Work Resumed' };
    case 'CUSTOMER_CONFIRMED':
    case 'COMPLETED':
    case 'PAID':
      return { uiStatus: 'completed', label: 'Service Completed' };
    case 'CANCELLED':
      return { uiStatus: 'cancelled', label: 'Booking Cancelled' };
    default:
      return { uiStatus: 'in_progress', label: String(status) };
  }
}

export function mapBackendOrderToUI(backendOrder: ServiceOrder): Order {
  const { uiStatus, label } = mapBackendStatusToUI(backendOrder.status);

  const formattedDate = backendOrder.createdAt
    ? new Date(backendOrder.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Booking';

  const items: OrderItem[] = [
    {
      id: `srv_${backendOrder.id}`,
      title: backendOrder.description || 'General Plumbing Service',
      type: 'service',
      price: backendOrder.estimatedCost || 299,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
    },
  ];

  if (backendOrder.partsCharge && backendOrder.partsCharge > 0) {
    items.push({
      id: `parts_${backendOrder.id}`,
      title: 'Plumbing Spare Parts & Materials',
      type: 'product',
      price: backendOrder.partsCharge,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=500&auto=format&fit=crop&q=80',
    });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const visitingFee = 49;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + visitingFee + tax;

  const plumber = backendOrder.plumber
    ? {
        id: `plum_${backendOrder.plumber.id}`,
        name: backendOrder.plumber.fullName || 'Certified Plumber',
        rating: backendOrder.plumber.rating || 4.9,
        completedJobs: 842,
        phone: backendOrder.plumber.phone || '+91 98765 43210',
        photoUrl:
          backendOrder.plumber.photoUrl ||
          'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=500&auto=format&fit=crop&q=80',
        badge: backendOrder.plumber.badge || 'Certified Master Plumber',
        experienceYears: backendOrder.plumber.experienceYears || 6,
      }
    : undefined;

  const isCompleted = uiStatus === 'completed';
  const isAssigned =
    backendOrder.status !== 'PENDING' && backendOrder.status !== 'CANCELLED';
  const isInProgress =
    backendOrder.status === 'IN_PROGRESS' ||
    backendOrder.status === 'WORK_RESUMED' ||
    isCompleted;

  const timeline = [
    {
      status: 'requested' as UIOrderStatus,
      title: 'Service Requested',
      description: 'Your plumbing booking request was placed successfully.',
      time: backendOrder.createdAt ? new Date(backendOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
      completed: true,
    },
    {
      status: 'confirmed' as UIOrderStatus,
      title: 'Service Verified',
      description: 'FixKart hub accepted the service dispatch.',
      time: backendOrder.acceptedAt ? new Date(backendOrder.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified',
      completed: isAssigned,
    },
    {
      status: 'assigned' as UIOrderStatus,
      title: 'Plumber Assigned',
      description: plumber ? `${plumber.name} has accepted and is on the way.` : 'Locating nearest certified plumber...',
      time: backendOrder.arrivedAt ? new Date(backendOrder.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On the way',
      completed: isAssigned,
    },
    {
      status: 'in_progress' as UIOrderStatus,
      title: 'Repair In Progress',
      description: 'Plumber inspecting and performing plumbing fix on site.',
      time: backendOrder.startedAt ? new Date(backendOrder.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
      completed: isInProgress,
    },
    {
      status: 'completed' as UIOrderStatus,
      title: 'Service Completed & Warranty',
      description: 'Work done and backed by FixKart 60-day warranty guarantee.',
      time: backendOrder.completedAt ? new Date(backendOrder.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
      completed: isCompleted,
    },
  ];

  return {
    id: String(backendOrder.id),
    orderNumber: `FK-${String(backendOrder.id).padStart(6, '0')}`,
    date: formattedDate,
    timeSlot: 'Today, within 45 mins',
    status: uiStatus,
    statusLabel: label,
    items,
    subtotal,
    discount: 0,
    visitingFee,
    tax,
    total,
    address: 'Customer Address, Bengaluru',
    paymentMethod: 'UPI / Cash on Delivery',
    isPaid: isCompleted,
    plumber,
    timeline,
  };
}
