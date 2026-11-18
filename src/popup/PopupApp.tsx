import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MissingInformationDialog } from '@/components/MissingInformationDialog';
import { FieldPreviewModal } from '@/components/FieldPreviewModal';
import { MESSAGE_TYPES } from '@/shared/messages';
import { ProfileService } from '@/profile/ProfileService';
import { ApplicationTrackerService } from '@/applications/ApplicationTrackerService';
import { MatchedFormField, MissingFormField, UnsupportedFormField } from '@/adaptive/types';
import { UserProfile } from '@/profile/types';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookmarkPlus,
  RefreshCw,
  Eye,
  ShieldCheck,
  User,
  Ban
} from 'lucide-react';

export const PopupApp: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [autofilling, setAutofilling] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pageUrl, setPageUrl] = useState<string>('');
  const [pageDomain, setPageDomain] = useState<string>('');
  const [totalDetected, setTotalDetected] = useState<number>(0);
  const [matchedFields, setMatchedFields] = useState<MatchedFormField[]>([]);
  const [missingFields, setMissingFields] = useState<MissingFormField[]>([]);
  const [unsupportedFields, setUnsupportedFields] = useState<UnsupportedFormField[]>([]);
  const [profileScore, setProfileScore] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [jobSaved, setJobSaved] = useState<boolean>(false);

  // Scan current tab and load profile
  const scanCurrentTab = async () => {
    setLoading(true);
    setStatusMessage('');

    try {
      // 1. Get saved profile & completeness from Chrome Storage API
      const profile = await ProfileService.getProfile();
      setUserProfile(profile);

      const completeness = await ProfileService.getCompleteness();
      setProfileScore(completeness.overallScore);

      // 2. Query active tab and ask content script for DOM inspection
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (!activeTab || !activeTab.id) {
            setLoading(false);
            return;
          }

          setPageUrl(activeTab.url || '');
          try {
            if (activeTab.url) {
              const urlObj = new URL(activeTab.url);
              setPageDomain(urlObj.hostname);
            }
          } catch {
            setPageDomain('');
          }

          chrome.tabs.sendMessage(
            activeTab.id,
            { type: MESSAGE_TYPES.INSPECT_PAGE_FORMS },
            (response) => {
              setLoading(false);
              if (chrome.runtime.lastError || !response || !response.success) {
                return;
              }

              setTotalDetected(response.totalFieldsCount || 0);
              setMatchedFields(response.matchedFields || []);
              setMissingFields(response.missingFields || []);
              setUnsupportedFields(response.unsupportedFields || []);
            }
          );
        });
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.warn('Popup load error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    scanCurrentTab();
  }, []);

  const highConfidenceMatches = matchedFields.filter(
    (m) => m.confidence === 'high' && !m.isAmbiguous && m.suggestedValue
  );
  const ambiguousMatches = matchedFields.filter(
    (m) => m.confidence === 'medium' || m.isAmbiguous
  );

  const handleAutofillWithPreview = (
    itemsToFill: Array<{ selector: string; value: any; type: string; allowOverwrite: boolean }>,
    overwriteExisting: boolean
  ) => {
    setAutofilling(true);
    setStatusMessage('');

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) {
          setAutofilling(false);
          return;
        }

        chrome.tabs.sendMessage(
          activeTab.id,
          {
            type: MESSAGE_TYPES.TRIGGER_AUTOFILL,
            payload: {
              approvedMatches: itemsToFill,
              overwriteExisting
            }
          },
          (response) => {
            setAutofilling(false);
            if (response && response.success) {
              setStatusMessage(`Successfully filled ${response.filledCount} fields!`);
              setTimeout(() => setStatusMessage(''), 4000);
              scanCurrentTab();
            } else {
              setStatusMessage('Autofill complete. Check highlighted fields.');
              setTimeout(() => setStatusMessage(''), 4000);
            }
          }
        );
      });
    } else {
      setAutofilling(false);
    }
  };

  const handleReviewAndAutofill = (completed: any[]) => {
    const approvedMatches = [
      ...highConfidenceMatches.map((m) => ({
        selector: m.detectedField.selector,
        value: m.suggestedValue,
        type: m.detectedField.type,
        allowOverwrite: false
      })),
      ...completed
        .filter((c) => (c.action === 'save_permanent' || c.action === 'use_once') && c.userValue)
        .map((c) => ({
          selector: c.missingField.detectedField.selector,
          value: c.userValue,
          type: c.missingField.detectedField.type,
          allowOverwrite: false
        }))
    ];

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) return;

        chrome.tabs.sendMessage(
          activeTab.id,
          {
            type: MESSAGE_TYPES.TRIGGER_AUTOFILL,
            payload: {
              approvedMatches,
              overwriteExisting: false
            }
          },
          (response) => {
            setStatusMessage(`Filled ${response?.filledCount || approvedMatches.length} fields!`);
            setTimeout(() => setStatusMessage(''), 4000);
            scanCurrentTab();
          }
        );
      });
    }
  };

  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    } else {
      window.open('dashboard.html', '_blank');
    }
  };

  const openTestPortal = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('test-portal.html') });
    } else {
      window.open('test-portal.html', '_blank');
    }
  };

  const handleSaveJobToTracker = async () => {
    const company = pageDomain ? pageDomain.replace(/^www\./, '').split('.')[0] : 'Current Company';
    await ApplicationTrackerService.addApplication({
      company: company.charAt(0).toUpperCase() + company.slice(1),
      jobTitle: 'Candidate Application',
      applicationUrl: pageUrl,
      dateDiscovered: new Date().toISOString().split('T')[0],
      status: 'Interested',
      notes: `Saved via ApplyOnce AI popup from ${pageDomain}`
    });
    setJobSaved(true);
    setTimeout(() => setJobSaved(false), 3000);
  };

  const candidateDisplayName = userProfile?.personal?.firstName
    ? `${userProfile.personal.firstName} ${userProfile.personal.lastName}`.trim()
    : 'No Profile Loaded';

  return (
    <div className="p-4 flex flex-col justify-between min-h-[530px]">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
              AO
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">ApplyOnce AI</h1>
              <p className="text-[10px] text-slate-500 font-medium">Enter Once. Apply Everywhere.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="green" size="sm">
              Active
            </Badge>
            <button
              onClick={scanCurrentTab}
              title="Rescan Page"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Saved Profile Connection Card */}
        <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                {candidateDisplayName}
              </span>
            </div>
            <span className="font-bold text-blue-600">{profileScore}% complete</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${profileScore}%` }}
            ></div>
          </div>
        </div>

        {/* Current Domain & Field Status Categories */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
            <span>Current Page</span>
            <span className="font-mono text-slate-600 truncate max-w-[190px]">
              {pageDomain || 'Ready on any job portal'}
            </span>
          </div>

          {/* 4 Category Badges: Matched, Ambiguous, Missing, Unsupported (Requirement 10) */}
          <div className="grid grid-cols-4 gap-1.5 mt-1 text-center">
            <div className="bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200">
              <span className="block text-base font-bold text-emerald-700">{highConfidenceMatches.length}</span>
              <span className="text-[9px] text-emerald-600 font-semibold block">Matched</span>
            </div>
            <div className="bg-amber-50/70 p-1.5 rounded-lg border border-amber-200">
              <span className="block text-base font-bold text-amber-700">{ambiguousMatches.length}</span>
              <span className="text-[9px] text-amber-600 font-semibold block">Ambiguous</span>
            </div>
            <div className="bg-purple-50/70 p-1.5 rounded-lg border border-purple-200">
              <span className="block text-base font-bold text-purple-700">{missingFields.length}</span>
              <span className="text-[9px] text-purple-600 font-semibold block">Missing</span>
            </div>
            <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
              <span className="block text-base font-bold text-slate-700">{unsupportedFields.length}</span>
              <span className="text-[9px] text-slate-500 font-semibold block">Unsupported</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {statusMessage && (
          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-4 space-y-2">
          {/* Requirement 8: Field Preview before filling */}
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center shadow-md py-2.5 font-semibold"
            disabled={totalDetected === 0}
            isLoading={autofilling}
            icon={<Eye className="w-4 h-4" />}
            onClick={() => setIsPreviewOpen(true)}
          >
            Preview & Autofill ({highConfidenceMatches.length} Ready)
          </Button>

          {missingFields.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-amber-700 border-amber-300 hover:bg-amber-50"
              icon={<AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
              onClick={() => setIsReviewOpen(true)}
            >
              Resolve Missing Questions ({missingFields.length})
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-slate-600 text-xs"
            icon={<BookmarkPlus className="w-3.5 h-3.5 text-slate-500" />}
            onClick={handleSaveJobToTracker}
          >
            {jobSaved ? '✓ Saved to Tracker!' : 'Save Job to Application Tracker'}
          </Button>
        </div>

        {/* Helpful notice */}
        {totalDetected === 0 && !loading && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span>No form fields detected on this tab. Open an application or test with our mock career portal.</span>
              <button
                onClick={openTestPortal}
                className="mt-1.5 block text-blue-600 hover:underline font-semibold"
              >
                Launch Mock Career Test Portal →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 border-t border-slate-200 mt-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-center gap-1.5 text-xs font-semibold"
          icon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={openDashboard}
        >
          Open Master Profile & Dashboard
        </Button>
      </div>

      {/* Field Preview Modal (Requirement 8, 9, 10) */}
      <FieldPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        matchedFields={matchedFields}
        missingFields={missingFields}
        unsupportedFields={unsupportedFields}
        onConfirmAutofill={handleAutofillWithPreview}
      />

      {/* Permission & Missing Information Dialog */}
      <MissingInformationDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        missingFields={missingFields}
        onApplyAndAutofill={handleReviewAndAutofill}
      />
    </div>
  );
};
