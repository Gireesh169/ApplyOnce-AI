import React, { useState, useEffect } from 'react';
import { LearnedFieldMapping } from '@/memory/types';
import { FieldLearningService } from '@/memory/FieldLearningService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Brain, Trash2, Pencil, RotateCcw, ShieldCheck, Plus, Check } from 'lucide-react';

export const FieldMappingsView: React.FC = () => {
  const [mappings, setMappings] = useState<LearnedFieldMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingMapping, setEditingMapping] = useState<LearnedFieldMapping | null>(null);

  // Form State
  const [signature, setSignature] = useState<string>('');
  const [semantic, setSemantic] = useState<string>('');
  const [targetPath, setTargetPath] = useState<string>('');
  const [domain, setDomain] = useState<string>('*');

  const loadMappings = async () => {
    setLoading(true);
    const list = await FieldLearningService.getMappings();
    setMappings(list);
    setLoading(false);
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const openEditModal = (m: LearnedFieldMapping) => {
    setEditingMapping(m);
    setSignature(m.fieldSignature);
    setSemantic(m.semanticMeaning);
    setTargetPath(m.matchedProfilePath);
    setDomain(m.websiteDomain);
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMapping) {
      await FieldLearningService.updateMapping(editingMapping.id, {
        semanticMeaning: semantic,
        matchedProfilePath: targetPath,
        websiteDomain: domain
      });
    } else {
      await FieldLearningService.recordConfirmedMapping(
        signature,
        semantic,
        targetPath,
        domain,
        true
      );
    }
    setEditingMapping(null);
    await loadMappings();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this learned mapping?')) {
      await FieldLearningService.deleteMapping(id);
      await loadMappings();
    }
  };

  const handleResetAll = async () => {
    if (confirm('Reset all learned mappings? This cannot be undone.')) {
      await FieldLearningService.resetMappings();
      await loadMappings();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Universal Field Memory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Learned and confirmed semantic mappings remembered across job portals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mappings.length > 0 && (
            <Button variant="outline" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleResetAll}>
              Reset Memory
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingMapping(null);
              setSignature('');
              setSemantic('Custom Mapping');
              setTargetPath('personal.firstName');
              setDomain('*');
            }}
          >
            Add Mapping Rule
          </Button>
        </div>
      </div>

      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Privacy Safeguard:</strong> Field memory only stores semantic relationships (e.g. <code>institution</code> → <code>education.institution</code>) and never stores actual personal values in the dictionary.
        </span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Loading field memory...</div>
      ) : mappings.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No learned mappings yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            As you autofill and confirm questions on Greenhouse, Lever, and Workday, ApplyOnce remembers your confirmed mappings so you never have to re-map them.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mappings.map((m) => (
            <Card key={m.id} className="hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {m.fieldSignature}
                    </span>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {m.matchedProfilePath}
                    </span>
                    <Badge variant={m.websiteDomain === '*' ? 'purple' : 'blue'} size="sm">
                      {m.websiteDomain === '*' ? 'Universal' : m.websiteDomain}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span>Used {m.usageCount || 1} time(s)</span>
                    <span>Last used: {new Date(m.lastUsedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
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

      {/* Edit / Add Modal */}
      <Modal
        isOpen={editingMapping !== null || signature !== ''}
        onClose={() => {
          setEditingMapping(null);
          setSignature('');
        }}
        title={editingMapping ? 'Edit Field Mapping' : 'Add Learned Field Mapping'}
        subtitle="Associate a portal input signature with a profile data path."
        maxWidth="md"
      >
        <form onSubmit={handleSaveMapping} className="space-y-4">
          <Input
            label="Field Signature (Input Name, ID, or Label) *"
            required
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="e.g. college_name or university"
          />

          <Input
            label="Target Profile Path *"
            required
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            placeholder="e.g. education.institution or custom.clearance"
            helperText="Matches field inside your profile"
          />

          <Input
            label="Scope / Website Domain (* for universal)"
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. * or boards.greenhouse.io"
          />

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setEditingMapping(null);
                setSignature('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Mapping
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
