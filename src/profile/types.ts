export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  legalFirstName?: string;
  legalMiddleName?: string;
  legalLastName?: string;
  legalFullName?: string;
  preferredName?: string;
  previousNames?: string;
  dateOfBirth?: string;
  gender?: string; // Optional & sensitive
  nationality?: string;
  country: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ContactInfo {
  primaryEmail: string;
  secondaryEmail?: string;
  mobileNumber: string; // Keep for backwards compatibility
  phoneCountryCode: string; // e.g. "+91"
  phoneNationalNumber: string; // e.g. "9876543210"
  phoneFullInternational: string; // e.g. "+919876543210"
  alternatePhoneNumber?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  portfolioUrl?: string;
  personalWebsite?: string;
}

export interface EducationRecord {
  id: string;
  institution: string;
  university?: string;
  degree: string;
  fieldOfStudy: string;
  branch?: string;
  specialization?: string;
  cgpa?: string;
  percentage?: string;
  startYear: string;
  graduationYear: string;
  currentStatus: 'completed' | 'in_progress' | 'dropped';
}

export interface ExperienceRecord {
  id: string;
  company: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'internship' | 'contract' | 'freelance';
  isCurrent: boolean;
  startDate: string;
  endDate?: string;
  responsibilities: string;
  achievements?: string;
  location?: string;
}

export interface SkillCategory {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloudPlatforms: string[];
  tools: string[];
  softSkills: string[];
  certifications: string[];
}

export interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  projectUrl?: string;
  githubUrl?: string;
  role?: string;
  achievements?: string;
}

export interface AdditionalInfo {
  noticePeriod: string;
  currentEmploymentStatus: 'employed' | 'unemployed' | 'student' | 'notice_period';
  expectedSalary?: string;
  currentSalary?: string;
  workAuthorization: string; // 'yes' | 'no'
  requiresSponsorship: string; // 'yes' | 'no'
  willingnessToRelocate: boolean;
  preferredWorkLocation?: string;
  workModePreference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  earliestStartDate?: string;
  additionalNotes?: string;
}

export interface UserProfile {
  id: string;
  personal: PersonalInfo;
  contact: ContactInfo;
  education: EducationRecord[];
  experience: ExperienceRecord[];
  skills: SkillCategory;
  projects: ProjectRecord[];
  additional: AdditionalInfo;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalizes phone numbers into structured country code, national number, and full international representation.
 */
export function syncStructuredPhone(
  contact: Partial<ContactInfo>
): {
  phoneCountryCode: string;
  phoneNationalNumber: string;
  phoneFullInternational: string;
  mobileNumber: string;
} {
  let code = (contact.phoneCountryCode || '+91').trim();
  if (!code.startsWith('+')) {
    code = `+${code.replace(/\D/g, '') || '91'}`;
  }

  let national = (contact.phoneNationalNumber || '').replace(/\D/g, '').trim();

  // If national number not explicitly provided, extract from mobileNumber
  if (!national && contact.mobileNumber) {
    const raw = contact.mobileNumber.trim();
    if (raw.startsWith('+')) {
      const match = raw.match(/^\+(\d{1,3})\s*(\d+)$/);
      if (match) {
        code = `+${match[1]}`;
        national = match[2];
      } else {
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length >= 12) {
          code = '+91';
          national = digits.substring(2);
        } else if (digits.startsWith('1') && digits.length === 11) {
          code = '+1';
          national = digits.substring(1);
        } else {
          national = digits.slice(-10);
        }
      }
    } else {
      national = raw.replace(/\D/g, '').slice(-10);
    }
  }

  const cleanNational = national.slice(-10); // Standard 10-digit mobile number
  const fullIntl = `${code}${cleanNational}`;

  return {
    phoneCountryCode: code,
    phoneNationalNumber: cleanNational,
    phoneFullInternational: fullIntl,
    mobileNumber: fullIntl
  };
}

export const createEmptyProfile = (): UserProfile => ({
  id: 'user_profile_default',
  personal: {
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    legalFirstName: '',
    legalMiddleName: '',
    legalLastName: '',
    legalFullName: '',
    preferredName: '',
    previousNames: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    country: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  },
  contact: {
    primaryEmail: '',
    secondaryEmail: '',
    mobileNumber: '',
    phoneCountryCode: '+91',
    phoneNationalNumber: '',
    phoneFullInternational: '',
    alternatePhoneNumber: '',
    linkedInUrl: '',
    gitHubUrl: '',
    portfolioUrl: '',
    personalWebsite: ''
  },
  education: [],
  experience: [],
  skills: {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    cloudPlatforms: [],
    tools: [],
    softSkills: [],
    certifications: []
  },
  projects: [],
  additional: {
    noticePeriod: '',
    currentEmploymentStatus: 'employed',
    expectedSalary: '',
    currentSalary: '',
    workAuthorization: 'yes',
    requiresSponsorship: 'no',
    willingnessToRelocate: false,
    preferredWorkLocation: '',
    workModePreference: 'hybrid',
    earliestStartDate: '',
    additionalNotes: ''
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
