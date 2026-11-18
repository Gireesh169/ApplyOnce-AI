import { StorageService } from '@/storage/StorageService';
import { MESSAGE_TYPES } from '@/shared/messages';

console.log('ApplyOnce AI Background Service Worker initialized.');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('ApplyOnce AI installed for the first time.');
    // Initialize default profile and settings
    await StorageService.getProfile();
    await StorageService.getSettings();
    // Open dashboard on first install to welcome the user
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
});

// Central message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  switch (message.type) {
    case MESSAGE_TYPES.OPEN_DASHBOARD: {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
      sendResponse({ success: true });
      break;
    }

    case MESSAGE_TYPES.GET_PROFILE_DATA: {
      Promise.all([
        StorageService.getProfile(),
        StorageService.getCustomFields(),
        StorageService.getLearnedMappings(),
        StorageService.getSettings()
      ]).then(([profile, customFields, learnedMappings, settings]) => {
        sendResponse({ success: true, profile, customFields, learnedMappings, settings });
      }).catch((err) => {
        sendResponse({ success: false, error: (err as Error).message });
      });
      return true; // Keep channel open for async response
    }

    case MESSAGE_TYPES.SAVE_CUSTOM_FIELDS: {
      if (Array.isArray(message.payload)) {
        StorageService.saveMultipleCustomFields(message.payload)
          .then(() => sendResponse({ success: true }))
          .catch(err => sendResponse({ success: false, error: (err as Error).message }));
        return true;
      }
      break;
    }

    case MESSAGE_TYPES.SAVE_FIELD_MAPPING: {
      if (message.payload) {
        StorageService.saveLearnedMapping(message.payload)
          .then(() => sendResponse({ success: true }))
          .catch(err => sendResponse({ success: false, error: (err as Error).message }));
        return true;
      }
      break;
    }

    case 'UPDATE_BADGE_COUNT': {
      if (sender.tab?.id && typeof message.count === 'number') {
        const text = message.count > 0 ? String(message.count) : '';
        chrome.action.setBadgeText({ tabId: sender.tab.id, text });
        chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#2563eb' });
      }
      sendResponse({ success: true });
      break;
    }

    default:
      break;
  }
});
