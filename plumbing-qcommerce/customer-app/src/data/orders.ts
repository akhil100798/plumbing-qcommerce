export type OrderStatus =
  | "requested"
  | "confirmed"
  | "assigned"
  | "in_progress"
  | "materials_pending"
  | "completed"
  | "cancelled";

export interface OrderItem {
  id: string;
  title: string;
  type: "service" | "product";
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface PlumberProfile {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
  phone: string;
  photoUrl: string;
  badge: string;
  experienceYears: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  timeSlot: string;
  status: OrderStatus;
  statusLabel: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  visitingFee: number;
  total: number;
  address: string;
  paymentMethod: string;
  isPaid: boolean;
  plumber?: PlumberProfile;
  timeline: {
    status: OrderStatus;
    title: string;
    description: string;
    time: string;
    completed: boolean;
  }[];
  materialsApproved?: {
    id: string;
    title: string;
    cost: number;
    approved: boolean;
  }[];
}

export const initialOrders: Order[] = [
  {
    id: "ord_101",
    orderNumber: "FK-894210",
    date: "Today, 11:30 AM",
    timeSlot: "Today, 11:30 AM - 01:00 PM",
    status: "in_progress",
    statusLabel: "Work In Progress",
    items: [
      {
        id: "srv_1",
        title: "Tap & Faucet Repair / Replacement",
        type: "service",
        price: 199,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80"
      },
      {
        id: "prod_5",
        title: "Teflon PTFE Thread Seal Tape",
        type: "product",
        price: 35,
        quantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80"
      }
    ],
    subtotal: 269,
    discount: 50,
    visitingFee: 49,
    tax: 15,
    total: 283,
    address: "Flat 402, Sunshine Residency, Sector 14, HSR Layout, Bengaluru",
    paymentMethod: "UPI (Google Pay)",
    isPaid: true,
    plumber: {
      id: "plum_1",
      name: "Ramesh Sharma",
      rating: 4.9,
      completedJobs: 840,
      phone: "+91 98765 43210",
      photoUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=500&auto=format&fit=crop&q=80",
      badge: "Master Plumber",
      experienceYears: 8
    },
    materialsApproved: [
      {
        id: "mat_1",
        title: "Heavy Brass Ceramic Spindle (Half Inch)",
        cost: 160,
        approved: true
      }
    ],
    timeline: [
      {
        status: "requested",
        title: "Service Booked",
        description: "Your plumbing service booking request was placed successfully.",
        time: "10:15 AM",
        completed: true
      },
      {
        status: "confirmed",
        title: "Booking Confirmed",
        description: "FixKart dispatch verified plumber availability in HSR Layout.",
        time: "10:20 AM",
        completed: true
      },
      {
        status: "assigned",
        title: "Plumber Assigned",
        description: "Ramesh Sharma (4.9 ★) has accepted and is on his way.",
        time: "10:35 AM",
        completed: true
      },
      {
        status: "in_progress",
        title: "Repair in Progress",
        description: "Plumber arrived at location and started the tap repair.",
        time: "11:10 AM",
        completed: true
      },
      {
        status: "completed",
        title: "Service Completed & Verification",
        description: "Customer verification OTP & digital warranty generation.",
        time: "Estimated 11:45 AM",
        completed: false
      }
    ]
  },
  {
    id: "ord_102",
    orderNumber: "FK-773419",
    date: "12 Aug 2026, 04:00 PM",
    timeSlot: "12 Aug 2026, 04:00 PM - 05:30 PM",
    status: "completed",
    statusLabel: "Completed",
    items: [
      {
        id: "srv_2",
        title: "Pipe Leakage Detection & Repair",
        type: "service",
        price: 349,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&auto=format&fit=crop&q=80"
      }
    ],
    subtotal: 349,
    discount: 0,
    visitingFee: 49,
    tax: 21,
    total: 419,
    address: "Flat 402, Sunshine Residency, Sector 14, HSR Layout, Bengaluru",
    paymentMethod: "Cash on Delivery",
    isPaid: true,
    plumber: {
      id: "plum_2",
      name: "Suresh Patil",
      rating: 4.8,
      completedJobs: 520,
      phone: "+91 98450 12345",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
      badge: "Leakage Specialist",
      experienceYears: 6
    },
    timeline: [
      {
        status: "requested",
        title: "Service Booked",
        description: "Booking placed.",
        time: "03:10 PM",
        completed: true
      },
      {
        status: "completed",
        title: "Service Completed",
        description: "Pipes sealed and tested under 4 bar pressure.",
        time: "05:15 PM",
        completed: true
      }
    ]
  }
];
