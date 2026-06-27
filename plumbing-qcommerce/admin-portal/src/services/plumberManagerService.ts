import { apiRequest } from "./apiClient";
export type AvailabilityStatus="ONLINE"|"OFFLINE"|"BUSY"|"SUSPENDED"; export type KycStatus="NOT_SUBMITTED"|"PENDING"|"APPROVED"|"REJECTED";
export interface Page<T>{content:T[];totalElements:number;totalPages:number;number:number;size:number}
export interface Dashboard{totalPlumbers:number;onlinePlumbers:number;busyPlumbers:number;offlinePlumbers:number;suspendedPlumbers:number;pendingKyc:number;approvedKyc:number;rejectedKyc:number;activeJobs:number;completedJobsToday:number;averageRating:number|null;totalEarningsThisMonth:number}
export interface PlumberSummary{plumberId:number;fullName:string;phone:string;email:string;availabilityStatus:AvailabilityStatus;kycStatus:KycStatus;rating:number|null;completedJobs:number;activeJobs:number;totalEarnings:number;joinedAt:string}
export interface Job{jobId:number;customerName:string;requestType:string;status:string;amount:number|null;createdAt:string;completedAt:string|null}
export interface Performance{completedJobs:number;cancelledJobs:number;activeJobs:number;averageRating:number|null;averageCompletionMinutes:number|null;totalEarnings:number;monthlyEarnings:number;responseRate:number|null}
export interface PlumberDetail{plumberId:number;fullName:string;phone:string;email:string;joinedAt:string;kycStatus:KycStatus;availabilityStatus:AvailabilityStatus;totalJobs:number;activeJobs:number;completedJobs:number;averageRating:number|null;totalEarnings:number;monthlyEarnings:number;recentServiceJobs:Job[];recentComplaints:string[]}
export interface KycSummary{kycId:number;plumberId:number;plumberName:string;phone:string;experienceYears:number|null;serviceAreas:string|null;submittedAt:string;status:KycStatus}
export interface KycDetail extends KycSummary{email:string;aadhaarNumberMasked:string|null;panNumberMasked:string|null;bankAccountMasked:string|null;documentStatus:string|null;reviewedAt:string|null;reviewedByAdminId:number|null;rejectionReason:string|null}
const base="/api/v1/admin/plumber-manager"; const query=(p:Record<string,string|number|undefined>)=>{const q=new URLSearchParams();Object.entries(p).forEach(([k,v])=>{if(v!==undefined&&v!=="")q.set(k,String(v))});return q.toString()?`?${q}`:""};
export const getDashboard=()=>apiRequest<Dashboard>(`${base}/dashboard`);
export const listPlumbers=(p:Record<string,string|number|undefined>={})=>apiRequest<Page<PlumberSummary>>(`${base}/plumbers${query(p)}`);
export const getPlumber=(id:number)=>apiRequest<PlumberDetail>(`${base}/plumbers/${id}`);
export const pendingKyc=()=>apiRequest<KycSummary[]>(`${base}/kyc/pending`);
export const getKyc=(id:number)=>apiRequest<KycDetail>(`${base}/kyc/${id}`);
export const approveKyc=(id:number,note:string)=>apiRequest<KycSummary>(`${base}/kyc/${id}/approve`,{method:"PATCH",body:{note}});
export const rejectKyc=(id:number,reason:string)=>apiRequest<KycSummary>(`${base}/kyc/${id}/reject`,{method:"PATCH",body:{reason}});
export const getJobs=(id:number,p:Record<string,string|number|undefined>={})=>apiRequest<Page<Job>>(`${base}/plumbers/${id}/jobs${query(p)}`);
export const getPerformance=(id:number)=>apiRequest<Performance>(`${base}/plumbers/${id}/performance`);
export const updateAvailability=(id:number,status:AvailabilityStatus,reason:string)=>apiRequest<PlumberSummary>(`${base}/plumbers/${id}/availability`,{method:"PATCH",body:{status,reason}});
