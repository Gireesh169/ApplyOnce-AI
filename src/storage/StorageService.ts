import { UserProfile, createEmptyProfile } from '@/profile/types';
import { CustomField } from '@/adaptive/types';
import { LearnedFieldMapping } from '@/memory/types';
import { JobApplication } from '@/applications/types';

export interface UserSettings {
  autoInspectForms: boolean;
  highlightFilledFields: boolean;
  saveNewMappingsByDefault: boolean;
  showConfidenceScores: boolean;
  theme: 'light' | 'dark' | 'system';
  telemetryEnabled: boolean; // Always false by default for privacy
}

export const defaultSettings: UserSettings = {
  autoInspectForms: true,
  highlightFilledFields: true,
  saveNewMappingsByDefault: false, // Requires explicit consent
  showConfidenceScores: true,
  theme: 'light',
  telemetryEnabled: false
};

const STORAGE_KEYS = {
  PROFILE: 'applyonce_user_profile',
  CUSTOM_FIELDS: 'applyonce_custom_fields',
  LEARNED_MAPPINGS: 'applyonce_learned_mappings',
  APPLICATIONS: 'applyonce_applications',
  SETTINGS: 'applyonce_settings'
} as const;

// Helper to check if Chrome Storage is available
const isChromeStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
};

// Generic get from storage
async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError || !result || result[key] === undefined) {
          resolve(defaultValue);
        } else {
          resolve(result[key] as T);
        }
      });
    });
  } else {
    // Fallback to localStorage in web preview/test mode
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

// Generic set to storage
async function setStorageItem<T>(key: string, value: T): Promise<void> {
  if (isChromeStorageAvailable()) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } else {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }
}

export const StorageService = {
  // Profile
  async getProfile(): Promise<UserProfile> {
    const profile = await getStorageItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
    if (!profile) {
      const initial = createEmptyProfile();
      await setStorageItem(STORAGE_KEYS.PROFILE, initial);
      return initial;
    }
    return profile;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    profile.updatedAt = new Date().toISOString();
    await setStorageItem(STORAGE_KEYS.PROFILE, profile);
  },

  // Custom Fields (Adaptive Intelligence)
  async getCustomFields(): Promise<CustomField[]> {
    return await getStorageItem<CustomField[]>(STORAGE_KEYS.CUSTOM_FIELDS, []);
  },

  async saveCustomField(field: CustomField): Promise<void> {
    const fields = await this.getCustomFields();
    const existingIndex = fields.findIndex(f => f.id === field.id || f.fieldKey === field.fieldKey);
    if (existingIndex >= 0) {
      fields[existingIndex] = { ...field, updatedAt: new Date().toISOString() };
    } else {
      fields.push(field);
    }
    await setStorageItem(STORAGE_KEYS.CUSTOM_FIELDS, fields);
  },

  async saveMultipleCustomFields(newFields: CustomField[]): Promise<void> {
    const fields = await this.getCustomFields();
    for (const nf of newFields) {
      const idx = fields.findIndex(f => f.id === nf.id || f.fieldKey === nf.fieldKey);
      if (idx >= 0) {
        fields[idx] = { ...nf, updatedAt: new Date().toISOString() };
      } else {
        fields.push(nf);
      }
    }
    await setStorageItem(STORAGE_KEYS.CUSTOM_FIELDS, fields);
  },

  async deleteCustomField(id: string): Promise<void> {
    const fields = await this.getCustomFields();
    const updated = fields.filter(f => f.id !== id);
    await setStorageItem(STORAGE_KEYS.CUSTOM_FIELDS, updated);
  },

  // Universal Field Memory (Learned Mappings)
  async getLearnedMappings(): Promise<LearnedFieldMapping[]> {
    return await getStorageItem<LearnedFieldMapping[]>(STORAGE_KEYS.LEARNED_MAPPINGS, []);
  },

  async saveLearnedMapping(mapping: LearnedFieldMapping): Promise<void> {
    const mappings = await this.getLearnedMappings();
    const existingIndex = mappings.findIndex(
      m => (m.websiteDomain === mapping.websiteDomain || m.websiteDomain === '*') &&
           m.fieldSignature === mapping.fieldSignature
    );
    if (existingIndex >= 0) {
      mappings[existingIndex] = {
        ...mappings[existingIndex],
        ...mapping,
        lastUsedAt: new Date().toISOString(),
        usageCount: (mappings[existingIndex].usageCount || 1) + 1
      };
    } else {
      mappings.push(mapping);
    }
    await setStorageItem(STORAGE_KEYS.LEARNED_MAPPINGS, mappings);
  },

  async deleteLearnedMapping(id: string): Promise<void> {
    const mappings = await this.getLearnedMappings();
    const updated = mappings.filter(m => m.id !== id);
    await setStorageItem(STORAGE_KEYS.LEARNED_MAPPINGS, updated);
  },

  async resetLearnedMappings(): Promise<void> {
    await setStorageItem(STORAGE_KEYS.LEARNED_MAPPINGS, []);
  },

  // Applications
  async getApplications(): Promise<JobApplication[]> {
    return await getStorageItem<JobApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
  },

  async saveApplication(app: JobApplication): Promise<void> {
    const apps = await this.getApplications();
    const idx = apps.findIndex(a => a.id === app.id);
    if (idx >= 0) {
      apps[idx] = { ...app, updatedAt: new Date().toISOString() };
    } else {
      apps.unshift(app);
    }
    await setStorageItem(STORAGE_KEYS.APPLICATIONS, apps);
  },

  async deleteApplication(id: string): Promise<void> {
    const apps = await this.getApplications();
    const updated = apps.filter(a => a.id !== id);
    await setStorageItem(STORAGE_KEYS.APPLICATIONS, updated);
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    return await getStorageItem<UserSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    await setStorageItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // Export / Import / Privacy Reset
  async exportAllData(): Promise<string> {
    const [profile, customFields, learnedMappings, applications, settings] = await Promise.all([
      this.getProfile(),
      this.getCustomFields(),
      this.getLearnedMappings(),
      this.getApplications(),
      this.getSettings()
    ]);

    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        profile,
        customFields,
        learnedMappings,
        applications,
        settings
      },
      null,
      2
    );
  },

  async importAllData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.profile || !data.profile.personal) {
        throw new Error('Invalid backup schema: missing profile personal data');
      }

      if (data.profile) await this.saveProfile(data.profile);
      if (Array.isArray(data.customFields)) await setStorageItem(STORAGE_KEYS.CUSTOM_FIELDS, data.customFields);
      if (Array.isArray(data.learnedMappings)) await setStorageItem(STORAGE_KEYS.LEARNED_MAPPINGS, data.learnedMappings);
      if (Array.isArray(data.applications)) await setStorageItem(STORAGE_KEYS.APPLICATIONS, data.applications);
      if (data.settings) await this.saveSettings(data.settings);

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  },

  async clearAllData(): Promise<void> {
    if (isChromeStorageAvailable()) {
      await new Promise<void>((resolve) => chrome.storage.local.clear(resolve));
    } else {
      localStorage.clear();
    }
  }
};
