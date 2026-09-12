import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  setAuthToken,
  setRefreshToken,
  getAuthToken,
  clearTokens,
} from './api/apiClient';
import { tokenStorage } from './api/tokenStorage';
import { AuthUserDto, UserAddress } from '../types/backend';

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isPlusMember: boolean;
  plusExpiryDate?: string;
  savedCoins: number;
  referralCode: string;
  role: string;
}

export interface Address {
  id: string;
  numericId?: number;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  flat: string;
  area: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
  addressLine?: string;
}

interface AuthContextType {
  user: CustomerUser | null;
  rawUser: AuthUserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  addresses: Address[];
  selectedAddress: Address;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: { fullName?: string; phone?: string; addressLine?: string; city?: string; state?: string; pincode?: string }) => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
  refreshAddresses: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const fallbackDefaultAddress: Address = {
  id: 'addr_default',
  type: 'home',
  name: 'Customer',
  phone: '',
  flat: 'Sector 14, 27th Main',
  area: 'HSR Layout',
  city: 'Bengaluru',
  pincode: '560102',
  isDefault: true,
};

function mapBackendAddressToUI(addr: UserAddress, idx: number): Address {
  // Parse address line or use as is
  const rawLine = addr.addressLine || '';
  const parts = rawLine.split(',').map((p) => p.trim());
  const flat = parts[0] || rawLine;
  const area = parts.slice(1, Math.max(1, parts.length - 1)).join(', ') || 'Area';
  const lastPart = parts[parts.length - 1] || '';
  const pincodeMatch = lastPart.match(/\d{6}/);
  const pincode = pincodeMatch ? pincodeMatch[0] : '560102';

  const labelLower = (addr.label || 'home').toLowerCase();
  const type: 'home' | 'work' | 'other' =
    labelLower.includes('work') || labelLower.includes('office')
      ? 'work'
      : labelLower.includes('other')
      ? 'other'
      : 'home';

  return {
    id: String(addr.id),
    numericId: addr.id,
    type,
    name: addr.name || 'Resident',
    phone: addr.phone || '',
    flat,
    area,
    city: 'Bengaluru',
    pincode,
    isDefault: idx === 0,
    addressLine: rawLine,
  };
}

function mapBackendUserToUI(u: AuthUserDto): CustomerUser {
  return {
    id: String(u.id),
    name: u.fullName || (u.phone ? `Customer ${u.phone.slice(-4)}` : 'FixKart Customer'),
    phone: u.phone || '',
    email: u.email || '',
    avatarUrl: u.profileImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    isPlusMember: true,
    plusExpiryDate: '31 Dec 2026',
    savedCoins: 450,
    referralCode: `FIX${(u.fullName || 'CUSTOMER').replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase()}50`,
    role: u.role || 'CUSTOMER',
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawUser, setRawUser] = useState<AuthUserDto | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address>(fallbackDefaultAddress);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await apiClient.get<AuthUserDto>('/auth/me');
      setRawUser(profile);
      const mapped = mapBackendUserToUI(profile);
      setUser(mapped);
      setIsAuthenticated(true);
      await tokenStorage.setItem('currentUser', JSON.stringify(profile));
    } catch (err) {
      console.warn('Failed to fetch current user profile:', err);
    }
  }, []);

  const refreshAddresses = useCallback(async () => {
    try {
      const backendAddresses = await apiClient.get<UserAddress[]>('/users/me/addresses');
      if (Array.isArray(backendAddresses) && backendAddresses.length > 0) {
        const mapped = backendAddresses.map(mapBackendAddressToUI);
        setAddresses(mapped);
        setSelectedAddress((prev) => {
          const match = mapped.find((a) => a.id === prev.id);
          return match || mapped[0];
        });
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.warn('Failed to load user addresses:', err);
    }
  }, []);

  // Initial Auth Check on app startup
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        const token = await getAuthToken();
        if (token) {
          try {
            const profile = await apiClient.get<AuthUserDto>('/auth/me');
            if (isMounted) {
              setRawUser(profile);
              setUser(mapBackendUserToUI(profile));
              setIsAuthenticated(true);
              await refreshAddresses();
            }
          } catch {
            // Token might be invalid or expired
            await clearTokens();
            if (isMounted) {
              setRawUser(null);
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (e) {
        console.error('Error restoring session:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    initAuth();
    return () => {
      isMounted = false;
    };
  }, [refreshAddresses]);

  const loginWithPhone = async (phone: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      await apiClient.post('/auth/send-otp', { phone: cleanPhone });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const response = await apiClient.post<{
        token: string;
        refreshToken?: string;
        userId?: number;
        role?: string;
        email?: string;
      }>('/auth/verify-otp', {
        phone: cleanPhone,
        code: otp.trim(),
      });

      if (response && response.token) {
        setAuthToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }

        await refreshUser();
        await refreshAddresses();
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'OTP verification failed' };
    }
  };

  const updateProfile = async (data: {
    fullName?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => {
    try {
      if (data.addressLine) {
        await apiClient.put('/customers/me/profile-completion', {
          fullName: data.fullName || user?.name || 'Customer',
          phone: data.phone || user?.phone || '',
          addressLine1: data.addressLine,
          city: data.city || 'Bengaluru',
          state: data.state || 'Karnataka',
          pincode: data.pincode || '560102',
          landmark: '',
        });
      }
      await refreshUser();
      await refreshAddresses();
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const addAddress = async (addressData: Omit<Address, 'id'>): Promise<Address> => {
    const fullLine = addressData.addressLine || `${addressData.flat}, ${addressData.area}, ${addressData.city} - ${addressData.pincode}`;
    const payload = {
      label: addressData.type === 'work' ? 'Work' : addressData.type === 'other' ? 'Other' : 'Home',
      name: addressData.name || user?.name || 'Customer',
      phone: addressData.phone || user?.phone || '9876511223',
      addressLine: fullLine,
    };

    const saved = await apiClient.post<UserAddress>('/users/me/addresses', payload);
    const newUIAddr = mapBackendAddressToUI(saved, 0);
    setAddresses((prev) => [newUIAddr, ...prev]);
    setSelectedAddress(newUIAddr);
    return newUIAddr;
  };

  const deleteAddress = async (id: string) => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      await apiClient.delete(`/users/me/addresses/${numId}`);
    }
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (selectedAddress.id === id) {
        setSelectedAddress(filtered[0] || fallbackDefaultAddress);
      }
      return filtered;
    });
  };

  const selectAddress = (id: string) => {
    const found = addresses.find((a) => a.id === id);
    if (found) setSelectedAddress(found);
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
    setRawUser(null);
    setAddresses([]);
    setSelectedAddress(fallbackDefaultAddress);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        isAuthenticated,
        isLoading,
        addresses,
        selectedAddress,
        loginWithPhone,
        verifyOtp,
        updateProfile,
        addAddress,
        deleteAddress,
        selectAddress,
        refreshAddresses,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
