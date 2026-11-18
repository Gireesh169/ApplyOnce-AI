import React from 'react';
import { UserProfile } from '@/profile/types';
import { ProfileCompletenessReport } from '@/profile/completeness';
import { JobApplication } from '@/applications/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Briefcase,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  FolderGit2
} from 'lucide-react';

interface DashboardOverviewViewProps {
  profile: UserProfile;
  completeness: ProfileCompletenessReport;
  applications: JobApplication[];
  onNavigate: (view: string) => void;
  onLoadSample: () => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  profile,
  completeness,
  applications,
  onNavigate,
  onLoadSample
}) => {
  const activeApps = applications.filter(a => ['Applied', 'Assessment', 'Interview'].includes(a.status));
  const offersCount = applications.filter(a => a.status === 'Offer').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
              Universal Job Assistant
            </span>
            <span className="text-blue-100 text-xs">Enter Once. Apply Everywhere.</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile.personal.firstName || 'Candidate'}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 leading-relaxed">
            ApplyOnce AI is ready to detect, adapt, and autofill your job applications on Greenhouse, Lever, Workday, and custom career portals while keeping 100% of your data private and local.
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold"
              icon={<Search className="w-4 h-4 text-blue-600" />}
              onClick={() => onNavigate('analyzer')}
            >
              Analyze Job Description
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white bg-transparent hover:bg-white/10"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open('test-portal.html', '_blank')}
            >
              Open Mock Career Portal
            </Button>
            {!profile.personal.firstName && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white bg-transparent hover:bg-white/10"
                icon={<Sparkles className="w-4 h-4 text-amber-300" />}
                onClick={onLoadSample}
              >
                Load Starter Profile (Demo)
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Score</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{completeness.overallScore}%</span>
            <span className="text-xs text-slate-500">completeness</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${completeness.overallScore}%` }}
            ></div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active In-Flight</span>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeApps.length}</span>
            <span className="text-xs text-slate-500">applied/interviewing</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Across company portals</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offers Received</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{offersCount}</span>
            <span className="text-xs text-slate-500">opportunities</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Target achieved</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Skills</span>
            <FolderGit2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {profile.skills.programmingLanguages.length +
                profile.skills.frameworks.length +
                profile.skills.databases.length +
                profile.skills.cloudPlatforms.length +
                profile.skills.tools.length}
            </span>
            <span className="text-xs text-slate-500">verified tags</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Ready for autofill matching</p>
        </Card>
      </div>

      {/* Main Two-Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Profile Completeness Breakdown" subtitle="Detailed readiness for universal job portals">
            <div className="space-y-4">
              {Object.entries(completeness.categories).map(([key, cat]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <span className="font-bold text-slate-900">{cat.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.score >= 80
                          ? 'bg-emerald-600'
                          : cat.score >= 50
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cat.completedItems.join(', ') || 'None filled'}</span>
                    {cat.missingItems.length > 0 && (
                      <span className="text-amber-600 font-medium">Missing: {cat.missingItems[0]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <Card title="Application Workflow" subtitle="Quick access to core modules">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigate('resume')}
                className="p-4 rounded-xl border border-slate-200 text-left hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600">Resume Manager</h4>
                <p className="text-xs text-slate-500 mt-1">Upload PDF & extract profile items</p>
              </button>

              <button
                onClick={() => onNavigate('adaptive')}
                className="p-4 rounded-xl border border-slate-200 text-left hover:border-purple-400 hover:bg-purple-50/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm group-hover:text-purple-600">Adaptive Fields</h4>
                <p className="text-xs text-slate-500 mt-1">Learned questions & custom fields</p>
              </button>

              <button
                onClick={() => onNavigate('applications')}
                className="p-4 rounded-xl border border-slate-200 text-left hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-600">Tracker</h4>
                <p className="text-xs text-slate-500 mt-1">Manage jobs from submission to offer</p>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Recommendations & Tips (1 column) */}
        <div className="space-y-6">
          <Card title="Recommendations" subtitle="Steps to optimize autofill match rate">
            {completeness.recommendations.length > 0 ? (
              <div className="space-y-2.5">
                {completeness.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Outstanding! Your profile is 100% complete.</span>
              </div>
            )}
          </Card>

          <Card title="Privacy Guarantee" subtitle="100% Local-First Architecture">
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                ✓ All personal profile data is stored exclusively in your browser via <code>chrome.storage.local</code>.
              </p>
              <p>
                ✓ PDF resume extraction happens completely on client-side via WebAssembly / PDF.js.
              </p>
              <p>
                ✓ No personal information is ever transmitted to external servers without your explicit permission.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
