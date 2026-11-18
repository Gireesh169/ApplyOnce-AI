import { describe, it, expect, beforeEach } from 'vitest';
import { ApplicationTrackerService } from '@/applications/ApplicationTrackerService';
import { StorageService } from '@/storage/StorageService';
import { JobApplication } from '@/applications/types';

describe('Module 9: Job Application Tracker', () => {
  beforeEach(async () => {
    await StorageService.clearAllData();
  });

  it('adds and retrieves job applications with stable IDs', async () => {
    const app = await ApplicationTrackerService.addApplication({
      company: 'Stripe',
      jobTitle: 'Full-Stack Engineer',
      applicationUrl: 'https://stripe.com/jobs/123',
      dateDiscovered: '2025-01-10',
      status: 'Interested',
      notes: 'Initial bookmark'
    });

    expect(app.id).toBeDefined();
    expect(app.company).toBe('Stripe');

    const all = await ApplicationTrackerService.getApplications();
    expect(all.length).toBe(1);
    expect(all[0].company).toBe('Stripe');
  });

  it('updates application status and auto-records applied date on Applied status', async () => {
    const app = await ApplicationTrackerService.addApplication({
      company: 'Airbnb',
      jobTitle: 'Frontend Engineer',
      applicationUrl: 'https://airbnb.com/careers/456',
      dateDiscovered: '2025-01-10',
      status: 'Interested'
    });

    const updated = await ApplicationTrackerService.updateStatus(app.id, 'Applied');
    expect(updated?.status).toBe('Applied');
    expect(updated?.dateApplied).toBeDefined();
  });

  it('filters and searches applications by query and status', async () => {
    const app1: JobApplication = {
      id: '1',
      company: 'Google',
      jobTitle: 'Staff Software Engineer',
      applicationUrl: '',
      dateDiscovered: '2025-01-01',
      status: 'Applied',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01'
    };
    const app2: JobApplication = {
      id: '2',
      company: 'Meta',
      jobTitle: 'Product Engineer',
      applicationUrl: '',
      dateDiscovered: '2025-01-02',
      status: 'Interview',
      createdAt: '2025-01-02',
      updatedAt: '2025-01-02'
    };

    const list = [app1, app2];

    const searchResult = ApplicationTrackerService.filterAndSortApplications(list, 'Google');
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].company).toBe('Google');

    const statusResult = ApplicationTrackerService.filterAndSortApplications(list, '', 'Interview');
    expect(statusResult.length).toBe(1);
    expect(statusResult[0].company).toBe('Meta');
  });
});
