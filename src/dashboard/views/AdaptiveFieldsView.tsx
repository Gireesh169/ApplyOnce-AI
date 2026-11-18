import React, { useState, useEffect } from 'react';
import { CustomField, CustomFieldCategory } from '@/adaptive/types';
import { StorageService } from '@/storage/StorageService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Plus, Sparkles, Trash2, Pencil, Shield, CheckCircle } from 'lucide-react';

export const AdaptiveFieldsView: React.FC = () => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  // Form State
  const [fieldKey, setFieldKey] = useState<string>('');
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [category, setCategory] = useState<CustomFieldCategory>('Additional Information');
  const [dataType, setDataType] = useState<CustomField['dataType']>('text');

  const loadCustomFields = async () => {
    setLoading(true);
    const fields = await StorageService.getCustomFields();
    setCustomFields(fields);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomFields();
  }, []);

  const openAddModal = () => {
    setEditingField(null);
    setFieldKey('');
    setDisplayLabel('');
    setValue('');
    setCategory('Additional Information');
    setDataType('text');
    setIsModalOpen(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
    setFieldKey(field.fieldKey);
    setDisplayLabel(field.displayLabel);
    setValue(String(field.value));
    setCategory(field.category);
    setDataType(field.dataType);
    setIsModalOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanKey = fieldKey
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_');

    const field: CustomField = {
      id: editingField ? editingField.id : `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fieldKey: cleanKey || `field_${Date.now()}`,
      displayLabel,
      value,
      category,
      dataType,
      source: editingField ? editingField.source : 'manual',
      createdAt: editingField ? editingField.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userConsentStatus: 'approved',
      sensitivityClassification: category === 'Compensation' || category === 'Legal' ? 'confidential' : 'standard'
    };

    await StorageService.saveCustomField(field);
    await loadCustomFields();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this custom field? It will no longer be autofilled.')) {
      await StorageService.deleteCustomField(id);
      await loadCustomFields();
    }
  };

  const filteredFields = selectedCategory === 'All'
    ? customFields
    : customFields.filter(f => f.category === selectedCategory);

  const categories: Array<CustomFieldCategory | 'All'> = [
    'All',
    'Personal',
    'Legal',
    'Contact',
    'Education',
    'Employment',
    'Compensation',
    'Work Authorization',
    'Preferences',
    'Additional Information'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Adaptive Profile Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic custom fields learned and confirmed across different company career portals.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Custom Field
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat} {cat === 'All' ? `(${customFields.length})` : ''}
          </button>
        ))}
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Loading custom fields...</div>
      ) : filteredFields.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No adaptive custom fields yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            When you apply on company portals that ask unique questions (e.g. security clearance, favorite editor, specific certifications), ApplyOnce AI remembers your answers here.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Create Custom Field
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFields.map((field) => (
            <Card key={field.id} className="hover:border-purple-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{field.displayLabel}</h4>
                    <Badge variant="purple" size="sm">{field.category}</Badge>
                    <Badge variant={field.userConsentStatus === 'approved' ? 'green' : 'yellow'} size="sm">
                      {field.userConsentStatus}
                    </Badge>
                  </div>

                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium">
                    Value: <span className="font-mono text-blue-700">{String(field.value)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span>Key: <code className="bg-slate-100 px-1 rounded">{field.fieldKey}</code></span>
                    <span>Type: {field.dataType}</span>
                    <span>Source: {field.source}</span>
                    <span>Updated: {new Date(field.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(field)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingField ? 'Edit Adaptive Custom Field' : 'Add Adaptive Custom Field'}
        subtitle="Define custom fields for company portal questionnaires."
        maxWidth="md"
      >
        <form onSubmit={handleSaveField} className="space-y-4">
          <Input
            label="Question / Display Label *"
            required
            value={displayLabel}
            onChange={(e) => {
              setDisplayLabel(e.target.value);
              if (!editingField) {
                setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
              }
            }}
            placeholder="e.g. Security Clearance Level"
          />

          <Input
            label="Field Key / Identifier *"
            required
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            placeholder="e.g. security_clearance"
            helperText="Used internally for semantic matching"
          />

          <Input
            label="Field Value *"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Top Secret (TS/SCI) or Active"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data Type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean (Yes/No)</option>
                <option value="select">Dropdown Selection</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingField ? 'Update Field' : 'Save Custom Field'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
