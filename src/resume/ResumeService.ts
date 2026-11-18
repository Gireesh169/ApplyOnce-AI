import { ResumeStorageDB } from '@/storage/indexedDb';
import { ResumeDocument, ExtractedResumeData } from './types';
import { PDFExtractor } from './pdfExtractor';
import { StorageService } from '@/storage/StorageService';
import { UserProfile, syncStructuredPhone } from '@/profile/types';

export class ResumeService {
  /**
   * Uploads, extracts text and parsed data from a resume PDF file.
   * Stores binary fileData directly in IndexedDB for persistent reopening.
   */
  public static async uploadResume(file: File): Promise<ResumeDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const textContent = await PDFExtractor.extractTextFromPDF(arrayBuffer);
    const parsedData = PDFExtractor.parseResumeText(textContent);

    const existingResumes = await ResumeStorageDB.getAllResumes();
    const isFirst = existingResumes.length === 0;

    const structuredPhone = syncStructuredPhone({
      phoneCountryCode: parsedData.phoneCountryCode || '+91',
      phoneNationalNumber: parsedData.phoneNationalNumber,
      mobileNumber: parsedData.phone || ''
    });

    const resumeDoc: ResumeDocument = {
      id: `resume_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      textContent,
      fileData: arrayBuffer, // Stored in IndexedDB (not chrome.storage) to avoid quota issues
      isDefault: isFirst,
      extractedProfile: {
        personal: parsedData.name ? {
          firstName: parsedData.name.split(' ')[0] || '',
          lastName: parsedData.name.split(' ').slice(1).join(' ') || '',
          fullName: parsedData.name,
          country: 'India',
          address: '',
          city: '',
          state: '',
          postalCode: ''
        } : undefined,
        contact: {
          primaryEmail: parsedData.email || '',
          mobileNumber: structuredPhone.mobileNumber,
          phoneCountryCode: structuredPhone.phoneCountryCode,
          phoneNationalNumber: structuredPhone.phoneNationalNumber,
          phoneFullInternational: structuredPhone.phoneFullInternational,
          linkedInUrl: parsedData.linkedIn || '',
          gitHubUrl: parsedData.github || ''
        },
        skills: {
          programmingLanguages: parsedData.skills?.filter(s => ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust'].includes(s)) || [],
          frameworks: parsedData.skills?.filter(s => ['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Tailwind CSS'].includes(s)) || [],
          databases: parsedData.skills?.filter(s => ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'].includes(s)) || [],
          cloudPlatforms: parsedData.skills?.filter(s => ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes'].includes(s)) || [],
          tools: parsedData.skills?.filter(s => ['Git', 'GitHub Actions', 'Jest', 'Vitest'].includes(s)) || [],
          softSkills: ['Problem Solving', 'Communication'],
          certifications: []
        }
      }
    };

    await ResumeStorageDB.saveResume(resumeDoc);
    return resumeDoc;
  }

  /**
   * Retrieves all stored resumes from IndexedDB.
   */
  public static async getResumes(): Promise<ResumeDocument[]> {
    return await ResumeStorageDB.getAllResumes();
  }

  /**
   * Deletes a resume by ID from IndexedDB.
   */
  public static async deleteResume(id: string): Promise<void> {
    await ResumeStorageDB.deleteResume(id);
  }

  /**
   * Sets a resume as the default resume.
   */
  public static async setDefaultResume(id: string): Promise<void> {
    const resumes = await ResumeStorageDB.getAllResumes();
    for (const r of resumes) {
      r.isDefault = (r.id === id);
      await ResumeStorageDB.saveResume(r);
    }
  }

  /**
   * Creates a browser Blob URL from stored resume ArrayBuffer so the PDF can be viewed or downloaded.
   */
  public static createResumeBlobUrl(resume: ResumeDocument): string | null {
    if (!resume.fileData) return null;
    try {
      const blob = new Blob([resume.fileData], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Failed to create Blob URL for resume:', e);
      return null;
    }
  }

  /**
   * Applies approved resume extracted data into the user profile with explicit user consent.
   */
  public static async applyApprovedResumeDataToProfile(
    extracted: ExtractedResumeData,
    approvedSections: {
      name?: boolean;
      contact?: boolean;
      skills?: boolean;
      education?: boolean;
      experience?: boolean;
      projects?: boolean;
    }
  ): Promise<UserProfile> {
    const profile = await StorageService.getProfile();

    if (approvedSections.name && extracted.name) {
      const parts = extracted.name.split(' ');
      profile.personal.firstName = parts[0] || profile.personal.firstName;
      profile.personal.lastName = parts.slice(1).join(' ') || profile.personal.lastName;
      profile.personal.fullName = extracted.name;
    }

    if (approvedSections.contact) {
      if (extracted.email) profile.contact.primaryEmail = extracted.email;
      if (extracted.phone) {
        const synced = syncStructuredPhone({
          phoneCountryCode: extracted.phoneCountryCode || profile.contact.phoneCountryCode,
          phoneNationalNumber: extracted.phoneNationalNumber || profile.contact.phoneNationalNumber,
          mobileNumber: extracted.phone
        });
        profile.contact.phoneCountryCode = synced.phoneCountryCode;
        profile.contact.phoneNationalNumber = synced.phoneNationalNumber;
        profile.contact.phoneFullInternational = synced.phoneFullInternational;
        profile.contact.mobileNumber = synced.mobileNumber;
      }
      if (extracted.linkedIn) profile.contact.linkedInUrl = extracted.linkedIn;
      if (extracted.github) profile.contact.gitHubUrl = extracted.github;
    }

    if (approvedSections.skills && extracted.skills && extracted.skills.length > 0) {
      const currentSkills = new Set([
        ...profile.skills.programmingLanguages,
        ...profile.skills.frameworks,
        ...profile.skills.databases,
        ...profile.skills.cloudPlatforms,
        ...profile.skills.tools
      ]);

      for (const skill of extracted.skills) {
        if (!currentSkills.has(skill)) {
          if (['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP'].includes(skill)) {
            profile.skills.programmingLanguages.push(skill);
          } else if (['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Tailwind CSS'].includes(skill)) {
            profile.skills.frameworks.push(skill);
          } else if (['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite'].includes(skill)) {
            profile.skills.databases.push(skill);
          } else if (['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes'].includes(skill)) {
            profile.skills.cloudPlatforms.push(skill);
          } else {
            profile.skills.tools.push(skill);
          }
        }
      }
    }

    if (approvedSections.education && extracted.education && extracted.education.length > 0) {
      for (const edu of extracted.education) {
        profile.education.push({
          id: `edu_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startYear: '',
          graduationYear: edu.graduationYear || '2024',
          currentStatus: 'completed'
        });
      }
    }

    if (approvedSections.experience && extracted.experience && extracted.experience.length > 0) {
      for (const exp of extracted.experience) {
        profile.experience.push({
          id: `exp_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          company: exp.company,
          jobTitle: exp.jobTitle,
          employmentType: 'full_time',
          isCurrent: !exp.endDate,
          startDate: exp.startDate,
          endDate: exp.endDate,
          responsibilities: exp.responsibilities
        });
      }
    }

    if (approvedSections.projects && extracted.projects && extracted.projects.length > 0) {
      for (const proj of extracted.projects) {
        profile.projects.push({
          id: `proj_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: proj.title,
          description: proj.description,
          technologies: proj.technologies
        });
      }
    }

    await StorageService.saveProfile(profile);
    return profile;
  }
}
