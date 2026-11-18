import { DetectedFormField, MatchedFormField, MissingFormField, CustomField, CustomFieldCategory } from './types';
import { UserProfile } from '@/profile/types';
import { StorageService } from '@/storage/StorageService';

export class MissingFieldService {
  /**
   * Evaluates detected fields and filters those requiring user review or missing info.
   */
  public static identifyMissingAndAmbiguousFields(
    detectedFields: DetectedFormField[],
    matchedFields: MatchedFormField[],
    profile: UserProfile,
    customFields: CustomField[]
  ): MissingFormField[] {
    const missing: MissingFormField[] = [];

    detectedFields.forEach((field) => {
      const match = matchedFields.find(m => m.detectedField.id === field.id || m.detectedField.selector === field.selector);

      // If matched with high confidence and not ambiguous, it doesn't need a missing field dialog
      if (match && match.confidence === 'high' && !match.isAmbiguous && match.suggestedValue) {
        return;
      }

      // If matched with medium confidence / ambiguous
      if (match && match.confidence === 'medium') {
        missing.push({
          id: `missing_${field.id}_${Date.now()}`,
          detectedField: field,
          websiteQuestion: field.label || field.placeholder || field.name,
          suggestedExistingInformation: {
            fieldKey: match.profilePath || 'profile.field',
            label: match.matchReason,
            value: match.suggestedValue,
            confidence: match.confidence
          },
          action: 'use_once'
        });
        return;
      }

      // If low confidence or not matched at all: Brand new information requested!
      // Check if we can deduce category and find any partial hints
      const inferredCategory = this.inferFieldCategory(field);
      missing.push({
        id: `missing_${field.id}_${Date.now()}`,
        detectedField: field,
        websiteQuestion: field.label || field.placeholder || field.name || 'Unknown Portal Question',
        suggestedExistingInformation: undefined,
        action: 'save_permanent'
      });
    });

    return missing;
  }

  /**
   * Heuristically infers the most appropriate category for a custom field.
   */
  public static inferFieldCategory(field: DetectedFormField): CustomFieldCategory {
    const text = `${field.name} ${field.label} ${field.placeholder}`.toLowerCase();

    if (text.includes('salary') || text.includes('compensation') || text.includes('rate') || text.includes('equity')) {
      return 'Compensation';
    }
    if (text.includes('visa') || text.includes('sponsor') || text.includes('citizen') || text.includes('authorized') || text.includes('clearance')) {
      return 'Work Authorization';
    }
    if (text.includes('legal') || text.includes('ssn') || text.includes('passport') || text.includes('tax')) {
      return 'Legal';
    }
    if (text.includes('school') || text.includes('degree') || text.includes('gpa') || text.includes('university') || text.includes('graduat')) {
      return 'Education';
    }
    if (text.includes('relocat') || text.includes('remote') || text.includes('hybrid') || text.includes('travel') || text.includes('shift')) {
      return 'Preferences';
    }
    if (text.includes('job') || text.includes('company') || text.includes('experience') || text.includes('notice') || text.includes('title')) {
      return 'Employment';
    }
    if (text.includes('phone') || text.includes('email') || text.includes('linkedin') || text.includes('github') || text.includes('url')) {
      return 'Contact';
    }

    return 'Additional Information';
  }

  /**
   * Converts a user-approved missing field input into a permanent CustomField entity.
   */
  public static createCustomFieldFromMissing(
    missing: MissingFormField,
    userValue: any
  ): CustomField {
    const field = missing.detectedField;
    const cleanKey = (field.name || field.id || field.label)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 40) || `custom_${Date.now()}`;

    const label = field.label || field.placeholder || field.name;

    // Detect datatype
    let dataType: CustomField['dataType'] = 'text';
    if (field.type === 'number') dataType = 'number';
    else if (field.type === 'date') dataType = 'date';
    else if (field.type === 'checkbox' || typeof userValue === 'boolean') dataType = 'boolean';
    else if (field.type === 'select-one' || field.options?.length) dataType = 'select';

    const category = this.inferFieldCategory(field);

    return {
      id: `custom_field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fieldKey: cleanKey,
      displayLabel: label,
      value: userValue,
      category,
      dataType,
      options: field.options?.map(o => o.value),
      source: 'detected_form',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userConsentStatus: 'approved',
      sensitivityClassification: category === 'Legal' || category === 'Compensation' ? 'confidential' : 'standard'
    };
  }

  /**
   * Saves user approved fields permanently to storage with explicit consent.
   */
  public static async processUserConsentedFields(
    completedMissingFields: Array<{
      missingField: MissingFormField;
      userValue: any;
      action: 'save_permanent' | 'use_once' | 'skip' | 'not_applicable';
    }>
  ): Promise<CustomField[]> {
    const fieldsToSave: CustomField[] = [];

    for (const item of completedMissingFields) {
      if (item.action === 'save_permanent' && item.userValue !== undefined && item.userValue !== '') {
        const customField = this.createCustomFieldFromMissing(item.missingField, item.userValue);
        fieldsToSave.push(customField);
      }
    }

    if (fieldsToSave.length > 0) {
      await StorageService.saveMultipleCustomFields(fieldsToSave);
    }

    return fieldsToSave;
  }
}
