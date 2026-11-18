import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MissingFormField } from '@/adaptive/types';
import { MissingFieldService } from '@/adaptive/MissingFieldService';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';

interface MissingInformationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: MissingFormField[];
  onApplyAndAutofill: (
    completedFields: Array<{
      missingField: MissingFormField;
      userValue: any;
      action: 'save_permanent' | 'use_once' | 'skip' | 'not_applicable';
    }>
  ) => void;
}

export const MissingInformationDialog: React.FC<MissingInformationDialogProps> = ({
  isOpen,
  onClose,
  missingFields,
  onApplyAndAutofill
}) => {
  // Local state for each missing field's input and action
  const [fieldStates, setFieldStates] = useState<
    Record<
      string,
      {
        value: string;
        action: 'save_permanent' | 'use_once' | 'skip' | 'not_applicable';
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    missingFields.forEach((mf) => {
      initial[mf.id] = {
        value: mf.suggestedExistingInformation?.value || '',
        action: mf.suggestedExistingInformation ? 'use_once' : 'save_permanent'
      };
    });
    return initial;
  });

  const handleValueChange = (id: string, value: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        value
      }
    }));
  };

  const handleActionChange = (
    id: string,
    action: 'save_permanent' | 'use_once' | 'skip' | 'not_applicable'
  ) => {
    setFieldStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        action
      }
    }));
  };

  const handleSubmit = async () => {
    const payload = missingFields.map((mf) => {
      const state = fieldStates[mf.id] || { value: '', action: 'skip' };
      return {
        missingField: mf,
        userValue: state.value,
        action: state.action
      };
    });

    // Save permanently approved fields into custom fields
    await MissingFieldService.processUserConsentedFields(payload);

    onApplyAndAutofill(payload);
    onClose();
  };

  if (missingFields.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Information Requested"
      subtitle="This portal is asking questions not found in your standard profile. Review and consent to save for future applications."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Explicit Consent Required:</strong> ApplyOnce AI never invents information or saves profile data without your permission. Choose how to handle each field below.
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
          {missingFields.map((mf, index) => {
            const state = fieldStates[mf.id] || { value: '', action: 'save_permanent' };
            const hasSuggestion = !!mf.suggestedExistingInformation;

            return (
              <div key={mf.id} className={`py-4 ${index === 0 ? 'pt-0' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{index + 1}.</span> {mf.websiteQuestion}
                  </span>
                  {hasSuggestion ? (
                    <Badge variant="yellow" size="sm">
                      Medium Confidence Match
                    </Badge>
                  ) : (
                    <Badge variant="blue" size="sm">
                      Brand New Field
                    </Badge>
                  )}
                </div>

                {hasSuggestion && (
                  <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Suggested profile value:</span>{' '}
                      <strong>{String(mf.suggestedExistingInformation?.value)}</strong>
                    </div>
                    <span className="text-[11px] text-amber-700 font-medium">
                      {mf.suggestedExistingInformation?.label}
                    </span>
                  </div>
                )}

                {/* Input value */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={state.value}
                    onChange={(e) => handleValueChange(mf.id, e.target.value)}
                    placeholder={`Enter value for "${mf.websiteQuestion}"...`}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Action Choices */}
                <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                  <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                    state.action === 'save_permanent'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name={`action_${mf.id}`}
                      checked={state.action === 'save_permanent'}
                      onChange={() => handleActionChange(mf.id, 'save_permanent')}
                      className="sr-only"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Save Permanently to Profile
                  </label>

                  <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                    state.action === 'use_once'
                      ? 'bg-slate-100 border-slate-400 text-slate-800 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name={`action_${mf.id}`}
                      checked={state.action === 'use_once'}
                      onChange={() => handleActionChange(mf.id, 'use_once')}
                      className="sr-only"
                    />
                    Use Once Only
                  </label>

                  <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                    state.action === 'skip'
                      ? 'bg-slate-100 border-slate-400 text-slate-800 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name={`action_${mf.id}`}
                      checked={state.action === 'skip'}
                      onChange={() => handleActionChange(mf.id, 'skip')}
                      className="sr-only"
                    />
                    Skip
                  </label>

                  <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                    state.action === 'not_applicable'
                      ? 'bg-slate-100 border-slate-400 text-slate-800 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name={`action_${mf.id}`}
                      checked={state.action === 'not_applicable'}
                      onChange={() => handleActionChange(mf.id, 'not_applicable')}
                      className="sr-only"
                    />
                    Not Applicable
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" icon={<Check className="w-4 h-4" />} onClick={handleSubmit}>
              Confirm & Autofill Form
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
