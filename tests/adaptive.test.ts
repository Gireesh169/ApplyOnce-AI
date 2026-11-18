import { describe, it, expect, beforeEach } from 'vitest';
import { MissingFieldService } from '@/adaptive/MissingFieldService';
import { StorageService } from '@/storage/StorageService';
import { DetectedFormField, MatchedFormField, MissingFormField, CustomField } from '@/adaptive/types';
import { createEmptyProfile } from '@/profile/types';

describe('Module 2 & 3: Adaptive Profile Intelligence & Missing Information Detection', () => {
  beforeEach(async () => {
    await StorageService.clearAllData();
  });

  it('infers field categories accurately', () => {
    const salaryField: DetectedFormField = {
      id: 'sal',
      name: 'desired_salary',
      type: 'text',
      selector: '#sal',
      label: 'Target Salary',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };
    expect(MissingFieldService.inferFieldCategory(salaryField)).toBe('Compensation');

    const clearanceField: DetectedFormField = {
      id: 'sec',
      name: 'security_clearance',
      type: 'text',
      selector: '#sec',
      label: 'Active Clearance',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };
    expect(MissingFieldService.inferFieldCategory(clearanceField)).toBe('Work Authorization');

    const relocateField: DetectedFormField = {
      id: 'reloc',
      name: 'willing_to_relocate',
      type: 'text',
      selector: '#reloc',
      label: 'Relocation Preferences',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };
    expect(MissingFieldService.inferFieldCategory(relocateField)).toBe('Preferences');
  });

  it('detects missing fields from unknown portal questions', () => {
    const detected: DetectedFormField[] = [
      {
        id: 'why_us',
        name: 'why_company',
        type: 'textarea',
        selector: '#why_us',
        label: 'Why do you want to join our team?',
        placeholder: '',
        ariaLabel: '',
        autocomplete: '',
        currentValue: '',
        required: true
      }
    ];

    const matched: MatchedFormField[] = [
      {
        detectedField: detected[0],
        suggestedValue: '',
        confidence: 'low',
        confidenceScore: 0.1,
        matchReason: 'No match',
        isAmbiguous: true,
        isExact: false
      }
    ];

    const missing = MissingFieldService.identifyMissingAndAmbiguousFields(
      detected,
      matched,
      createEmptyProfile(),
      []
    );

    expect(missing.length).toBe(1);
    expect(missing[0].websiteQuestion).toBe('Why do you want to join our team?');
  });

  it('creates custom fields only after explicit user consent', async () => {
    const missing: MissingFormField = {
      id: 'missing_1',
      detectedField: {
        id: 'clearance',
        name: 'security_clearance',
        type: 'text',
        selector: '#clearance',
        label: 'Security Clearance Level',
        placeholder: '',
        ariaLabel: '',
        autocomplete: '',
        currentValue: '',
        required: false
      },
      websiteQuestion: 'Security Clearance Level',
      action: 'save_permanent'
    };

    const userConsentedItems = [
      {
        missingField: missing,
        userValue: 'Top Secret (TS/SCI)',
        action: 'save_permanent' as const
      }
    ];

    const saved = await MissingFieldService.processUserConsentedFields(userConsentedItems);
    expect(saved.length).toBe(1);
    expect(saved[0].fieldKey).toBe('security_clearance');
    expect(saved[0].value).toBe('Top Secret (TS/SCI)');
    expect(saved[0].category).toBe('Work Authorization');

    const storedFields = await StorageService.getCustomFields();
    expect(storedFields.length).toBe(1);
    expect(storedFields[0].value).toBe('Top Secret (TS/SCI)');
  });

  it('does not permanently save fields marked as use_once or skip', async () => {
    const missing: MissingFormField = {
      id: 'missing_2',
      detectedField: {
        id: 'one_time',
        name: 'referral_name',
        type: 'text',
        selector: '#one_time',
        label: 'Referral Name',
        placeholder: '',
        ariaLabel: '',
        autocomplete: '',
        currentValue: '',
        required: false
      },
      websiteQuestion: 'Referral Name',
      action: 'use_once'
    };

    const userConsentedItems = [
      {
        missingField: missing,
        userValue: 'John Smith',
        action: 'use_once' as const
      }
    ];

    const saved = await MissingFieldService.processUserConsentedFields(userConsentedItems);
    expect(saved.length).toBe(0);

    const storedFields = await StorageService.getCustomFields();
    expect(storedFields.length).toBe(0);
  });
});
