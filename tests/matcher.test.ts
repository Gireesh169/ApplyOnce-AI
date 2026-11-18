import { describe, it, expect } from 'vitest';
import { FieldMatcher } from '@/autofill/FieldMatcher';
import { UserProfile, createEmptyProfile } from '@/profile/types';
import { DetectedFormField } from '@/adaptive/types';

describe('Module 4: Universal Field Matching Engine & Strict Disambiguation', () => {
  const profile: UserProfile = {
    ...createEmptyProfile(),
    personal: {
      firstName: 'Alex',
      lastName: 'Morgan',
      fullName: 'Alex Morgan',
      legalFirstName: 'Alexander',
      legalLastName: 'Morgan',
      legalFullName: 'Alexander Michael Morgan',
      preferredName: 'Lex',
      country: 'United States',
      address: '500 Market St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105'
    },
    contact: {
      primaryEmail: 'alex@example.com',
      mobileNumber: '+919876543210',
      phoneCountryCode: '+91',
      phoneNationalNumber: '9876543210',
      phoneFullInternational: '+919876543210',
      linkedInUrl: 'https://linkedin.com/in/alexmorgan',
      gitHubUrl: 'https://github.com/alexmorgan',
      portfolioUrl: 'https://alex.dev'
    },
    education: [
      {
        id: '1',
        institution: 'UC Berkeley',
        degree: "Bachelor's Degree",
        fieldOfStudy: 'Computer Science',
        startYear: '2016',
        graduationYear: '2020',
        currentStatus: 'completed'
      }
    ],
    experience: [
      {
        id: '1',
        company: 'Acme Corp',
        jobTitle: 'Senior Software Engineer',
        employmentType: 'full_time',
        isCurrent: true,
        startDate: '2022',
        responsibilities: 'Lead frontend architect'
      }
    ],
    additional: {
      noticePeriod: '2 weeks',
      currentEmploymentStatus: 'employed',
      expectedSalary: '150000',
      currentSalary: '135000',
      workAuthorization: 'yes',
      requiresSponsorship: 'no',
      willingnessToRelocate: true,
      workModePreference: 'hybrid'
    }
  };

  it('matches exact email field with high confidence via autocomplete or name', () => {
    const field: DetectedFormField = {
      id: 'email',
      name: 'email',
      type: 'email',
      selector: '#email',
      label: 'Email Address *',
      placeholder: 'you@example.com',
      ariaLabel: '',
      autocomplete: 'email',
      currentValue: '',
      required: true
    };

    const match = FieldMatcher.matchField(field, profile);
    expect(match.confidence).toBe('high');
    expect(match.suggestedValue).toBe('alex@example.com');
    expect(match.isAmbiguous).toBe(false);
  });

  it('strictly distinguishes Legal First Name from casual First Name', () => {
    const legalField: DetectedFormField = {
      id: 'legal_first_name',
      name: 'legal_first_name',
      type: 'text',
      selector: '#legal_first_name',
      label: 'Legal First Name (as shown on passport)',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: true
    };

    const match = FieldMatcher.matchField(legalField, profile);
    expect(match.confidence).toBe('high');
    expect(match.suggestedValue).toBe('Alexander'); // Legal first name, not casual 'Alex'
    expect(match.profilePath).toBe('personal.legalFirstName');
  });

  it('flags legal name as ambiguous if candidate only has standard casual name', () => {
    const casualOnlyProfile: UserProfile = {
      ...profile,
      personal: {
        ...profile.personal,
        legalFirstName: '',
        legalFullName: ''
      }
    };

    const legalField: DetectedFormField = {
      id: 'legal_first_name',
      name: 'legal_first_name',
      type: 'text',
      selector: '#legal_first_name',
      label: 'Legal First Name',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: true
    };

    const match = FieldMatcher.matchField(legalField, casualOnlyProfile);
    expect(match.isAmbiguous).toBe(true);
    expect(match.confidence).toBe('medium');
    expect(match.matchReason).toContain('Legal first name requested; only casual first name found');
  });

  it('strictly isolates Expected Salary from Current Salary', () => {
    const expectedField: DetectedFormField = {
      id: 'expected_sal',
      name: 'expected_salary',
      type: 'number',
      selector: '#expected_sal',
      label: 'Expected Salary (Annual USD)',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };

    const expMatch = FieldMatcher.matchField(expectedField, profile);
    expect(expMatch.suggestedValue).toBe('150000');
    expect(expMatch.profilePath).toBe('additional.expectedSalary');

    const currentField: DetectedFormField = {
      id: 'current_sal',
      name: 'current_salary',
      type: 'number',
      selector: '#current_sal',
      label: 'Current Compensation',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };

    const curMatch = FieldMatcher.matchField(currentField, profile);
    expect(curMatch.suggestedValue).toBe('135000');
    expect(curMatch.profilePath).toBe('additional.currentSalary');
  });

  it('matches university / education fields correctly', () => {
    const schoolField: DetectedFormField = {
      id: 'college',
      name: 'institution',
      type: 'text',
      selector: '#college',
      label: 'College or University',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: true
    };

    const match = FieldMatcher.matchField(schoolField, profile);
    expect(match.confidence).toBe('high');
    expect(match.suggestedValue).toBe('UC Berkeley');
  });

  it('returns low confidence when field is unknown', () => {
    const novelField: DetectedFormField = {
      id: 'pet_name',
      name: 'favorite_animal',
      type: 'text',
      selector: '#pet_name',
      label: 'What is your favorite animal?',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };

    const match = FieldMatcher.matchField(novelField, profile);
    expect(match.confidence).toBe('low');
    expect(match.confidenceScore).toBeLessThan(0.5);
  });

  it('matches structured phone fields and strictly isolates unrelated numeric inputs', () => {
    // 1. Separate country code field
    const countryCodeField: DetectedFormField = {
      id: 'dial_code',
      name: 'country_code',
      type: 'select',
      selector: '#dial_code',
      label: 'Country Dial Code',
      placeholder: '',
      ariaLabel: '',
      autocomplete: 'tel-country-code',
      currentValue: '',
      required: true
    };
    const codeMatch = FieldMatcher.matchField(countryCodeField, profile);
    expect(codeMatch.profilePath).toBe('contact.phoneCountryCode');
    expect(codeMatch.suggestedValue).toBe('+91');

    // 2. 10-digit national number field
    const nationalPhoneField: DetectedFormField = {
      id: 'mobile_num',
      name: 'phone_national',
      type: 'tel',
      selector: '#mobile_num',
      label: '10-Digit Mobile Number',
      placeholder: 'Enter 10 digits',
      ariaLabel: '',
      autocomplete: 'tel-national',
      currentValue: '',
      required: true
    };
    const natMatch = FieldMatcher.matchField(nationalPhoneField, profile);
    expect(natMatch.suggestedValue).toBe('9876543210');

    // 3. Strict guard: Unrelated numeric fields (OTP, salary, pincode, age) must never match phone
    const otpField: DetectedFormField = {
      id: 'otp',
      name: 'otp_verification',
      type: 'number',
      selector: '#otp',
      label: 'Enter One Time Password (OTP)',
      placeholder: '6-digit code',
      ariaLabel: '',
      autocomplete: 'one-time-code',
      currentValue: '',
      required: true
    };
    const otpMatch = FieldMatcher.matchField(otpField, profile);
    expect(otpMatch.confidence).toBe('low');
    expect(otpMatch.profilePath || '').not.toContain('contact.phone');
    expect(otpMatch.profilePath || '').not.toContain('contact.mobile');

    const salaryField: DetectedFormField = {
      id: 'salary',
      name: 'expected_salary',
      type: 'number',
      selector: '#salary',
      label: 'Salary Expectation',
      placeholder: '',
      ariaLabel: '',
      autocomplete: '',
      currentValue: '',
      required: false
    };
    const salaryMatch = FieldMatcher.matchField(salaryField, profile);
    expect(salaryMatch.profilePath).toBe('additional.expectedSalary');
  });
});
