import React, { useState, useEffect, useRef } from 'react';
import { ResumeDocument, ExtractedResumeData } from '@/resume/types';
import { ResumeService } from '@/resume/ResumeService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PDFExtractor } from '@/resume/pdfExtractor';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Eye,
  Check,
  Star,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Loader2,
  FolderOpen
} from 'lucide-react';

interface ResumeManagerViewProps {
  onProfileUpdated: () => void;
}

type UploadStatus = 'idle' | 'reading' | 'extracting' | 'parsing' | 'review' | 'success' | 'error';

export const ResumeManagerView: React.FC<ResumeManagerViewProps> = ({ onProfileUpdated }) => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewResume, setPreviewResume] = useState<ResumeDocument | null>(null);

  // File upload state & status tracking
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string>('');

  // Extracted Suggestions Approval Modal State
  const [extractedData, setExtractedData] = useState<ExtractedResumeData | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState<boolean>(false);
  const [approvedSections, setApprovedSections] = useState({
    name: true,
    contact: true,
    skills: true,
    education: true,
    experience: true,
    projects: true
  });

  const loadResumes = async () => {
    setLoading(true);
    try {
      const list = await ResumeService.getResumes();
      setResumes(list);
    } catch (e) {
      console.warn('Error loading resumes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  // Trigger file selection programmatically via button click
  const triggerFilePicker = () => {
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadError('');

    // Validate MIME type and file extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadStatus('error');
      setUploadError(`"${file.name}" is not a PDF file. Please upload a valid .pdf document.`);
      return;
    }

    if (file.size === 0) {
      setUploadStatus('error');
      setUploadError('The selected file is empty (0 bytes). Please select a valid resume document.');
      return;
    }

    try {
      setUploadStatus('reading');
      setStatusText(`Reading ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);

      // Read file buffer
      const arrayBuffer = await file.arrayBuffer();

      setUploadStatus('extracting');
      setStatusText('Extracting text with PDF.js client engine...');
      const textContent = await PDFExtractor.extractTextFromPDF(arrayBuffer);

      setUploadStatus('parsing');
      setStatusText('Parsing sections: name, phone, email, education, experience, skills, projects...');
      const parsed = PDFExtractor.parseResumeText(textContent);

      // Save to IndexedDB
      setStatusText('Saving master document to IndexedDB storage...');
      await ResumeService.uploadResume(file);
      await loadResumes();

      setUploadStatus('review');
      setStatusText('Extraction complete. Ready for your review.');
      setExtractedData(parsed);
      setIsApprovalOpen(true);
    } catch (err: any) {
      console.error('Resume processing error:', err);
      setUploadStatus('error');
      setUploadError(err.message || 'An error occurred during resume processing.');
    }
  };

  const handleApplyToProfile = async () => {
    if (!extractedData) return;

    try {
      await ResumeService.applyApprovedResumeDataToProfile(extractedData, approvedSections);
      setIsApprovalOpen(false);
      setUploadStatus('success');
      setImportSuccessMessage('Approved resume sections successfully merged into your profile!');
      setTimeout(() => {
        setImportSuccessMessage('');
        setUploadStatus('idle');
        setSelectedFileName('');
      }, 5000);
      onProfileUpdated();
    } catch (e: any) {
      alert(`Failed to apply profile data: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this resume from local IndexedDB?')) {
      await ResumeService.deleteResume(id);
      await loadResumes();
    }
  };

  const handleSetDefault = async (id: string) => {
    await ResumeService.setDefaultResume(id);
    await loadResumes();
  };

  const handleOpenPdf = (res: ResumeDocument) => {
    const url = ResumeService.createResumeBlobUrl(res);
    if (url) {
      window.open(url, '_blank');
    } else {
      setPreviewResume(res);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Master Resume Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Store multiple versions of your resume in IndexedDB with local-only parsing.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<UploadCloud className="w-4 h-4" />}
          onClick={triggerFilePicker}
          disabled={uploadStatus === 'reading' || uploadStatus === 'extracting' || uploadStatus === 'parsing'}
        >
          Upload PDF Resume
        </Button>
      </div>

      {/* Status & Error Alerts */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Upload Failed:</strong> {uploadError}
          </div>
          <button
            onClick={() => { setUploadError(''); setUploadStatus('idle'); }}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {importSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{importSuccessMessage}</span>
        </div>
      )}

      {/* Active Upload / Extraction Progress Card */}
      {(uploadStatus === 'reading' || uploadStatus === 'extracting' || uploadStatus === 'parsing') && (
        <Card className="bg-blue-50/60 border border-blue-200 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">{selectedFileName}</span>
                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">{uploadStatus}</span>
              </div>
              <p className="text-xs text-blue-700 mt-0.5">{statusText}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Dropzone Card */}
      <Card className="border-dashed border-2 border-slate-300 hover:border-blue-400 bg-slate-50/50 text-center py-8 transition-colors">
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm">Upload Master Resume (PDF)</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          PDF.js extracts your work history, skills, phone, email, and education client-side. No resume data ever leaves your device.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={<FolderOpen className="w-4 h-4 text-blue-600" />}
            onClick={triggerFilePicker}
            disabled={uploadStatus === 'reading' || uploadStatus === 'extracting' || uploadStatus === 'parsing'}
          >
            {uploadStatus === 'reading' || uploadStatus === 'extracting' || uploadStatus === 'parsing'
              ? 'Processing Document...'
              : 'Choose PDF from Computer'}
          </Button>
        </div>
      </Card>

      {/* Stored Resumes List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Stored Resume Documents ({resumes.length})</h3>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading stored resumes...</div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-8 text-xs text-slate-500">
            No resumes uploaded yet. Upload a PDF resume above to get started.
          </Card>
        ) : (
          <div className="space-y-3">
            {resumes.map((res) => (
              <Card key={res.id} className="hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{res.name}</h4>
                        {res.isDefault && (
                          <Badge variant="blue" size="sm">
                            <Star className="w-3 h-3 mr-1 fill-blue-600 text-blue-600" /> Default Master
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {res.fileName} • {(res.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(res.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<ExternalLink className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenPdf(res)}
                      title="Open original PDF in browser tab"
                    >
                      Open PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewResume(res)}
                      title="Inspect extracted text"
                    >
                      Preview Text
                    </Button>
                    {!res.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(res.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition-colors"
                      title="Delete resume from IndexedDB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Raw Text Preview Modal */}
      <Modal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        title={previewResume?.name || 'Resume Preview'}
        subtitle="Extracted plain text via PDF.js"
        maxWidth="xl"
      >
        <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed">
          {previewResume?.textContent}
        </div>
        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          {previewResume && (
            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => handleOpenPdf(previewResume)}
            >
              Open Original PDF
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setPreviewResume(null)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Extracted Profile Import Approval Modal */}
      <Modal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        title="Resume Extracted: Review & Import"
        subtitle="ApplyOnce AI extracted the following structured sections from your PDF. Select which sections to add to your master profile."
        maxWidth="lg"
      >
        {extractedData && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>User Consent Guarantee:</strong> Extracted fields are only merged into your profile if you select them below. Unselected sections will be discarded.
              </span>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {/* Name */}
              {extractedData.name && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={approvedSections.name}
                    onChange={(e) => setApprovedSections(prev => ({ ...prev, name: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Candidate Name</span>
                    <span className="text-xs text-slate-600">{extractedData.name}</span>
                  </div>
                </label>
              )}

              {/* Contact */}
              {(extractedData.email || extractedData.phone || extractedData.linkedIn || extractedData.github) && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={approvedSections.contact}
                    onChange={(e) => setApprovedSections(prev => ({ ...prev, contact: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Contact Information</span>
                    {extractedData.email && <span className="text-xs text-slate-600 block">Email: {extractedData.email}</span>}
                    {extractedData.phone && (
                      <span className="text-xs text-slate-600 block">
                        Phone: {extractedData.phone}
                        {extractedData.phoneCountryCode && ` (Code: ${extractedData.phoneCountryCode}, National: ${extractedData.phoneNationalNumber})`}
                      </span>
                    )}
                    {extractedData.linkedIn && <span className="text-xs text-slate-600 block">LinkedIn: {extractedData.linkedIn}</span>}
                    {extractedData.github && <span className="text-xs text-slate-600 block">GitHub: {extractedData.github}</span>}
                  </div>
                </label>
              )}

              {/* Skills */}
              {extractedData.skills && extractedData.skills.length > 0 && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={approvedSections.skills}
                    onChange={(e) => setApprovedSections(prev => ({ ...prev, skills: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Skills Detected ({extractedData.skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedData.skills.slice(0, 12).map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                          {s}
                        </span>
                      ))}
                      {extractedData.skills.length > 12 && (
                        <span className="text-[10px] text-slate-400">+{extractedData.skills.length - 12} more</span>
                      )}
                    </div>
                  </div>
                </label>
              )}

              {/* Education */}
              {extractedData.education && extractedData.education.length > 0 && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={approvedSections.education}
                    onChange={(e) => setApprovedSections(prev => ({ ...prev, education: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Education ({extractedData.education.length} records)
                    </span>
                    {extractedData.education.map((edu, idx) => (
                      <span key={idx} className="text-xs text-slate-600 block">
                        • {edu.degree} - {edu.institution} ({edu.graduationYear})
                      </span>
                    ))}
                  </div>
                </label>
              )}

              {/* Experience */}
              {extractedData.experience && extractedData.experience.length > 0 && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={approvedSections.experience}
                    onChange={(e) => setApprovedSections(prev => ({ ...prev, experience: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Experience ({extractedData.experience.length} records)
                    </span>
                    {extractedData.experience.map((exp, idx) => (
                      <span key={idx} className="text-xs text-slate-600 block">
                        • {exp.jobTitle} at {exp.company}
                      </span>
                    ))}
                  </div>
                </label>
              )}

              {/* Projects */}
              {extractedData.projects && extractedData.projects.length > 0 && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={approvedSections.projects}
                    onChange={(e) => setApprovedSections(prev => ({ ...prev, projects: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Key Projects ({extractedData.projects.length})
                    </span>
                    {extractedData.projects.map((proj, idx) => (
                      <span key={idx} className="text-xs text-slate-600 block">
                        • {proj.title}
                      </span>
                    ))}
                  </div>
                </label>
              )}
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsApprovalOpen(false)}>
                Skip Import
              </Button>
              <Button variant="primary" size="md" icon={<Check className="w-4 h-4" />} onClick={handleApplyToProfile}>
                Apply Selected to Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
