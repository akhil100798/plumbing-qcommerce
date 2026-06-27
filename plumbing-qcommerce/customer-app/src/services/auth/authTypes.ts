export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: number;
  role: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
  phone: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
}
