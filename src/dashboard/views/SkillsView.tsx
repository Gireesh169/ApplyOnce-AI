import React, { useState } from 'react';
import { UserProfile, SkillCategory } from '@/profile/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, X, Save, Check, Code, Layers, Database, Cloud, Wrench, Award, HeartHandshake } from 'lucide-react';

interface SkillsViewProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ profile, onSave }) => {
  const [skills, setSkills] = useState<SkillCategory>({ ...profile.skills });
  const [newSkillInputs, setNewSkillInputs] = useState<Record<keyof SkillCategory, string>>({
    programmingLanguages: '',
    frameworks: '',
    databases: '',
    cloudPlatforms: '',
    tools: '',
    softSkills: '',
    certifications: ''
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleAddSkill = (category: keyof SkillCategory) => {
    const val = newSkillInputs[category].trim();
    if (!val) return;

    if (!skills[category].includes(val)) {
      setSkills(prev => ({
        ...prev,
        [category]: [...prev[category], val]
      }));
    }

    setNewSkillInputs(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveSkill = (category: keyof SkillCategory, skillToRemove: string) => {
    setSkills(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s !== skillToRemove)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    await onSave({
      ...profile,
      skills
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const categoryConfigs: Array<{
    key: keyof SkillCategory;
    title: string;
    icon: React.ReactNode;
    color: 'blue' | 'purple' | 'green' | 'yellow' | 'gray';
    placeholder: string;
  }> = [
    {
      key: 'programmingLanguages',
      title: 'Programming Languages',
      icon: <Code className="w-4 h-4 text-blue-600" />,
      color: 'blue',
      placeholder: 'e.g. TypeScript, Python, Go, Java'
    },
    {
      key: 'frameworks',
      title: 'Frameworks & Libraries',
      icon: <Layers className="w-4 h-4 text-purple-600" />,
      color: 'purple',
      placeholder: 'e.g. React, Next.js, Node.js, Tailwind CSS'
    },
    {
      key: 'databases',
      title: 'Databases & In-Memory',
      icon: <Database className="w-4 h-4 text-green-600" />,
      color: 'green',
      placeholder: 'e.g. PostgreSQL, Redis, MongoDB'
    },
    {
      key: 'cloudPlatforms',
      title: 'Cloud & Infrastructure',
      icon: <Cloud className="w-4 h-4 text-blue-500" />,
      color: 'blue',
      placeholder: 'e.g. AWS, Docker, Kubernetes, GCP'
    },
    {
      key: 'tools',
      title: 'Development Tools & Testing',
      icon: <Wrench className="w-4 h-4 text-yellow-600" />,
      color: 'yellow',
      placeholder: 'e.g. Git, GitHub Actions, Vitest, Jest'
    },
    {
      key: 'softSkills',
      title: 'Leadership & Soft Skills',
      icon: <HeartHandshake className="w-4 h-4 text-emerald-600" />,
      color: 'green',
      placeholder: 'e.g. Agile/Scrum, Mentorship, Communication'
    },
    {
      key: 'certifications',
      title: 'Certifications & Honors',
      icon: <Award className="w-4 h-4 text-purple-600" />,
      color: 'purple',
      placeholder: 'e.g. AWS Certified Solutions Architect'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Technical & Professional Skills</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Categorized skills matched against portal inputs and job description requirements.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          icon={savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        >
          {savedSuccess ? 'Skills Saved!' : 'Save All Skills'}
        </Button>
      </div>

      <div className="space-y-5">
        {categoryConfigs.map(({ key, title, icon, color, placeholder }) => (
          <Card key={key} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
                <span className="text-xs text-slate-400">({skills[key].length})</span>
              </div>
            </div>

            {/* Existing tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {skills[key].length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skills added yet in this category</span>
              ) : (
                skills[key].map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(key, skill)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Input to add tag */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSkillInputs[key]}
                onChange={(e) => setNewSkillInputs(prev => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(key);
                  }
                }}
                placeholder={placeholder}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => handleAddSkill(key)}
              >
                Add
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          isLoading={isSaving}
          icon={savedSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        >
          {savedSuccess ? 'Saved All Skills!' : 'Save Skills Changes'}
        </Button>
      </div>
    </div>
  );
};
