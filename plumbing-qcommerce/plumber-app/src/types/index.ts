export interface PlumberProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  rating: number;
  ratingsCount: number;
  plumberId: string;
  availability: boolean;
}

export interface CustomerInfo {
  id: string;
  fullName: string;
  phone: string;
  rating: number;
}

export interface JobOffer {
  jobId: string;
  customerId: string;
  customerName?: string;
  customerRating?: number;
  distance: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  estimatedEarnings?: number;
  issueDescription?: string;
  category?: string;
}

export interface ActiveJob {
  jobId: string;
  customer: CustomerInfo;
  status: 'assigned' | 'accepted' | 'started' | 'completed' | 'reached' | 'on_the_way';
  address: string;
  latitude: number;
  longitude: number;
  customerNote?: string;
  estimatedEarnings: number;
  partsCharge?: number;
  timeline: {
    assigned?: string;
    accepted?: string;
    on_the_way?: string;
    reached?: string;
    started?: string;
    completed?: string;
  };
}

export interface MaterialItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface MaterialRequest {
  id: number;
  serviceOrderId: string;
  storeName: string;
  distance: number;
  items: MaterialItem[];
  totalAmount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DELIVERING' | 'DELIVERED';
  paymentStatus: 'PAID' | 'UNPAID';
  eta?: string;
}

export interface WalletInfo {
  balance: number;
  todayEarnings: number;
  weeklyEarnings: number;
  completedJobsCount: number;
  commissionBreakdown: {
    serviceCommission: number;
    materialCommission: number;
    tips: number;
  };
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  createdAt: string;
  referenceId?: string;
}
