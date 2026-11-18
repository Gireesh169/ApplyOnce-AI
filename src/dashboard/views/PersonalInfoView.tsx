import React, { useState } from 'react';
import { UserProfile, PersonalInfo } from '@/profile/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Check, ShieldCheck, Info } from 'lucide-react';

interface PersonalInfoViewProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const PersonalInfoView: React.FC<PersonalInfoViewProps> = ({ profile, onSave }) => {
  const [personal, setPersonal] = useState<PersonalInfo>({ ...profile.personal });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setPersonal(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const updated: UserProfile = {
      ...profile,
      personal: {
        ...personal,
        fullName: personal.fullName.trim() || `${personal.firstName} ${personal.lastName}`.trim(),
        legalFullName: personal.legalFullName?.trim() || `${personal.legalFirstName || personal.firstName} ${personal.legalLastName || personal.lastName}`.trim()
      }
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
          <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your legal and preferred identity details used across company application forms.
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

      {/* Primary Names Card */}
      <Card title="Primary Identity & Preferred Name" subtitle="Standard names filled in application forms">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="First Name *"
            required
            value={personal.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Jane"
          />
          <Input
            label="Middle Name"
            optional
            value={personal.middleName || ''}
            onChange={(e) => handleChange('middleName', e.target.value)}
            placeholder="Marie"
          />
          <Input
            label="Last Name *"
            required
            value={personal.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Doe"
          />
          <Input
            label="Preferred Name"
            optional
            value={personal.preferredName || ''}
            onChange={(e) => handleChange('preferredName', e.target.value)}
            placeholder="Janey (if different from first name)"
          />
          <div className="md:col-span-2">
            <Input
              label="Full Name Display"
              value={personal.fullName || `${personal.firstName} ${personal.lastName}`.trim()}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Jane Marie Doe"
              helperText="Auto-generated if left empty"
            />
          </div>
        </div>
      </Card>

      {/* Legal Identity Card (Strictly Disambiguated) */}
      <Card
        title="Legal Identity (Passport / Official Documents)"
        subtitle="Used when company explicitly asks for Legal First/Last/Full name for background checks"
      >
        <div className="mb-3 p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Adaptive Safety:</strong> ApplyOnce AI distinguishes between standard first name and legal first name. Fill these out to prevent manual verification prompts.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Legal First Name"
            optional
            value={personal.legalFirstName || ''}
            onChange={(e) => handleChange('legalFirstName', e.target.value)}
            placeholder="Jane (as on passport/ID)"
          />
          <Input
            label="Legal Middle Name"
            optional
            value={personal.legalMiddleName || ''}
            onChange={(e) => handleChange('legalMiddleName', e.target.value)}
            placeholder="Marie"
          />
          <Input
            label="Legal Last Name"
            optional
            value={personal.legalLastName || ''}
            onChange={(e) => handleChange('legalLastName', e.target.value)}
            placeholder="Doe"
          />
          <div className="md:col-span-3">
            <Input
              label="Legal Full Name"
              optional
              value={personal.legalFullName || ''}
              onChange={(e) => handleChange('legalFullName', e.target.value)}
              placeholder="Jane Marie Doe"
            />
          </div>
          <div className="md:col-span-3">
            <Input
              label="Previous Names (if any)"
              optional
              value={personal.previousNames || ''}
              onChange={(e) => handleChange('previousNames', e.target.value)}
              placeholder="Maiden names or prior legal names"
            />
          </div>
        </div>
      </Card>

      {/* Residential Address Card */}
      <Card title="Address & Location" subtitle="Location information for regional and remote job filtering">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address *"
              required
              value={personal.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Tech Boulevard, Apt 4B"
            />
          </div>
          <Input
            label="City *"
            required
            value={personal.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="San Francisco"
          />
          <Input
            label="State / Province *"
            required
            value={personal.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="CA"
          />
          <Input
            label="Postal / ZIP Code *"
            required
            value={personal.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="94105"
          />
          <Input
            label="Country *"
            required
            value={personal.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="United States"
          />
        </div>
      </Card>

      {/* Sensitive / Voluntary Details */}
      <Card title="Voluntary & Demographic Information" subtitle="Optional information requested on some portals">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date of Birth"
            optional
            type="date"
            value={personal.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          />
          <Input
            label="Gender / Pronouns"
            optional
            value={personal.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
            placeholder="She/Her or Prefer not to say"
          />
          <Input
            label="Nationality"
            optional
            value={personal.nationality || ''}
            onChange={(e) => handleChange('nationality', e.target.value)}
            placeholder="e.g. American, Canadian, Indian"
          />
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
          {savedSuccess ? 'Changes Saved Successfully!' : 'Save Personal Details'}
        </Button>
      </div>
    </form>
  );
};
