export type CustomFieldCategory =
  | 'Personal'
  | 'Legal'
  | 'Contact'
  | 'Education'
  | 'Employment'
  | 'Compensation'
  | 'Work Authorization'
  | 'Preferences'
  | 'Additional Information';

export type CustomFieldDataType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export type SensitivityClassification = 'public' | 'standard' | 'confidential' | 'restricted';

export type ConsentStatus = 'approved' | 'pending' | 'one_time' | 'rejected';

export interface CustomField {
  id: string;
  fieldKey: string;
  displayLabel: string;
  value: string | number | boolean;
  category: CustomFieldCategory;
  dataType: CustomFieldDataType;
  options?: string[];
  source: 'manual' | 'detected_form' | 'resume';
  createdAt: string;
  updatedAt: string;
  userConsentStatus: ConsentStatus;
  sensitivityClassification: SensitivityClassification;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface DetectedFormField {
  id: string;
  name: string;
  type: string;
  selector: string;
  label: string;
  placeholder: string;
  ariaLabel: string;
  autocomplete: string;
  options?: { value: string; label: string }[];
  currentValue: string;
  required: boolean;
  surroundingText?: string;
  isUnsupported?: boolean;
  unsupportedReason?: string;
}

export interface UnsupportedFormField {
  id: string;
  name: string;
  label: string;
  type: string;
  reason: string;
  selector?: string;
}

export interface MatchedFormField {
  detectedField: DetectedFormField;
  profilePath?: string;
  matchedCustomFieldId?: string;
  suggestedValue: any;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  matchReason: string;
  isAmbiguous: boolean;
  isExact: boolean;
  isUnsupported?: boolean;
}

export interface MissingFormField {
  id: string;
  detectedField: DetectedFormField;
  websiteQuestion: string;
  suggestedExistingInformation?: {
    fieldKey: string;
    label: string;
    value: any;
    confidence: ConfidenceLevel;
  };
  userProvidedValue?: any;
  action: 'save_permanent' | 'use_once' | 'skip' | 'not_applicable';
}
