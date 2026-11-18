import React, { useState, useEffect } from 'react';
import { UserProfile, createEmptyProfile } from '@/profile/types';
import { ProfileCompletenessReport, calculateProfileCompleteness } from '@/profile/completeness';
import { JobApplication } from '@/applications/types';
import { ProfileService } from '@/profile/ProfileService';
import { ApplicationTrackerService } from '@/applications/ApplicationTrackerService';

// Views
import { DashboardOverviewView } from './views/DashboardOverviewView';
import { PersonalInfoView } from './views/PersonalInfoView';
import { ContactInfoView } from './views/ContactInfoView';
import { EducationView } from './views/EducationView';
import { ExperienceView } from './views/ExperienceView';
import { SkillsView } from './views/SkillsView';
import { ProjectsView } from './views/ProjectsView';
import { ResumeManagerView } from './views/ResumeManagerView';
import { AdaptiveFieldsView } from './views/AdaptiveFieldsView';
import { FieldMappingsView } from './views/FieldMappingsView';
import { JobAnalyzerView } from './views/JobAnalyzerView';
import { ApplicationTrackerView } from './views/ApplicationTrackerView';
import { SettingsPrivacyView } from './views/SettingsPrivacyView';

import {
  LayoutDashboard,
  User,
  Phone,
  GraduationCap,
  Briefcase,
  Code2,
  FolderGit2,
  FileText,
  Sparkles,
  Brain,
  Search,
  ListTodo,
  Settings,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(createEmptyProfile());
  const [completeness, setCompleteness] = useState<ProfileCompletenessReport>({
    overallScore: 0,
    categories: {},
    recommendations: []
  });
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAllData = async () => {
    setLoading(true);
    try {
      const p = await ProfileService.getProfile();
      const comp = await ProfileService.getCompleteness();
      const apps = await ApplicationTrackerService.getApplications();
      setProfile(p);
      setCompleteness(comp);
      setApplications(apps);
    } catch (e) {
      console.warn('Dashboard initialization error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleProfileSave = async (updated: UserProfile) => {
    await ProfileService.saveProfile(updated);
    setProfile(updated);
    const comp = await ProfileService.getCompleteness();
    setCompleteness(comp);
  };

  const handleLoadSample = async () => {
    const sample = await ProfileService.loadSampleProfile();
    setProfile(sample);
    const comp = await ProfileService.getCompleteness();
    setCompleteness(comp);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'personal', label: 'Personal Information', icon: <User className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Details', icon: <Phone className="w-4 h-4" /> },
    { id: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills & Tech', icon: <Code2 className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'resume', label: 'Resume Manager', icon: <FileText className="w-4 h-4" /> },
    { id: 'adaptive', label: 'Adaptive Fields', icon: <Sparkles className="w-4 h-4 text-purple-600" /> },
    { id: 'mappings', label: 'Field Memory', icon: <Brain className="w-4 h-4 text-blue-600" /> },
    { id: 'analyzer', label: 'Job Analyzer', icon: <Search className="w-4 h-4 text-amber-600" /> },
    { id: 'applications', label: 'Application Tracker', icon: <ListTodo className="w-4 h-4 text-emerald-600" /> },
    { id: 'settings', label: 'Settings & Privacy', icon: <Settings className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading ApplyOnce AI Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              AO
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">ApplyOnce AI</h1>
              <p className="text-[10px] text-slate-500 font-medium">Enter Once. Apply Everywhere.</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-170px)]">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">
              Profile & Assistant
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
            <span>Profile Completeness</span>
            <span className="font-bold text-blue-600">{completeness.overallScore}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${completeness.overallScore}%` }}
            ></div>
          </div>
          <a
            href="test-portal.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-md transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open Mock Test Portal
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl">
        {activeTab === 'dashboard' && (
          <DashboardOverviewView
            profile={profile}
            completeness={completeness}
            applications={applications}
            onNavigate={(view) => setActiveTab(view)}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'personal' && (
          <PersonalInfoView profile={profile} onSave={handleProfileSave} />
        )}

        {activeTab === 'contact' && (
          <ContactInfoView profile={profile} onSave={handleProfileSave} />
        )}

        {activeTab === 'education' && (
          <EducationView profile={profile} onSave={handleProfileSave} />
        )}

        {activeTab === 'experience' && (
          <ExperienceView profile={profile} onSave={handleProfileSave} />
        )}

        {activeTab === 'skills' && (
          <SkillsView profile={profile} onSave={handleProfileSave} />
        )}

        {activeTab === 'projects' && (
          <ProjectsView profile={profile} onSave={handleProfileSave} />
        )}

        {activeTab === 'resume' && (
          <ResumeManagerView onProfileUpdated={refreshAllData} />
        )}

        {activeTab === 'adaptive' && (
          <AdaptiveFieldsView />
        )}

        {activeTab === 'mappings' && (
          <FieldMappingsView />
        )}

        {activeTab === 'analyzer' && (
          <JobAnalyzerView profile={profile} />
        )}

        {activeTab === 'applications' && (
          <ApplicationTrackerView />
        )}

        {activeTab === 'settings' && (
          <SettingsPrivacyView onDataReset={refreshAllData} />
        )}
      </main>
    </div>
  );
};
