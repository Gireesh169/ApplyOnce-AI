import React, { useState } from 'react';
import { UserProfile, ExperienceRecord } from '@/profile/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, Briefcase, Pencil, Trash2, Building2, Calendar } from 'lucide-react';

interface ExperienceViewProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const ExperienceView: React.FC<ExperienceViewProps> = ({ profile, onSave }) => {
  const [experiences, setExperiences] = useState<ExperienceRecord[]>([...profile.experience]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExp, setEditingExp] = useState<ExperienceRecord | null>(null);

  // Form State
  const [company, setCompany] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<ExperienceRecord['employmentType']>('full_time');
  const [isCurrent, setIsCurrent] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [responsibilities, setResponsibilities] = useState<string>('');
  const [achievements, setAchievements] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const openAddModal = () => {
    setEditingExp(null);
    setCompany('');
    setJobTitle('');
    setEmploymentType('full_time');
    setIsCurrent(true);
    setStartDate('');
    setEndDate('');
    setResponsibilities('');
    setAchievements('');
    setLocation('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: ExperienceRecord) => {
    setEditingExp(exp);
    setCompany(exp.company);
    setJobTitle(exp.jobTitle);
    setEmploymentType(exp.employmentType);
    setIsCurrent(exp.isCurrent);
    setStartDate(exp.startDate);
    setEndDate(exp.endDate || '');
    setResponsibilities(exp.responsibilities);
    setAchievements(exp.achievements || '');
    setLocation(exp.location || '');
    setIsModalOpen(true);
  };

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: ExperienceRecord = {
      id: editingExp ? editingExp.id : `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      company,
      jobTitle,
      employmentType,
      isCurrent,
      startDate,
      endDate: isCurrent ? undefined : endDate,
      responsibilities,
      achievements,
      location
    };

    let updated: ExperienceRecord[];
    if (editingExp) {
      updated = experiences.map(item => item.id === editingExp.id ? record : item);
    } else {
      updated = [record, ...experiences];
    }

    setExperiences(updated);
    setIsModalOpen(false);

    await onSave({
      ...profile,
      experience: updated
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this experience record?')) {
      const updated = experiences.filter(item => item.id !== id);
      setExperiences(updated);
      await onSave({
        ...profile,
        experience: updated
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Work Experience & Internships</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Past and current employment records used to match portal company and title questions.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add Experience
        </Button>
      </div>

      {experiences.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No work experience added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add full-time roles, contracts, or internships so ApplyOnce can autofill current employer and title fields.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Add Current or Recent Role
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <Card key={exp.id} className="hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{exp.jobTitle}</h4>
                      <span className="text-sm text-slate-600">at <strong>{exp.company}</strong></span>
                      {exp.isCurrent ? (
                        <Badge variant="green" size="sm">
                          Current Role
                        </Badge>
                      ) : (
                        <Badge variant="gray" size="sm">
                          Previous
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                      {exp.location && <span>• {exp.location}</span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      {exp.responsibilities}
                    </p>
                    {exp.achievements && (
                      <p className="text-xs text-emerald-700 mt-1 font-medium">
                        Key Achievement: {exp.achievements}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(exp)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Experience Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExp ? 'Edit Work Experience' : 'Add Work Experience'}
        subtitle="Employment record details for portal form filling."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveExp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Cloud Corp"
            />
            <Input
              label="Job Title *"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <Input
              label="Location"
              optional
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA (or Remote)"
            />
            <Input
              label="Start Date *"
              required
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. 2022-03"
            />
            <div>
              <Input
                label="End Date"
                optional
                disabled={isCurrent}
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="e.g. 2024-01"
              />
              <label className="mt-1.5 inline-flex items-center text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 mr-1.5"
                />
                I currently work here
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Responsibilities & Summary *</label>
            <textarea
              required
              rows={3}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="Describe your core contributions, systems architected, or team leadership..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <Input
            label="Key Achievements / Metric"
            optional
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="e.g. Boosted API performance by 40% and reduced cloud costs."
          />

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingExp ? 'Update Experience' : 'Save Experience'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
