export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isPlusMember: boolean;
  plusExpiryDate?: string;
  savedCoins: number;
  referralCode: string;
}

export const currentUser: UserProfile = {
  id: "usr_4021",
  name: "Akhil Sharma",
  phone: "+91 98765 11223",
  email: "akhil.sharma@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
  isPlusMember: true,
  plusExpiryDate: "31 Dec 2026",
  savedCoins: 450,
  referralCode: "FIXAKHIL50"
};
