export type ApplicationStatus =
  | 'Interested'
  | 'Preparing'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface JobApplication {
  id: string;
  company: string;
  jobTitle: string;
  applicationUrl: string;
  dateDiscovered: string;
  dateApplied?: string;
  selectedResumeId?: string;
  status: ApplicationStatus;
  notes?: string;
  interviewDate?: string;
  salaryOffered?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}
