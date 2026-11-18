import { ResumeDocument } from '@/resume/types';

const DB_NAME = 'ApplyOnceAI_DB';
const DB_VERSION = 1;
const RESUMES_STORE = 'resumes';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(RESUMES_STORE)) {
        db.createObjectStore(RESUMES_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const ResumeStorageDB = {
  async getAllResumes(): Promise<ResumeDocument[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(RESUMES_STORE, 'readonly');
        const store = tx.objectStore(RESUMES_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('Fallback to memory for IndexedDB:', e);
      return [];
    }
  },

  async saveResume(resume: ResumeDocument): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RESUMES_STORE, 'readwrite');
      const store = tx.objectStore(RESUMES_STORE);
      const request = store.put(resume);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteResume(id: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RESUMES_STORE, 'readwrite');
      const store = tx.objectStore(RESUMES_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getResumeById(id: string): Promise<ResumeDocument | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RESUMES_STORE, 'readonly');
      const store = tx.objectStore(RESUMES_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
};
