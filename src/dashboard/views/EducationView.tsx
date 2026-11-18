import React, { useState } from 'react';
import { UserProfile, EducationRecord } from '@/profile/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, GraduationCap, Pencil, Trash2, Check, School } from 'lucide-react';

interface EducationViewProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const EducationView: React.FC<EducationViewProps> = ({ profile, onSave }) => {
  const [educationList, setEducationList] = useState<EducationRecord[]>([...profile.education]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<EducationRecord | null>(null);

  // Form State
  const [institution, setInstitution] = useState<string>('');
  const [university, setUniversity] = useState<string>('');
  const [degree, setDegree] = useState<string>("Bachelor's Degree");
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [cgpa, setCgpa] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [startYear, setStartYear] = useState<string>('');
  const [graduationYear, setGraduationYear] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<EducationRecord['currentStatus']>('completed');

  const openAddModal = () => {
    setEditingRecord(null);
    setInstitution('');
    setUniversity('');
    setDegree("Bachelor's Degree");
    setFieldOfStudy('');
    setBranch('');
    setSpecialization('');
    setCgpa('');
    setPercentage('');
    setStartYear('');
    setGraduationYear('');
    setCurrentStatus('completed');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: EducationRecord) => {
    setEditingRecord(rec);
    setInstitution(rec.institution);
    setUniversity(rec.university || '');
    setDegree(rec.degree);
    setFieldOfStudy(rec.fieldOfStudy);
    setBranch(rec.branch || '');
    setSpecialization(rec.specialization || '');
    setCgpa(rec.cgpa || '');
    setPercentage(rec.percentage || '');
    setStartYear(rec.startYear);
    setGraduationYear(rec.graduationYear);
    setCurrentStatus(rec.currentStatus);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: EducationRecord = {
      id: editingRecord ? editingRecord.id : `edu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      institution,
      university,
      degree,
      fieldOfStudy,
      branch,
      specialization,
      cgpa,
      percentage,
      startYear,
      graduationYear,
      currentStatus
    };

    let updated: EducationRecord[];
    if (editingRecord) {
      updated = educationList.map(item => item.id === editingRecord.id ? record : item);
    } else {
      updated = [record, ...educationList];
    }

    setEducationList(updated);
    setIsModalOpen(false);

    await onSave({
      ...profile,
      education: updated
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this education record?')) {
      const updated = educationList.filter(item => item.id !== id);
      setEducationList(updated);
      await onSave({
        ...profile,
        education: updated
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Education & Academic Background</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add multiple college degrees, universities, and specializations for autofilling.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add Education Record
        </Button>
      </div>

      {educationList.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No education records added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add your degrees, universities, graduation years, and GPA so ApplyOnce can autofill education sections automatically.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Add Highest Degree
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {educationList.map((rec) => (
            <Card key={rec.id} className="hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{rec.institution}</h4>
                      <Badge variant="blue" size="sm">
                        {rec.degree}
                      </Badge>
                      <Badge variant={rec.currentStatus === 'completed' ? 'green' : 'yellow'} size="sm">
                        {rec.currentStatus === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {rec.fieldOfStudy} {rec.branch ? `• ${rec.branch}` : ''}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span>Graduation: <strong>{rec.graduationYear}</strong></span>
                      {rec.cgpa && <span>CGPA/GPA: <strong>{rec.cgpa}</strong></span>}
                      {rec.percentage && <span>Percentage: <strong>{rec.percentage}%</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(rec)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Education Record' : 'Add Education Record'}
        subtitle="Provide academic credential details for universal field matching."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <Input
            label="College / Institution Name *"
            required
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. University of California, Berkeley"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Level *</label>
              <select
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Bachelor's Degree">Bachelor's Degree (B.S. / B.A. / B.Tech)</option>
                <option value="Master's Degree">Master's Degree (M.S. / M.A. / M.Tech)</option>
                <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                <option value="Associate's Degree">Associate's Degree</option>
                <option value="High School">High School Diploma</option>
                <option value="Other Certification">Other Qualification</option>
              </select>
            </div>

            <Input
              label="Field of Study / Major *"
              required
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Computer Science"
            />

            <Input
              label="Branch / Department"
              optional
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. Electrical Eng & CS"
            />

            <Input
              label="Specialization / Concentration"
              optional
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
            />

            <Input
              label="Graduation Year *"
              required
              type="number"
              min="1970"
              max="2035"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="2024"
            />

            <Input
              label="CGPA or GPA (Scale of 4.0 or 10.0)"
              optional
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              placeholder="e.g. 3.85 / 4.0"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingRecord ? 'Update Education' : 'Save Education'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
