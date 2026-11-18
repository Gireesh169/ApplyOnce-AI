import { StorageService } from '@/storage/StorageService';
import { JobApplication, ApplicationStatus } from './types';

export class ApplicationTrackerService {
  public static async getApplications(): Promise<JobApplication[]> {
    return await StorageService.getApplications();
  }

  public static async addApplication(appData: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> {
    const newApp: JobApplication = {
      ...appData,
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await StorageService.saveApplication(newApp);
    return newApp;
  }

  public static async updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication | null> {
    const apps = await StorageService.getApplications();
    const existing = apps.find(a => a.id === id);
    if (!existing) return null;

    const updated: JobApplication = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await StorageService.saveApplication(updated);
    return updated;
  }

  public static async updateStatus(id: string, newStatus: ApplicationStatus): Promise<JobApplication | null> {
    const updates: Partial<JobApplication> = { status: newStatus };
    if (newStatus === 'Applied') {
      updates.dateApplied = new Date().toISOString().split('T')[0];
    }
    return await this.updateApplication(id, updates);
  }

  public static async deleteApplication(id: string): Promise<void> {
    await StorageService.deleteApplication(id);
  }

  public static filterAndSortApplications(
    apps: JobApplication[],
    searchQuery: string = '',
    statusFilter?: ApplicationStatus | 'All',
    sortBy: 'date_desc' | 'date_asc' | 'company' = 'date_desc'
  ): JobApplication[] {
    let result = [...apps];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.company.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'company') {
        return a.company.localeCompare(b.company);
      }
      return 0;
    });

    return result;
  }
}
