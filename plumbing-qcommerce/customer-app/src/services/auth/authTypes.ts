export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone: string;
  phoneVerified?: boolean;
  profileComplete?: boolean;
  authProvider?: string;
  profileImageUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  accessToken?: string;
  refreshToken: string;
  userId: number;
  role: string;
  email: string;
  fullName: string;
  phone: string;
  phoneVerified?: boolean;
  profileComplete?: boolean;
  authProvider?: string;
  user?: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
}

export type LoginResponse = AuthResponse;
export type RegisterResponse = AuthResponse;
