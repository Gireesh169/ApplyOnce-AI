import { StorageService } from '@/storage/StorageService';
import { UserProfile, createEmptyProfile, syncStructuredPhone } from './types';
import { calculateProfileCompleteness, ProfileCompletenessReport } from './completeness';
import { ResumeStorageDB } from '@/storage/indexedDb';

export const ProfileService = {
  async getProfile(): Promise<UserProfile> {
    const profile = await StorageService.getProfile();
    // Ensure phone fields are structured
    if (!profile.contact.phoneCountryCode || !profile.contact.phoneNationalNumber) {
      const synced = syncStructuredPhone(profile.contact);
      profile.contact = {
        ...profile.contact,
        ...synced
      };
    }
    return profile;
  },

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    // Auto-compute full name if empty
    if (!profile.personal.fullName.trim()) {
      const parts = [
        profile.personal.firstName,
        profile.personal.middleName,
        profile.personal.lastName
      ].filter(Boolean);
      profile.personal.fullName = parts.join(' ').trim();
    }

    // Auto-compute legal full name if empty
    if (!profile.personal.legalFullName?.trim() && (profile.personal.legalFirstName || profile.personal.legalLastName)) {
      const legalParts = [
        profile.personal.legalFirstName,
        profile.personal.legalMiddleName,
        profile.personal.legalLastName
      ].filter(Boolean);
      profile.personal.legalFullName = legalParts.join(' ').trim();
    }

    // Sync structured phone representation
    const phoneData = syncStructuredPhone(profile.contact);
    profile.contact = {
      ...profile.contact,
      ...phoneData
    };

    await StorageService.saveProfile(profile);
    return profile;
  },

  async resetProfile(): Promise<UserProfile> {
    const fresh = createEmptyProfile();
    await StorageService.saveProfile(fresh);
    return fresh;
  },

  async getCompleteness(): Promise<ProfileCompletenessReport> {
    const profile = await this.getProfile();
    let hasResume = false;
    try {
      const resumes = await ResumeStorageDB.getAllResumes();
      hasResume = resumes.length > 0;
    } catch {
      hasResume = false;
    }
    return calculateProfileCompleteness(profile, hasResume);
  },

  // Helper to load realistic starter template for the user when testing
  async loadSampleProfile(): Promise<UserProfile> {
    const sample: UserProfile = {
      id: 'profile_starter',
      personal: {
        firstName: 'Alex',
        middleName: 'M.',
        lastName: 'Morgan',
        fullName: 'Alex M. Morgan',
        legalFirstName: 'Alexander',
        legalMiddleName: 'Michael',
        legalLastName: 'Morgan',
        legalFullName: 'Alexander Michael Morgan',
        preferredName: 'Alex',
        previousNames: '',
        dateOfBirth: '1998-05-14',
        gender: 'Prefer not to say',
        nationality: 'United States',
        country: 'United States',
        address: '500 Market Street, Suite 400',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105'
      },
      contact: {
        primaryEmail: 'alex.morgan@example.com',
        secondaryEmail: 'alex.dev@gmail.com',
        mobileNumber: '+919876543210',
        phoneCountryCode: '+91',
        phoneNationalNumber: '9876543210',
        phoneFullInternational: '+919876543210',
        alternatePhoneNumber: '',
        linkedInUrl: 'https://linkedin.com/in/alexmorgan-dev',
        gitHubUrl: 'https://github.com/alexmorgan',
        portfolioUrl: 'https://alexmorgan.dev',
        personalWebsite: 'https://alexmorgan.dev'
      },
      education: [
        {
          id: 'edu_1',
          institution: 'University of California, Berkeley',
          university: 'UC Berkeley',
          degree: "Bachelor's Degree",
          fieldOfStudy: 'Computer Science',
          branch: 'EECS',
          specialization: 'Software Systems',
          cgpa: '3.85',
          percentage: '',
          startYear: '2016',
          graduationYear: '2020',
          currentStatus: 'completed'
        }
      ],
      experience: [
        {
          id: 'exp_1',
          company: 'Acme Cloud Technologies',
          jobTitle: 'Senior Full-Stack Engineer',
          employmentType: 'full_time',
          isCurrent: true,
          startDate: '2022-03',
          endDate: '',
          responsibilities: 'Architecting scalable React and Node.js microservices serving 2M+ active users. Leading frontend performance initiatives.',
          achievements: 'Reduced API response times by 35% and improved bundle load time by 45%.',
          location: 'San Francisco, CA'
        },
        {
          id: 'exp_2',
          company: 'NextGen Innovations',
          jobTitle: 'Software Engineer',
          employmentType: 'full_time',
          isCurrent: false,
          startDate: '2020-07',
          endDate: '2022-02',
          responsibilities: 'Developed responsive web applications with TypeScript, React, and GraphQL backend integrations.',
          achievements: 'Built end-to-end testing suite increasing code coverage to 92%.',
          location: 'San Jose, CA'
        }
      ],
      skills: {
        programmingLanguages: ['TypeScript', 'JavaScript', 'Python', 'Java', 'SQL'],
        frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Vite'],
        databases: ['PostgreSQL', 'MongoDB', 'Redis'],
        cloudPlatforms: ['AWS', 'GCP', 'Docker', 'Kubernetes'],
        tools: ['Git', 'GitHub Actions', 'Jest', 'Vitest', 'Postman'],
        softSkills: ['Team Leadership', 'Agile/Scrum', 'System Design', 'Communication'],
        certifications: ['AWS Certified Solutions Architect']
      },
      projects: [
        {
          id: 'proj_1',
          title: 'ApplyOnce AI Assistant',
          description: 'A browser extension for intelligent job application autofilling with privacy-first local storage and adaptive profile learning.',
          technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Chrome Extension MV3'],
          projectUrl: 'https://applyonce.ai',
          githubUrl: 'https://github.com/alexmorgan/applyonce-ai',
          role: 'Lead Architect & Developer',
          achievements: 'Implemented scoring matching engine with 95%+ field accuracy.'
        },
        {
          id: 'proj_2',
          title: 'DevPulse Analytics',
          description: 'Developer productivity metrics tracker aggregating GitHub commit frequency and PR velocity.',
          technologies: ['Node.js', 'GraphQL', 'PostgreSQL', 'Chart.js'],
          githubUrl: 'https://github.com/alexmorgan/devpulse',
          role: 'Full-Stack Developer'
        }
      ],
      additional: {
        noticePeriod: '2 weeks',
        currentEmploymentStatus: 'employed',
        expectedSalary: '145000',
        currentSalary: '130000',
        workAuthorization: 'yes',
        requiresSponsorship: 'no',
        willingnessToRelocate: true,
        preferredWorkLocation: 'San Francisco, CA or Remote',
        workModePreference: 'hybrid',
        earliestStartDate: '2025-01-15',
        additionalNotes: 'Passionate about frontend architecture and developer tooling.'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await StorageService.saveProfile(sample);
    return sample;
  }
};
