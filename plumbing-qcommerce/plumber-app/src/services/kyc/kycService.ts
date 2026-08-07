import { apiClient } from '../api/axiosClient';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export interface PlumberKyc { status: KycStatus; rejectionReason: string | null; submittedAt: string | null; experienceYears: number | null; serviceAreas: string | null; }
export interface KycSubmission { aadhaarNumber: string; panNumber: string; bankAccountNumber: string; experienceYears: number; serviceAreas: string; }
export const kycService = { async get(): Promise<PlumberKyc> { return (await apiClient.get<PlumberKyc>('/plumber/kyc')).data; }, async submit(request: KycSubmission): Promise<PlumberKyc> { return (await apiClient.post<PlumberKyc>('/plumber/kyc', request)).data; } };
