import { UserProfile } from '@/profile/types';

export interface ResumeDocument {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  textContent: string;
  fileData?: ArrayBuffer; // Stored binary in IndexedDB so resume can be reopened across browser sessions
  isDefault: boolean;
  extractedProfile?: Partial<UserProfile>;
}

export interface ExtractedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  linkedIn?: string;
  github?: string;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
  }>;
  experience?: Array<{
    company: string;
    jobTitle: string;
    startDate: string;
    endDate?: string;
    responsibilities: string;
  }>;
  skills?: string[];
  projects?: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
}
