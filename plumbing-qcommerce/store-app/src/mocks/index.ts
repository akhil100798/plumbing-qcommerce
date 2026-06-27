import { Store, Product, Category, Order, Rider, MaterialRequest, Transaction, Review, Offer, AppNotification } from '../types';

export const mockStore: Store = {
  id: 123,
  name: 'Sai Pipes & Fittings',
  description: 'Authorized dealer of premium pipes, tanks, fittings and tools.',
  address: 'Shop No 12-5-45, Street 3, Miyapur, Hyderabad - 500049',
  latitude: 17.496,
  longitude: 78.362,
  rating: 4.8,
  phone: '9876543210',
  email: 'sai.pipes@plumbcommerce.com',
  imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=300'
};

export const mockCategories: Category[] = [
  { id: 1, name: 'PVC Pipes', description: 'Polyvinyl chloride pipes for drainage and water supply' },
  { id: 2, name: 'CPVC Fittings', description: 'Chlorinated polyvinyl chloride high temperature fittings' },
  { id: 3, name: 'Tanks', description: 'Water storage tanks' },
  { id: 4, name: 'Tools & Accessories', description: 'Plumbing tools and installation materials' }
];

export const mockProducts: Product[] = [
  {
    id: 101,
    sku: 'PVC-20MM-002',
    name: 'Ashirvad PVC Pipe (20mm)',
    description: '2 Meter length heavy duty PVC pipe for plumbing and cold water distribution.',
    price: 220,
    mrp: 250,
    discount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=200',
    categoryId: 1,
    categoryName: 'PVC Pipes',
    stock: 45,
    brand: 'Ashirvad',
    gst: 18
  },
  {
    id: 102,
    sku: 'CPVC-ELB-90',
    name: 'CPVC Elbow 90° (20mm)',
    description: 'High strength chlorinated PVC 90 degree elbow joint.',
    price: 30,
    mrp: 35,
    discount: 14,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200',
    categoryId: 2,
    categoryName: 'CPVC Fittings',
    stock: 30,
    brand: 'Supreme',
    gst: 18
  },
  {
    id: 103,
    sku: 'TEF-TAPE-001',
    name: 'Teflon Tape',
    description: 'PTFE thread seal tape for leak-proof pipe joints.',
    price: 15,
    mrp: 20,
    discount: 25,
    imageUrl: 'https://images.unsplash.com/photo-1585338111119-411333333333?q=80&w=200',
    categoryId: 4,
    categoryName: 'Tools & Accessories',
    stock: 3,
    brand: 'CUMI',
    gst: 18
  },
  {
    id: 104,
    sku: 'PVC-SLV-100',
    name: 'PVC Solvent Cement',
    description: 'Fast setting adhesive for PVC pipe joints, 100ml can.',
    price: 80,
    mrp: 90,
    discount: 11,
    imageUrl: 'https://images.unsplash.com/photo-1597484213126-3f3f58a3f858?q=80&w=200',
    categoryId: 4,
    categoryName: 'Tools & Accessories',
    stock: 22,
    brand: 'Pidilite',
    gst: 18
  },
  {
    id: 105,
    sku: 'TNK-1000L-01',
    name: 'Sintex Water Tank 1000L',
    description: '3 Layer insulated water storage tank, UV stabilized.',
    price: 6500,
    mrp: 7200,
    discount: 9,
    imageUrl: 'https://images.unsplash.com/photo-1585338111119-411333333333?q=80&w=200',
    categoryId: 3,
    categoryName: 'Tanks',
    stock: 14,
    brand: 'Sintex',
    gst: 18
  }
];

export const mockOrders: Order[] = [
  {
    id: 12345,
    customerId: 201,
    customerName: 'Akhil Verma',
    customerPhone: '98765-43210',
    storeId: 123,
    storeName: 'Sai Pipes & Fittings',
    totalAmount: 620,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    address: 'Flat No 12-B-45, Street 3, Miyapur, Hyderabad - 500049',
    estimatedDeliveryAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    items: [
      { productId: 101, productName: 'Ashirvad PVC Pipe (20mm)', quantity: 2, price: 220 },
      { productId: 102, productName: 'CPVC Elbow 90° (20mm)', quantity: 5, price: 30 },
      { productId: 103, productName: 'Teflon Tape', quantity: 1, price: 15 },
      { productId: 104, productName: 'PVC Solvent Cement', quantity: 1, price: 80 }
    ]
  },
  {
    id: 12346,
    customerId: 202,
    customerName: 'Ravi Kumar',
    customerPhone: '99887-76655',
    storeId: 123,
    storeName: 'Sai Pipes & Fittings',
    totalAmount: 450,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    address: 'Building 4B, Sector 2, Madhapur, Hyderabad - 500081',
    estimatedDeliveryAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    items: [
      { productId: 101, productName: 'Ashirvad PVC Pipe (20mm)', quantity: 1, price: 220 },
      { productId: 102, productName: 'CPVC Elbow 90° (20mm)', quantity: 5, price: 30 },
      { productId: 104, productName: 'PVC Solvent Cement', quantity: 1, price: 80 }
    ]
  },
  {
    id: 12347,
    customerId: 203,
    customerName: 'Neha Singh',
    customerPhone: '91234-56789',
    storeId: 123,
    storeName: 'Sai Pipes & Fittings',
    totalAmount: 780,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(), // 7 mins ago
    address: 'Villa 14, Rainbow Colony, Kondapur, Hyderabad - 500084',
    estimatedDeliveryAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    items: [
      { productId: 101, productName: 'Ashirvad PVC Pipe (20mm)', quantity: 3, price: 220 },
      { productId: 102, productName: 'CPVC Elbow 90° (20mm)', quantity: 4, price: 30 }
    ]
  },
  {
    id: 12348,
    customerId: 204,
    customerName: 'Sanjay Reddy',
    customerPhone: '95544-33221',
    storeId: 123,
    storeName: 'Sai Pipes & Fittings',
    totalAmount: 1150,
    status: 'PACKING',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    address: 'H-56, Road No 5, Jubilee Hills, Hyderabad - 500033',
    items: [
      { productId: 105, productName: 'Sintex Water Tank 1000L', quantity: 1, price: 6500 }
    ]
  },
  {
    id: 12349,
    customerId: 205,
    customerName: 'Kiran G',
    customerPhone: '88776-65544',
    storeId: 123,
    storeName: 'Sai Pipes & Fittings',
    totalAmount: 265,
    status: 'READY_FOR_PICKUP',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    address: 'Flat 502, Skyview Apts, Gachibowli, Hyderabad - 500032',
    deliveryPartnerName: 'Mahesh Kumar',
    deliveryPartnerPhone: '98888-77777',
    deliveryOtp: '7234',
    items: [
      { productId: 101, productName: 'Ashirvad PVC Pipe (20mm)', quantity: 1, price: 220 },
      { productId: 102, productName: 'CPVC Elbow 90° (20mm)', quantity: 1, price: 30 },
      { productId: 103, productName: 'Teflon Tape', quantity: 1, price: 15 }
    ]
  }
];

