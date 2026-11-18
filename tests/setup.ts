// Setup file for Vitest
// Provides mock implementation of chrome APIs when running in test/Node/jsdom environment

const storageMap = new Map<string, any>();

(globalThis as any).chrome = {
  storage: {
    local: {
      get: (keys: string | string[] | Record<string, any> | null, callback?: (items: Record<string, any>) => void) => {
        const result: Record<string, any> = {};
        if (keys === null || keys === undefined) {
          storageMap.forEach((val, key) => {
            result[key] = val;
          });
        } else if (typeof keys === 'string') {
          if (storageMap.has(keys)) {
            result[keys] = storageMap.get(keys);
          }
        } else if (Array.isArray(keys)) {
          keys.forEach(k => {
            if (storageMap.has(k)) {
              result[k] = storageMap.get(k);
            }
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(k => {
            result[k] = storageMap.has(k) ? storageMap.get(k) : keys[k];
          });
        }

        if (callback) {
          callback(result);
          return;
        }
        return Promise.resolve(result);
      },
      set: (items: Record<string, any>, callback?: () => void) => {
        Object.entries(items).forEach(([key, value]) => {
          storageMap.set(key, JSON.parse(JSON.stringify(value)));
        });
        if (callback) {
          callback();
          return;
        }
        return Promise.resolve();
      },
      remove: (keys: string | string[], callback?: () => void) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        arr.forEach(k => storageMap.delete(k));
        if (callback) {
          callback();
          return;
        }
        return Promise.resolve();
      },
      clear: (callback?: () => void) => {
        storageMap.clear();
        if (callback) {
          callback();
          return;
        }
        return Promise.resolve();
      }
    }
  },
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    },
    onMessage: {
      addListener: () => {},
      removeListener: () => {}
    },
    getURL: (path: string) => `chrome-extension://mock-id/${path}`,
    openOptionsPage: () => {}
  },
  tabs: {
    query: (_queryInfo: any, callback?: (tabs: any[]) => void) => {
      const mockTabs = [{ id: 1, url: 'https://boards.greenhouse.io/test-company/jobs/123', active: true }];
      if (callback) callback(mockTabs);
      return Promise.resolve(mockTabs);
    },
    sendMessage: (_tabId: number, _message: any, callback?: (response: any) => void) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    },
    create: (_createProperties: any) => {
      return Promise.resolve({ id: 2 });
    }
  }
};
