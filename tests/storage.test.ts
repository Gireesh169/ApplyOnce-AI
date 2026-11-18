import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '@/storage/StorageService';
import { FieldLearningService } from '@/memory/FieldLearningService';
import { createEmptyProfile } from '@/profile/types';

describe('Module 5 & 12: Universal Field Memory & Profile Export / Import', () => {
  beforeEach(async () => {
    await StorageService.clearAllData();
  });

  it('persists and recalls learned field mappings across sessions', async () => {
    await FieldLearningService.recordConfirmedMapping(
      'university_name',
      'Education Institution',
      'education.institution',
      'boards.greenhouse.io',
      true
    );

    const mappings = await FieldLearningService.getMappings();
    expect(mappings.length).toBe(1);
    expect(mappings[0].fieldSignature).toBe('university_name');
    expect(mappings[0].matchedProfilePath).toBe('education.institution');
    expect(mappings[0].websiteDomain).toBe('boards.greenhouse.io');
    // Security check: no candidate personal values stored in mapping dictionary
    expect((mappings[0] as any).value).toBeUndefined();
  });

  it('exports complete profile and configuration to JSON', async () => {
    const profile = createEmptyProfile();
    profile.personal.firstName = 'Test';
    profile.personal.lastName = 'User';
    await StorageService.saveProfile(profile);

    const json = await StorageService.exportAllData();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.profile.personal.firstName).toBe('Test');
  });

  it('validates and safely imports backup JSON data', async () => {
    const validBackup = JSON.stringify({
      version: '1.0.0',
      profile: {
        id: 'imported_profile',
        personal: {
          firstName: 'Imported',
          lastName: 'Candidate',
          fullName: 'Imported Candidate',
          country: 'Canada',
          address: '456 Queen St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M5V2A8'
        },
        contact: {
          primaryEmail: 'imported@test.com',
          mobileNumber: '555-9999'
        },
        education: [],
        experience: [],
        skills: {
          programmingLanguages: ['Go', 'Rust'],
          frameworks: [],
          databases: [],
          cloudPlatforms: [],
          tools: [],
          softSkills: [],
          certifications: []
        },
        projects: [],
        additional: {
          noticePeriod: '1 month',
          currentEmploymentStatus: 'employed',
          workAuthorization: 'yes',
          requiresSponsorship: 'no',
          willingnessToRelocate: false,
          workModePreference: 'remote'
        }
      }
    });

    const success = await StorageService.importAllData(validBackup);
    expect(success).toBe(true);

    const loaded = await StorageService.getProfile();
    expect(loaded.personal.firstName).toBe('Imported');
    expect(loaded.skills.programmingLanguages).toContain('Go');

    // Invalid schema check
    const invalidSuccess = await StorageService.importAllData('{ "broken": true }');
    expect(invalidSuccess).toBe(false);
  });
});
