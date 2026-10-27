import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Otp: { phone: string };
};

export type MainTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Earnings: undefined;
  Materials: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined; // Contains Bottom Tabs + Drawer
  IncomingJobRequest: { jobId?: string; customerId?: string; distance?: number } | undefined;
  ActiveJob: { jobId?: string } | undefined;
  Navigation: { jobId?: string; customerId?: string; latitude?: number | null; longitude?: number | null; plumberLatitude?: number | null; plumberLongitude?: number | null; routeEta?: string | null; routeDistance?: string | null; turnInstruction?: string | null; turnDistance?: string | null; status?: string | null; address?: string } | undefined;
  ReachedCustomer: { jobId?: string } | undefined;
  StartWork: { jobId?: string } | undefined;
  Diagnosis: { jobId?: string } | undefined;
  BeforePhotos: { jobId?: string } | undefined;
  StoreSelection: { jobId?: string } | undefined;
  MaterialRequest: { jobId?: string; storeId?: number; storeName?: string } | undefined;
  MaterialApprovalStatus: { jobId?: string; productOrderId?: number } | undefined;
  MaterialTracking: { jobId?: string; productOrderId?: number } | undefined;
  AfterPhotos: { jobId?: string } | undefined;
  CompleteService: { jobId?: string } | undefined;
  Materials: { jobId?: string } | undefined;
  Wallet: undefined;
  Earnings: undefined;
  JobHistory: undefined;
  Profile: undefined;
  Drawer: undefined;
  Chat: { name?: string; role?: string } | undefined;
};
