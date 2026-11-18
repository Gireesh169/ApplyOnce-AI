import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MatchedFormField, MissingFormField, UnsupportedFormField } from '@/adaptive/types';
import {
  Sparkles,
  Check,
  AlertTriangle,
  HelpCircle,
  Ban,
  CheckCircle2,
  Edit2,
  ShieldAlert
} from 'lucide-react';

export interface PreviewFieldItem {
  id: string;
  selector: string;
  label: string;
  name: string;
  type: string;
  currentValue: string;
  proposedValue: string;
  status: 'matched' | 'ambiguous' | 'missing' | 'unsupported';
  confidenceScore: number;
  reason: string;
  selected: boolean;
  unsupportedReason?: string;
}

interface FieldPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedFields: MatchedFormField[];
  missingFields: MissingFormField[];
  unsupportedFields?: UnsupportedFormField[];
  onConfirmAutofill: (
    itemsToFill: Array<{ selector: string; value: any; type: string; allowOverwrite: boolean }>,
    overwriteExisting: boolean
  ) => void;
}

export const FieldPreviewModal: React.FC<FieldPreviewModalProps> = ({
  isOpen,
  onClose,
  matchedFields,
  missingFields,
  unsupportedFields = [],
  onConfirmAutofill
}) => {
  const [filter, setFilter] = useState<'all' | 'matched' | 'ambiguous' | 'missing' | 'unsupported'>('all');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);
  const [fieldItems, setFieldItems] = useState<PreviewFieldItem[]>([]);

  useEffect(() => {
    const items: PreviewFieldItem[] = [];

    // 1. Matched fields
    matchedFields.forEach((m) => {
      const isAmbiguous = m.isAmbiguous || m.confidence === 'medium';
      items.push({
        id: m.detectedField.id,
        selector: m.detectedField.selector,
        label: m.detectedField.label || m.detectedField.name,
        name: m.detectedField.name,
        type: m.detectedField.type,
        currentValue: m.detectedField.currentValue || '',
        proposedValue: String(m.suggestedValue || ''),
        status: isAmbiguous ? 'ambiguous' : 'matched',
        confidenceScore: m.confidenceScore,
        reason: m.matchReason,
        // Selected by default if matched, unselected if ambiguous
        selected: !isAmbiguous && Boolean(m.suggestedValue)
      });
    });

    // 2. Missing fields
    missingFields.forEach((mf) => {
      // Avoid duplicate if already in matched
      if (!items.some(i => i.id === mf.detectedField.id)) {
        items.push({
          id: mf.detectedField.id,
          selector: mf.detectedField.selector,
          label: mf.websiteQuestion || mf.detectedField.label || mf.detectedField.name,
          name: mf.detectedField.name,
          type: mf.detectedField.type,
          currentValue: mf.detectedField.currentValue || '',
          proposedValue: String(mf.suggestedExistingInformation?.value || ''),
          status: 'missing',
          confidenceScore: 0,
          reason: 'Field not found in master profile',
          selected: false
        });
      }
    });

    // 3. Unsupported fields
    unsupportedFields.forEach((uf) => {
      items.push({
        id: uf.id,
        selector: uf.selector || '',
        label: uf.label || uf.name,
        name: uf.name,
        type: uf.type,
        currentValue: '',
        proposedValue: '',
        status: 'unsupported',
        confidenceScore: 0,
        reason: uf.reason,
        selected: false,
        unsupportedReason: uf.reason
      });
    });

    setFieldItems(items);
  }, [matchedFields, missingFields, unsupportedFields, isOpen]);

  const toggleSelect = (id: string) => {
    setFieldItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateProposedValue = (id: string, value: string) => {
    setFieldItems(prev =>
      prev.map(item => (item.id === id ? { ...item, proposedValue: value, selected: true } : item))
    );
  };

  const selectAll = (select: boolean) => {
    setFieldItems(prev =>
      prev.map(item => (item.status === 'unsupported' ? item : { ...item, selected: select }))
    );
  };

  const handleConfirm = () => {
    const selectedFillable = fieldItems
      .filter(item => item.selected && item.status !== 'unsupported' && item.proposedValue)
      .map(item => ({
        selector: item.selector,
        value: item.proposedValue,
        type: item.type,
        allowOverwrite: overwriteExisting
      }));

    onConfirmAutofill(selectedFillable, overwriteExisting);
    onClose();
  };

  const matchedCount = fieldItems.filter(i => i.status === 'matched').length;
  const ambiguousCount = fieldItems.filter(i => i.status === 'ambiguous').length;
  const missingCount = fieldItems.filter(i => i.status === 'missing').length;
  const unsupportedCount = fieldItems.filter(i => i.status === 'unsupported').length;
  const selectedCount = fieldItems.filter(i => i.selected && i.status !== 'unsupported').length;

  const filteredItems = fieldItems.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Field Autofill Preview"
      subtitle="Inspect matched, missing, ambiguous and unsupported fields before applying them to the webpage."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Category Pills & Overwrite Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Fields ({fieldItems.length})
            </button>
            <button
              onClick={() => setFilter('matched')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === 'matched'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Matched ({matchedCount})
            </button>
            <button
              onClick={() => setFilter('ambiguous')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === 'ambiguous'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Ambiguous ({ambiguousCount})
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                filter === 'missing'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Missing ({missingCount})
            </button>
            {unsupportedCount > 0 && (
              <button
                onClick={() => setFilter('unsupported')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filter === 'unsupported'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Unsupported ({unsupportedCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => selectAll(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => selectAll(false)}
              className="text-slate-500 hover:underline font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Overwrite Preservation Notice & Toggle (Requirement 9) */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <label htmlFor="overwrite-toggle" className="font-semibold text-slate-800 cursor-pointer block">
                Overwrite pre-existing website values
              </label>
              <p className="text-[11px] text-slate-500">
                Disabled by default to protect text you have already typed into the portal.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            id="overwrite-toggle"
            checked={overwriteExisting}
            onChange={(e) => setOverwriteExisting(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Fields Table / List */}
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No fields in this category.
            </div>
          ) : (
            filteredItems.map((item) => {
              const hasExisting = Boolean(item.currentValue && item.currentValue.trim().length > 0);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    item.status === 'unsupported'
                      ? 'bg-slate-50/70 opacity-80'
                      : item.selected
                      ? 'bg-blue-50/20'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="pt-0.5">
                    {item.status !== 'unsupported' ? (
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    ) : (
                      <Ban className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Field Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {item.label}
                      </span>
                      {item.status === 'matched' && (
                        <Badge variant="green" size="sm">
                          Matched ({Math.round(item.confidenceScore * 100)}%)
                        </Badge>
                      )}
                      {item.status === 'ambiguous' && (
                        <Badge variant="yellow" size="sm">
                          Ambiguous Match
                        </Badge>
                      )}
                      {item.status === 'missing' && (
                        <Badge variant="purple" size="sm">
                          Missing in Profile
                        </Badge>
                      )}
                      {item.status === 'unsupported' && (
                        <Badge variant="red" size="sm">
                          Unsupported
                        </Badge>
                      )}
                    </div>

                    {/* Existing vs Proposed Value */}
                    {item.status !== 'unsupported' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Website Current Value
                          </span>
                          {hasExisting ? (
                            <span className="text-amber-700 font-medium font-mono text-[11px] truncate block">
                              "{item.currentValue}"
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Empty (ready to fill)</span>
                          )}
                        </div>

                        <div className="p-1.5 bg-white rounded border border-blue-200 focus-within:ring-1 focus-within:ring-blue-500">
                          <span className="text-[10px] text-blue-600 uppercase font-semibold block px-1">
                            Proposed Value (Editable)
                          </span>
                          <input
                            type="text"
                            value={item.proposedValue}
                            onChange={(e) => updateProposedValue(item.id, e.target.value)}
                            placeholder={item.status === 'missing' ? 'Type value to autofill...' : ''}
                            className="w-full px-1 py-0.5 text-xs font-mono text-slate-900 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-red-50/50 rounded border border-red-200 text-xs text-red-700">
                        <strong>Reason:</strong> {item.unsupportedReason}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Selector: <code className="bg-slate-100 px-1 rounded">{item.selector || item.name}</code></span>
                      <span>•</span>
                      <span>{item.reason}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            <strong>{selectedCount}</strong> fields selected to autofill
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={selectedCount === 0}
              icon={<Check className="w-4 h-4" />}
              onClick={handleConfirm}
            >
              Autofill {selectedCount} Selected Fields
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
