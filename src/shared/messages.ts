import { MatchedFormField, MissingFormField, UnsupportedFormField } from '@/adaptive/types';

export const MESSAGE_TYPES = {
  INSPECT_PAGE_FORMS: 'INSPECT_PAGE_FORMS',
  PAGE_FORMS_DETECTED: 'PAGE_FORMS_DETECTED',
  TRIGGER_AUTOFILL: 'TRIGGER_AUTOFILL',
  AUTOFILL_COMPLETED: 'AUTOFILL_COMPLETED',
  AUTOFILL_STATUS: 'AUTOFILL_STATUS',
  SAVE_CUSTOM_FIELDS: 'SAVE_CUSTOM_FIELDS',
  SAVE_FIELD_MAPPING: 'SAVE_FIELD_MAPPING',
  OPEN_DASHBOARD: 'OPEN_DASHBOARD',
  GET_PROFILE_DATA: 'GET_PROFILE_DATA'
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export interface ExtensionMessage<T = any> {
  type: MessageType;
  payload?: T;
}

export interface AutofillItemPayload {
  selector: string;
  value: any;
  type: string;
  allowOverwrite?: boolean;
}

export interface AutofillPayload {
  approvedMatches: AutofillItemPayload[];
  overwriteExisting?: boolean;
  temporaryFields?: Record<string, any>;
}

export interface InspectionResult {
  url: string;
  domain: string;
  matchedFields: MatchedFormField[];
  missingFields: MissingFormField[];
  unsupportedFields: UnsupportedFormField[];
  totalFieldsCount: number;
}