export const mockRiders: Rider[] = [
  {
    id: 301,
    fullName: 'Mahesh Kumar',
    phone: '98765-43210',
    rating: 4.9,
    vehicleNumber: 'TS09EK1234',
    latitude: 17.495,
    longitude: 78.361,
    status: 'AVAILABLE',
    eta: '2 mins away'
  },
  {
    id: 302,
    fullName: 'Praveen Reddy',
    phone: '99887-76655',
    rating: 4.8,
    vehicleNumber: 'TS08EM5678',
    latitude: 17.498,
    longitude: 78.365,
    status: 'AVAILABLE',
    eta: '6 mins away'
  },
  {
    id: 303,
    fullName: 'Syed Imran',
    phone: '91234-56789',
    rating: 4.7,
    vehicleNumber: 'TS07EY8901',
    latitude: 17.491,
    longitude: 78.358,
    status: 'AVAILABLE',
    eta: '8 mins away'
  }
];

export const mockMaterialRequests: MaterialRequest[] = [
  {
    id: 501,
    serviceOrderId: 9001,
    storeId: 123,
    plumberId: 401,
    plumberName: 'Ravi Kumar',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    totalAmount: 370,
    items: [
      { productId: 101, productName: 'Ashirvad PVC Pipe (20mm)', quantity: 1, price: 220 },
      { productId: 102, productName: 'CPVC Elbow 90° (20mm)', quantity: 5, price: 30 }
    ]
  },
  {
    id: 502,
    serviceOrderId: 9002,
    storeId: 123,
    plumberId: 402,
    plumberName: 'Suresh Plumber',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    totalAmount: 560,
    items: [
      { productId: 101, productName: 'Ashirvad PVC Pipe (20mm)', quantity: 2, price: 220 },
      { productId: 102, productName: 'CPVC Elbow 90° (20mm)', quantity: 4, price: 30 }
    ]
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 8001,
    amount: 620,
    type: 'CREDIT',
    description: 'Order #12345 Payment Received',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8002,
    amount: 450,
    type: 'CREDIT',
    description: 'Order #12344 Payment Received',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8003,
    amount: 5000,
    type: 'DEBIT',
    description: 'Payout to Bank Account',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8004,
    amount: 780,
    type: 'CREDIT',
    description: 'Order #12343 Payment Received',
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  }
];

export const mockReviews: Review[] = [
  {
    id: 901,
    customerName: 'Akhil Verma',
    rating: 5,
    comment: 'Good packing and fast delivery! Highly recommended.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 902,
    customerName: 'Subhasish Panda',
    rating: 4,
    comment: 'Quality products, stock is always available.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockOffers: Offer[] = [
  {
    id: 11,
    code: 'FLAT100',
    description: 'Flat ₹100 OFF on orders above ₹500',
    value: 100,
    type: 'FLAT',
    minOrderAmount: 500,
    active: true,
    expiryDate: '2026-07-31T00:00:00Z'
  },
  {
    id: 12,
    code: 'PLUMB10',
    description: '10% OFF on CPVC Fittings',
    value: 10,
    type: 'PERCENTAGE',
    minOrderAmount: 0,
    active: true,
    expiryDate: '2026-07-25T00:00:00Z'
  },
  {
    id: 13,
    code: 'FREEDEL',
    description: 'FREE Delivery on orders above ₹999',
    value: 0,
    type: 'FREE_DELIVERY',
    minOrderAmount: 999,
    active: true,
    expiryDate: '2026-07-31T00:00:00Z'
  }
];

export const mockNotifications: AppNotification[] = [
  {
    id: 7001,
    title: 'New Order Received',
    message: 'Order #12345 has been placed by Akhil Verma.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    type: 'NEW_ORDER'
  },
  {
    id: 7002,
    title: 'Rider Assigned',
    message: 'Mahesh Kumar assigned to order #12349.',
    read: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: 'RIDER_ASSIGNED'
  },
  {
    id: 7003,
    title: 'Payment Received',
    message: '₹620 added to your wallet for Order #12345.',
    read: true,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    type: 'PAYMENT_RECEIVED'
  },
  {
    id: 7004,
    title: 'Low Stock Alert',
    message: '13 products are low in stock. Please restock.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'LOW_STOCK'
  },
  {
    id: 7005,
    title: 'Offer Activated',
    message: 'Flat ₹100 OFF is now active.',
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    type: 'OFFER_ACTIVATED'
  }
];
