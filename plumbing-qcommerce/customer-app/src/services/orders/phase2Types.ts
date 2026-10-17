export interface DiagnosisEvidenceDTO {
  id: number;
  photoId: number;
  phase: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface CustomerDiagnosisDTO {
  id: number;
  state: string;
  affectedComponent: string;
  observedCondition: string;
  diagnosisNarrative: string;
  recommendedRemedy: string;
  estimatedLaborUnits: number;
  knownMaterialCandidates: string | null;
  safetyNotes: string | null;
  submittedAt: string | null;
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

export interface CustomerQuoteDTO {
  id: number;
  kind: string;
  state: string;
  version: number;
  currency: string;
  laborSubtotal: number;
  knownMaterialSubtotal: number;
  total: number;
  publishedAt: string | null;
  expiresAt: string | null;
  lines: QuoteLineDTO[];
}
