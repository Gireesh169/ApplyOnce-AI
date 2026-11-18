import React, { useState } from 'react';
import { StorageService } from '@/storage/StorageService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Download,
  Upload,
  Trash2,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Lock
} from 'lucide-react';

interface SettingsPrivacyViewProps {
  onDataReset: () => void;
}

export const SettingsPrivacyView: React.FC<SettingsPrivacyViewProps> = ({ onDataReset }) => {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExport = async () => {
    try {
      const json = await StorageService.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applyonce_profile_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Profile and configuration successfully exported as JSON!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(`Export failed: ${(err as Error).message}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const ok = await StorageService.importAllData(text);
      if (ok) {
        setSuccessMessage('Profile and data restored successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
        onDataReset();
      } else {
        setErrorMessage('Failed to restore: Invalid backup file format.');
      }
    } catch (err) {
      setErrorMessage(`Import error: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleClearCustomFields = async () => {
    if (confirm('Delete all adaptive custom fields? Your standard profile will remain intact.')) {
      await chrome?.storage?.local?.set({ applyonce_custom_fields: [] });
      setSuccessMessage('All adaptive custom fields cleared.');
      setTimeout(() => setSuccessMessage(''), 3000);
      onDataReset();
    }
  };

  const handleResetLearnedMemory = async () => {
    if (confirm('Reset learned field mappings? ApplyOnce AI will re-ask confirmation on new portals.')) {
      await StorageService.resetLearnedMappings();
      setSuccessMessage('Learned field mappings successfully reset.');
      setTimeout(() => setSuccessMessage(''), 3000);
      onDataReset();
    }
  };

  const handleFactoryReset = async () => {
    if (confirm('⚠️ WARNING: This will permanently delete your entire profile, custom fields, and applications from your browser. Are you sure?')) {
      await StorageService.clearAllData();
      setSuccessMessage('All local profile data deleted. Reset complete.');
      setTimeout(() => setSuccessMessage(''), 4000);
      onDataReset();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Privacy, Security & Data Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Export, backup, or reset your local-first career profile data at any time.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Security Architecture Guarantees */}
      <Card title="Security & Architecture Guarantees" subtitle="Built with zero-trust local isolation">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
              <HardDrive className="w-4 h-4 text-blue-600" />
              100% Local-First
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your profile, resumes, and answers never leave your browser unless you submit an application yourself.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
              <Lock className="w-4 h-4 text-emerald-600" />
              Zero Sensitive Fields
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Passwords, credit cards, OTPs, CAPTCHAs, and session tokens are strictly ignored by the detection engine.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Manual Submissions Only
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ApplyOnce AI fills form values for your review and never submits applications automatically.
            </p>
          </div>
        </div>
      </Card>

      {/* Data Backup & Restore */}
      <Card title="Data Portability & Backup" subtitle="Download a full JSON backup of your profile to migrate to another machine">
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            variant="outline"
            size="md"
            icon={<Download className="w-4 h-4 text-blue-600" />}
            onClick={handleExport}
          >
            Export Complete Profile (JSON)
          </Button>

          <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer shadow-2xs transition-colors">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Restore from JSON Backup</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </Card>

      {/* Reset & Wipe Options */}
      <Card title="Selective Data Reset" subtitle="Clear adaptive cache or restore factory state">
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Clear Adaptive Custom Fields</h4>
              <p className="text-[11px] text-slate-500">Deletes questions remembered from company questionnaires.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearCustomFields}>
              Clear Fields
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Reset Universal Field Memory</h4>
              <p className="text-[11px] text-slate-500">Deletes learned domain-specific selector mappings.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetLearnedMemory}>
              Reset Memory
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50/60 rounded-lg border border-red-200">
            <div>
              <h4 className="text-xs font-semibold text-red-900">Factory Reset (Wipe All Data)</h4>
              <p className="text-[11px] text-red-600">Permanently clears your profile, resumes, tracker, and settings.</p>
            </div>
            <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleFactoryReset}>
              Delete All Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
