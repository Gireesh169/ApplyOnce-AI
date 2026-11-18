import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '@/applications/types';
import { ApplicationTrackerService } from '@/applications/ApplicationTrackerService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Briefcase,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  Pencil,
  Trash2,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const ApplicationTrackerView: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Form State
  const [company, setCompany] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [applicationUrl, setApplicationUrl] = useState<string>('');
  const [status, setStatus] = useState<ApplicationStatus>('Interested');
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [salaryOffered, setSalaryOffered] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadApplications = async () => {
    setLoading(true);
    const list = await ApplicationTrackerService.getApplications();
    setApplications(list);
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const openAddModal = () => {
    setEditingApp(null);
    setCompany('');
    setJobTitle('');
    setApplicationUrl('');
    setStatus('Interested');
    setInterviewDate('');
    setSalaryOffered('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setCompany(app.company);
    setJobTitle(app.jobTitle);
    setApplicationUrl(app.applicationUrl);
    setStatus(app.status);
    setInterviewDate(app.interviewDate || '');
    setSalaryOffered(app.salaryOffered || '');
    setNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingApp) {
      await ApplicationTrackerService.updateApplication(editingApp.id, {
        company,
        jobTitle,
        applicationUrl,
        status,
        interviewDate: interviewDate.trim() || undefined,
        salaryOffered: salaryOffered.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      await ApplicationTrackerService.addApplication({
        company,
        jobTitle,
        applicationUrl,
        dateDiscovered: new Date().toISOString().split('T')[0],
        status,
        interviewDate: interviewDate.trim() || undefined,
        salaryOffered: salaryOffered.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    setIsModalOpen(false);
    await loadApplications();
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    await ApplicationTrackerService.updateStatus(id, newStatus);
    await loadApplications();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tracked job application?')) {
      await ApplicationTrackerService.deleteApplication(id);
      await loadApplications();
    }
  };

  const filteredApps = ApplicationTrackerService.filterAndSortApplications(
    applications,
    searchQuery,
    statusFilter,
    'date_desc'
  );

  const getStatusBadgeVariant = (st: ApplicationStatus): 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' => {
    switch (st) {
      case 'Interested': return 'gray';
      case 'Preparing': return 'blue';
      case 'Applied': return 'blue';
      case 'Assessment': return 'yellow';
      case 'Interview': return 'purple';
      case 'Offer': return 'green';
      case 'Rejected': return 'red';
      case 'Withdrawn': return 'gray';
      default: return 'gray';
    }
  };

  const statusOptions: ApplicationStatus[] = [
    'Interested',
    'Preparing',
    'Applied',
    'Assessment',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn'
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Application Tracker</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and advance applications from discovery to offer.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Application
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, job title, notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-44 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Statuses ({applications.length})</option>
            {statusOptions.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading applications...</div>
      ) : filteredApps.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No job applications tracked yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Track applications you submit across career sites so you always have a central audit trail.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Track First Application
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <Card key={app.id} className="hover:border-blue-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{app.company}</h4>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">{app.jobTitle}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Discovered: {app.dateDiscovered}</span>
                    {app.dateApplied && <span>Applied: <strong>{app.dateApplied}</strong></span>}
                    {app.interviewDate && (
                      <span className="text-purple-600 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Interview: {app.interviewDate}
                      </span>
                    )}
                    {app.applicationUrl && (
                      <a
                        href={app.applicationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Link
                      </a>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-xs text-slate-600 pt-1 italic">
                      "{app.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Status Dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {statusOptions.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                    {app.status}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(app)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingApp ? 'Edit Tracked Application' : 'Track New Job Application'}
        subtitle="Manage timeline, status changes, and interview stages."
        maxWidth="md"
      >
        <form onSubmit={handleSaveApp} className="space-y-4">
          <Input
            label="Company Name *"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Stripe, Airbnb, Google"
          />

          <Input
            label="Job Title *"
            required
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />

          <Input
            label="Application Portal URL"
            type="url"
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            placeholder="https://boards.greenhouse.io/company/jobs/..."
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {statusOptions.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <Input
              label="Interview Date"
              optional
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Follow-up</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Recruiter screened on Monday, take-home task due Friday..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingApp ? 'Update Application' : 'Save to Tracker'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
