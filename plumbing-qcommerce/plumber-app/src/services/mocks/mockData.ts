import { PlumberProfile, ActiveJob, JobOffer, MaterialItem, Transaction } from '../../types';

export const MOCK_PLUMBER: PlumberProfile = {
  id: 'plmr_404',
  fullName: 'Ravi Kumar',
  phone: '+91 98765 43210',
  email: 'ravi.kumar@plumbcommerce.com',
  rating: 4.9,
  ratingsCount: 324,
  plumberId: 'PLB12345',
  availability: false,
};

export const MOCK_CATALOG: MaterialItem[] = [
  { productId: 101, name: 'PVC Pipe 1/2 inch', price: 110, quantity: 0 },
  { productId: 102, name: 'CPVC Elbow 90°', price: 45, quantity: 0 },
  { productId: 103, name: 'Teflon Tape', price: 20, quantity: 0 },
  { productId: 104, name: 'PVC Solvent Cement', price: 80, quantity: 0 },
];

export const MOCK_JOB_OFFER: JobOffer = {
  jobId: 'PC123456',
  customerId: 'cust_99',
  customerName: 'Akhil Verma',
  customerRating: 4.8,
  distance: 2.4,
  location: 'H.No 12-5-45, Street 3, Miyapur, Hyderabad - 500049',
  latitude: 17.4933,
  longitude: 78.3489,
  estimatedEarnings: 299,
  issueDescription: 'Pipe Leakage in Bathroom',
  category: 'Bathroom',
};

export const MOCK_ACTIVE_JOB: ActiveJob = {
  jobId: 'PC123456',
  customer: {
    id: 'cust_99',
    fullName: 'Akhil Verma',
    phone: '+91 9999999999',
    rating: 4.8,
  },
  status: 'accepted',
  address: 'H.No 12-5-45, Street 3, Miyapur, Hyderabad - 500049',
  latitude: 17.4933,
  longitude: 78.3489,
  customerNote: 'Water leakage behind the wash basin.',
  estimatedEarnings: 299,
  partsCharge: 0,
  timeline: {
    assigned: '10:15 AM',
    accepted: '10:16 AM',
    on_the_way: '10:17 AM',
  },
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN101',
    type: 'CREDIT',
    amount: 554,
    description: 'Job #PC123455 Completion Payment',
    createdAt: 'Today, 11:30 AM',
    referenceId: 'PC123455',
  },
  {
    id: 'TXN102',
    type: 'CREDIT',
    amount: 30,
    description: 'Material Commission for Job #PC123455',
    createdAt: 'Today, 10:15 AM',
    referenceId: 'PC123455',
  },
  {
    id: 'TXN103',
    type: 'DEBIT',
    amount: 2000,
    description: 'Bank Transfer Withdrawal',
    createdAt: 'Yesterday, 08:20 PM',
  },
];
