export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Otp: { phone: string };
};

export type MainTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Earnings: undefined;
  Materials: { jobId: string } | undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Auth: undefined;
  Main: undefined; // Contains Bottom Tabs + Drawer
  IncomingJobRequest: { jobId: string; customerId: string; distance: number };
  ActiveJob: { jobId: string };
  Navigation: { jobId: string; customerId: string; latitude: number; longitude: number; address: string };
  ReachedCustomer: { jobId: string };
  StartWork: { jobId: string };
  BeforePhotos: { jobId: string };
  MaterialRequest: { jobId: string };
  MaterialApprovalStatus: { jobId: string; productOrderId?: number };
  MaterialTracking: { jobId: string; productOrderId: number };
  AfterPhotos: { jobId: string };
  CompleteService: { jobId: string };
  Wallet: undefined;
  Earnings: undefined;
  JobHistory: undefined;
  Profile: undefined;
  Chat: { name: string; role: string };
};
