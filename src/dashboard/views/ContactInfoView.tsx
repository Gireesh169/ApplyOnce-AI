import React, { useState } from 'react';
import { UserProfile, ContactInfo, AdditionalInfo } from '@/profile/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Check, Globe, ShieldAlert } from 'lucide-react';

interface ContactInfoViewProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const ContactInfoView: React.FC<ContactInfoViewProps> = ({ profile, onSave }) => {
  const [contact, setContact] = useState<ContactInfo>({ ...profile.contact });
  const [additional, setAdditional] = useState<AdditionalInfo>({ ...profile.additional });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  const handleAdditionalChange = (field: keyof AdditionalInfo, value: any) => {
    setAdditional(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const updated: UserProfile = {
      ...profile,
      contact,
      additional
    };

    await onSave(updated);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Contact & Application Preferences</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Communication channels, public links, work authorization, and compensation preferences.
          </p>
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving}
          icon={savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        >
          {savedSuccess ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Communications */}
      <Card title="Email & Phone" subtitle="Primary and backup contact numbers for recruiter reach-outs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Primary Email Address *"
            required
            type="email"
            value={contact.primaryEmail}
            onChange={(e) => handleContactChange('primaryEmail', e.target.value)}
            placeholder="jane.doe@example.com"
          />
          <Input
            label="Secondary Email Address"
            optional
            type="email"
            value={contact.secondaryEmail || ''}
            onChange={(e) => handleContactChange('secondaryEmail', e.target.value)}
            placeholder="jane.alt@gmail.com"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Phone Number (Structured) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contact.phoneCountryCode || '+91'}
                onChange={(e) => {
                  const code = e.target.value;
                  const national = contact.phoneNationalNumber || '';
                  const full = `${code}${national}`;
                  setContact(prev => ({
                    ...prev,
                    phoneCountryCode: code,
                    phoneFullInternational: full,
                    mobileNumber: full
                  }));
                }}
                placeholder="+91"
                className="w-20 px-2.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-center"
              />
              <input
                type="tel"
                required
                value={contact.phoneNationalNumber || ''}
                onChange={(e) => {
                  const national = e.target.value.replace(/\D/g, '').slice(0, 10);
                  const code = contact.phoneCountryCode || '+91';
                  const full = `${code}${national}`;
                  setContact(prev => ({
                    ...prev,
                    phoneNationalNumber: national,
                    phoneFullInternational: full,
                    mobileNumber: full
                  }));
                }}
                placeholder="9876543210 (10 digits)"
                maxLength={10}
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Full international format: <span className="font-mono text-blue-600 font-semibold">{contact.phoneFullInternational || `${contact.phoneCountryCode || '+91'}${contact.phoneNationalNumber || '9876543210'}`}</span>
            </p>
          </div>
          <Input
            label="Alternate Phone Number"
            optional
            type="tel"
            value={contact.alternatePhoneNumber || ''}
            onChange={(e) => handleContactChange('alternatePhoneNumber', e.target.value)}
            placeholder="+1 (555) 111-2222"
          />
        </div>
      </Card>

      {/* Social & Professional Links */}
      <Card title="Professional Profiles & Portfolios" subtitle="URLs automatically placed in profile field sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="LinkedIn Profile URL"
            type="url"
            value={contact.linkedInUrl || ''}
            onChange={(e) => handleContactChange('linkedInUrl', e.target.value)}
            placeholder="https://linkedin.com/in/username"
          />
          <Input
            label="GitHub Profile URL"
            type="url"
            value={contact.gitHubUrl || ''}
            onChange={(e) => handleContactChange('gitHubUrl', e.target.value)}
            placeholder="https://github.com/username"
          />
          <Input
            label="Portfolio Website URL"
            type="url"
            value={contact.portfolioUrl || ''}
            onChange={(e) => handleContactChange('portfolioUrl', e.target.value)}
            placeholder="https://janedoe.dev"
          />
          <Input
            label="Personal Blog / Other Site"
            optional
            type="url"
            value={contact.personalWebsite || ''}
            onChange={(e) => handleContactChange('personalWebsite', e.target.value)}
            placeholder="https://blog.janedoe.dev"
          />
        </div>
      </Card>

      {/* Work Authorization & Legal Eligibility */}
      <Card title="Work Authorization & Sponsorship" subtitle="Common portal questions regarding visas and eligibility">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Are you legally authorized to work in the country you are applying for? *
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="workAuth"
                  checked={additional.workAuthorization === 'yes'}
                  onChange={() => handleAdditionalChange('workAuthorization', 'yes')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Yes
              </label>
              <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="workAuth"
                  checked={additional.workAuthorization === 'no'}
                  onChange={() => handleAdditionalChange('workAuthorization', 'no')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Will you now or in the future require visa sponsorship? *
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="sponsorship"
                  checked={additional.requiresSponsorship === 'yes'}
                  onChange={() => handleAdditionalChange('requiresSponsorship', 'yes')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Yes
              </label>
              <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="sponsorship"
                  checked={additional.requiresSponsorship === 'no'}
                  onChange={() => handleAdditionalChange('requiresSponsorship', 'no')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="inline-flex items-center text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={additional.willingnessToRelocate}
                onChange={(e) => handleAdditionalChange('willingnessToRelocate', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 mr-2"
              />
              Willing to relocate for the role
            </label>
          </div>

          <div>
            <Input
              label="Preferred Work Location / Cities"
              optional
              value={additional.preferredWorkLocation || ''}
              onChange={(e) => handleAdditionalChange('preferredWorkLocation', e.target.value)}
              placeholder="e.g. San Francisco, CA or New York, NY"
            />
          </div>
        </div>
      </Card>

      {/* Compensation & Availability */}
      <Card title="Compensation & Availability" subtitle="Expected vs current salary and start date">
        <div className="mb-3 p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Salary Separation Rule:</strong> ApplyOnce AI strictly prevents Expected Salary from ever accidentally overwriting Current Salary fields on applications.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Notice Period *"
            required
            value={additional.noticePeriod}
            onChange={(e) => handleAdditionalChange('noticePeriod', e.target.value)}
            placeholder="e.g. 2 weeks / Immediate"
          />
          <Input
            label="Expected Salary (Annual USD)"
            optional
            type="number"
            value={additional.expectedSalary || ''}
            onChange={(e) => handleAdditionalChange('expectedSalary', e.target.value)}
            placeholder="e.g. 140000"
          />
          <Input
            label="Current Salary (Annual USD)"
            optional
            type="number"
            value={additional.currentSalary || ''}
            onChange={(e) => handleAdditionalChange('currentSalary', e.target.value)}
            placeholder="e.g. 125000"
          />
          <Input
            label="Earliest Available Start Date"
            optional
            type="date"
            value={additional.earliestStartDate || ''}
            onChange={(e) => handleAdditionalChange('earliestStartDate', e.target.value)}
          />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode Preference</label>
            <select
              value={additional.workModePreference}
              onChange={(e) => handleAdditionalChange('workModePreference', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid (Preferred)</option>
              <option value="onsite">On-site</option>
              <option value="flexible">Flexible / Any</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          icon={savedSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        >
          {savedSuccess ? 'Changes Saved!' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );
};
