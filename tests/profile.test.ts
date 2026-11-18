import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileService } from '@/profile/ProfileService';
import { createEmptyProfile, UserProfile } from '@/profile/types';
import { calculateProfileCompleteness } from '@/profile/completeness';
import { StorageService } from '@/storage/StorageService';

describe('Module 1 & 10: Profile Management & Completeness', () => {
  beforeEach(async () => {
    await StorageService.clearAllData();
  });

  it('creates an empty profile with default structure', () => {
    const profile = createEmptyProfile();
    expect(profile.personal.firstName).toBe('');
    expect(profile.personal.country).toBe('');
    expect(profile.contact.primaryEmail).toBe('');
    expect(profile.education).toEqual([]);
    expect(profile.experience).toEqual([]);
    expect(profile.projects).toEqual([]);
    expect(profile.skills.programmingLanguages).toEqual([]);
  });

  it('saves and updates profile with auto-computed full name', async () => {
    const profile = createEmptyProfile();
    profile.personal.firstName = 'Jane';
    profile.personal.lastName = 'Doe';
    profile.contact.primaryEmail = 'jane@example.com';

    const saved = await ProfileService.saveProfile(profile);
    expect(saved.personal.fullName).toBe('Jane Doe');

    const retrieved = await ProfileService.getProfile();
    expect(retrieved.personal.firstName).toBe('Jane');
    expect(retrieved.personal.fullName).toBe('Jane Doe');
    expect(retrieved.contact.primaryEmail).toBe('jane@example.com');
  });

  it('resets profile to initial empty state', async () => {
    const profile = createEmptyProfile();
    profile.personal.firstName = 'Alex';
    await ProfileService.saveProfile(profile);

    const reset = await ProfileService.resetProfile();
    expect(reset.personal.firstName).toBe('');
    expect(reset.personal.fullName).toBe('');
  });

  it('calculates profile completeness dynamically', () => {
    const empty = createEmptyProfile();
    const emptyScore = calculateProfileCompleteness(empty, false);
    expect(emptyScore.overallScore).toBeLessThan(15);
    expect(emptyScore.recommendations.length).toBeGreaterThan(0);

    // Fill sample profile
    const filled: UserProfile = {
      ...empty,
      personal: {
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        country: 'US',
        address: '123 Main St',
        city: 'SF',
        state: 'CA',
        postalCode: '94105'
      },
      contact: {
        primaryEmail: 'jane@example.com',
        mobileNumber: '+919876543210',
        phoneCountryCode: '+91',
        phoneNationalNumber: '9876543210',
        phoneFullInternational: '+919876543210',
        linkedInUrl: 'https://linkedin.com/in/jane',
        gitHubUrl: 'https://github.com/jane',
        portfolioUrl: 'https://jane.dev'
      },
      education: [
        {
          id: '1',
          institution: 'UC Berkeley',
          degree: 'B.S.',
          fieldOfStudy: 'CS',
          startYear: '2018',
          graduationYear: '2022',
          currentStatus: 'completed'
        }
      ],
      experience: [
        {
          id: '1',
          company: 'Acme Inc',
          jobTitle: 'Engineer',
          employmentType: 'full_time',
          isCurrent: true,
          startDate: '2022-01',
          responsibilities: 'Coding'
        }
      ],
      skills: {
        programmingLanguages: ['TypeScript', 'Python'],
        frameworks: ['React', 'Node.js'],
        databases: ['PostgreSQL'],
        cloudPlatforms: ['AWS'],
        tools: ['Git', 'Docker'],
        softSkills: ['Teamwork'],
        certifications: []
      },
      projects: [
        {
          id: '1',
          title: 'App',
          description: 'Desc',
          technologies: ['React']
        }
      ]
    };

    const filledScore = calculateProfileCompleteness(filled, true);
    expect(filledScore.overallScore).toBeGreaterThanOrEqual(90);
    expect(filledScore.categories.personal.score).toBe(100);
    expect(filledScore.categories.contact.score).toBe(100);
    expect(filledScore.categories.education.score).toBe(100);
    expect(filledScore.categories.experience.score).toBe(100);
  });
});
