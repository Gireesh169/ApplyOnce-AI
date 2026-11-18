import React, { useState } from 'react';
import { UserProfile } from '@/profile/types';
import { JobAnalyzerService, JobAnalysisResult } from '@/analyzer/JobAnalyzerService';
import { ApplicationTrackerService } from '@/applications/ApplicationTrackerService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  CheckCircle2,
  XCircle,
  Briefcase,
  Sparkles,
  BookmarkPlus,
  Building,
  MapPin,
  Clock,
  Award
} from 'lucide-react';

interface JobAnalyzerViewProps {
  profile: UserProfile;
}

const SAMPLE_JOB_DESCRIPTION = `Company: Stripe
Job Title: Senior Full-Stack Software Engineer
Location: San Francisco, CA (Hybrid / Remote)
Employment Type: Full-Time

About the Role:
We are looking for a Senior Full-Stack Engineer with 4+ years of experience building mission-critical web applications.

Requirements:
- 4+ years of experience with TypeScript, React, and Node.js
- Experience with relational databases like PostgreSQL and in-memory caches like Redis
- Proficiency with AWS, Docker, and CI/CD pipelines
- Strong background in building REST APIs and GraphQL microservices
- Dedication to automated unit and integration testing (Vitest, Jest)

Preferred Qualifications:
- Experience with Python or Go
- Knowledge of Kubernetes and Terraform
- Strong communication and mentoring skills
`;

export const JobAnalyzerView: React.FC<JobAnalyzerViewProps> = ({ profile }) => {
  const [jdText, setJdText] = useState<string>('');
  const [result, setResult] = useState<JobAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [savedToTracker, setSavedToTracker] = useState<boolean>(false);

  const handleAnalyze = () => {
    if (!jdText.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = JobAnalyzerService.analyzeJobDescription(jdText, profile);
      setResult(res);
      setIsAnalyzing(false);
    }, 200);
  };

  const handleLoadSample = () => {
    setJdText(SAMPLE_JOB_DESCRIPTION);
    const res = JobAnalyzerService.analyzeJobDescription(SAMPLE_JOB_DESCRIPTION, profile);
    setResult(res);
  };

  const handleSaveToTracker = async () => {
    if (!result) return;
    await ApplicationTrackerService.addApplication({
      company: result.companyName || 'Target Company',
      jobTitle: result.jobTitle || 'Target Position',
      applicationUrl: window.location.href,
      dateDiscovered: new Date().toISOString().split('T')[0],
      status: 'Interested',
      notes: `Analyzed with ApplyOnce AI (${result.matchScore}% Match Score). Matching: ${result.matchingSkills.join(', ')}`
    });
    setSavedToTracker(true);
    setTimeout(() => setSavedToTracker(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Description Analyzer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based keyword and requirement comparison with 0% external API cost and 100% privacy.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Sparkles className="w-4 h-4 text-amber-500" />} onClick={handleLoadSample}>
          Load Sample Job Post
        </Button>
      </div>

      {/* Input Text Area Card */}
      <Card title="Paste Job Posting" subtitle="Paste any job description from LinkedIn, Indeed, or company career boards">
        <div className="space-y-3">
          <textarea
            rows={7}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste complete job description text here..."
            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
          ></textarea>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              {jdText.length > 0 ? `${jdText.split(/\s+/).filter(Boolean).length} words` : 'Waiting for input'}
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={!jdText.trim()}
              isLoading={isAnalyzing}
              icon={<Search className="w-4 h-4" />}
              onClick={handleAnalyze}
            >
              Analyze & Compare with Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Match Score Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  {result.companyName || 'Company'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-300">{result.location}</span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-300">{result.employmentType}</span>
              </div>
              <h3 className="text-lg font-bold">{result.jobTitle || 'Role Analysis'}</h3>
              <p className="text-xs text-slate-300 max-w-xl">{result.summary}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-extrabold text-blue-400">{result.matchScore}%</div>
                <div className="text-[11px] text-slate-400">Profile Match Score</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<BookmarkPlus className="w-4 h-4" />}
                onClick={handleSaveToTracker}
              >
                {savedToTracker ? 'Saved to Tracker!' : 'Track Job'}
              </Button>
            </div>
          </div>

          {/* Skills Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matching Skills */}
            <Card title={`Matching Skills (${result.matchingSkills.length})`} subtitle="Skills already verified in your profile">
              {result.matchingSkills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No matching skills identified.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.matchingSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Missing Skills */}
            <Card title={`Missing / Unverified Skills (${result.missingSkills.length})`} subtitle="Consider adding to profile if you possess them">
              {result.missingSkills.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">You possess all identified skills for this role!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      <XCircle className="w-3.5 h-3.5 text-amber-500" />
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Relevant Projects */}
          {result.relevantProjects.length > 0 && (
            <Card title="Relevant Candidate Projects" subtitle="Your projects showcasing technologies requested by this job">
              <div className="space-y-3">
                {result.relevantProjects.map((p) => (
                  <div key={p.title} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Matches: {p.matchingTechnologies.join(', ')}
                      </p>
                    </div>
                    <Badge variant="blue" size="sm">
                      {p.matchingTechnologies.length} Matching Tech
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
