export interface DiagnosisDraftRequest {
  affectedComponent: string;
  observedCondition: string;
  diagnosisNarrative: string;
  recommendedRemedy: string;
  estimatedLaborUnits: number;
  knownMaterialCandidates: string;
  safetyNotes: string;
  safetyBlocked: boolean;
}

export interface DiagnosisEvidenceDTO {
  id: number;
  photoId: number;
  phase: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface PlumberDiagnosisDTO extends DiagnosisDraftRequest {
  id: number;
  orderId: number;
  state: string;
  revisionNumber: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  evidence: DiagnosisEvidenceDTO[];
}

export interface QuoteLineDTO {
  lineType: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface PlumberQuoteDTO {
  id: number;
  orderId: number;
  diagnosisId: number | null;
  kind: string;
  state: string;
  version: number;
  laborSubtotal: number;
  knownMaterialSubtotal: number;
  total: number;
  currency: string;
  pricingCatalogId: number | null;
  pricingCatalogVersion: number | null;
  publishedAt: string | null;
  expiresAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  lines: QuoteLineDTO[];
}
