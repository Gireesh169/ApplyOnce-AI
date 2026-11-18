export interface LearnedFieldMapping {
  id: string;
  websiteDomain: string; // e.g. "boards.greenhouse.io" or "*"
  fieldSignature: string; // name / id / label normalized
  semanticMeaning: string; // e.g. "education.institution"
  matchedProfilePath: string; // e.g. "education.0.institution" or "custom.clearance"
  userConfirmed: boolean;
  confidenceScore: number;
  createdAt: string;
  lastUsedAt: string;
  usageCount: number;
}
