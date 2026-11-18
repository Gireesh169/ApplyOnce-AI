import { FormDetector } from '@/autofill/FormDetector';
import { FieldMatcher } from '@/autofill/FieldMatcher';
import { AutofillEngine } from '@/autofill/AutofillEngine';
import { MissingFieldService } from '@/adaptive/MissingFieldService';
import { MESSAGE_TYPES, ExtensionMessage } from '@/shared/messages';
import { MatchedFormField, MissingFormField, UnsupportedFormField } from '@/adaptive/types';

console.log('ApplyOnce AI Content Script active.');

let lastAnalysis: {
  matchedFields: MatchedFormField[];
  missingFields: MissingFormField[];
  unsupportedFields: UnsupportedFormField[];
  total: number;
} | null = null;

// Helper to ask background for current profile data
async function fetchProfileData(): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_PROFILE_DATA }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        resolve({ profile: null, customFields: [], learnedMappings: [] });
      } else {
        resolve(res);
      }
    });
  });
}

// Scans and analyzes current page forms
async function analyzePage() {
  const { detected, unsupported } = FormDetector.scanPageDetails();
  if (detected.length === 0 && unsupported.length === 0) {
    return { matchedFields: [], missingFields: [], unsupportedFields: [], total: 0 };
  }

  const { profile, customFields, learnedMappings } = await fetchProfileData();
  if (!profile) {
    return { matchedFields: [], missingFields: [], unsupportedFields: unsupported, total: detected.length };
  }

  const currentDomain = window.location.hostname || '';
  const matchedFields: MatchedFormField[] = [];

  for (const f of detected) {
    const match = FieldMatcher.matchField(f, profile, customFields, learnedMappings, currentDomain);
    matchedFields.push(match);
  }

  const missingFields = MissingFieldService.identifyMissingAndAmbiguousFields(
    detected,
    matchedFields,
    profile,
    customFields
  );

  lastAnalysis = {
    matchedFields,
    missingFields,
    unsupportedFields: unsupported,
    total: detected.length
  };

  // Notify background to update badge
  const autofillableCount = matchedFields.filter(
    m => m.confidence === 'high' && !m.isAmbiguous && m.suggestedValue
  ).length;
  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE_COUNT', count: autofillableCount });

  // Update floating widget if mounted
  updateFloatingPill(detected.length, autofillableCount, missingFields.length, unsupported.length);

  return {
    matchedFields,
    missingFields,
    unsupportedFields: unsupported,
    total: detected.length
  };
}

// Listen for messages from extension popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.INSPECT_PAGE_FORMS) {
    analyzePage().then(res => {
      sendResponse({
        success: true,
        url: window.location.href,
        domain: window.location.hostname,
        totalFieldsCount: res.total,
        matchedFields: res.matchedFields,
        missingFields: res.missingFields,
        unsupportedFields: res.unsupportedFields
      });
    });
    return true; // Keep response channel open
  }

  if (message.type === MESSAGE_TYPES.TRIGGER_AUTOFILL) {
    const payload = message.payload;
    if (payload && Array.isArray(payload.approvedMatches)) {
      const overwrite = Boolean(payload.overwriteExisting);
      const filledCount = AutofillEngine.executeAutofill(payload.approvedMatches, overwrite);
      sendResponse({ success: true, filledCount });
    } else if (lastAnalysis) {
      // Auto-fill all high confidence matches preserving existing values
      const highConfidence = lastAnalysis.matchedFields
        .filter(m => m.confidence === 'high' && !m.isAmbiguous && m.suggestedValue)
        .map(m => ({
          selector: m.detectedField.selector,
          value: m.suggestedValue,
          type: m.detectedField.type,
          allowOverwrite: false
        }));
      const filledCount = AutofillEngine.executeAutofill(highConfidence, false);
      sendResponse({ success: true, filledCount });
    } else {
      sendResponse({ success: false, error: 'No fields analyzed yet' });
    }
    return true;
  }
});

// Setup MutationObserver to detect dynamically inserted form elements (e.g. multi-step wizards)
let scanDebounceTimer: any = null;
const observer = new MutationObserver((mutations) => {
  let hasNewInputs = false;
  for (const m of mutations) {
    if (m.addedNodes.length > 0) {
      for (const node of Array.from(m.addedNodes)) {
        if (node instanceof HTMLElement) {
          if (node.matches('input, select, textarea') || node.querySelector('input, select, textarea')) {
            hasNewInputs = true;
            break;
          }
        }
      }
    }
    if (hasNewInputs) break;
  }

  if (hasNewInputs) {
    clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(() => {
      analyzePage();
    }, 600);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial page scan
setTimeout(() => {
  analyzePage();
}, 800);

// --- FLOATING IN-PAGE ACTION WIDGET ---
let shadowRoot: ShadowRoot | null = null;
let pillElement: HTMLElement | null = null;

function ensureFloatingWidget() {
  if (shadowRoot) return;

  const container = document.createElement('div');
  container.id = 'applyonce-ai-root';
  container.style.all = 'initial';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '2147483647';
  document.body.appendChild(container);

  shadowRoot = container.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .applyonce-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
      font-weight: 500;
    }
    .applyonce-pill:hover {
      background: #1e293b;
      transform: translateY(-2px);
    }
    .badge {
      background: #2563eb;
      color: #fff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
    }
    .btn-fill {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-fill:hover { background: #1d4ed8; }
    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
      margin-left: 4px;
      line-height: 1;
    }
    .close-btn:hover { color: #fff; }
  `;
  shadowRoot.appendChild(style);

  pillElement = document.createElement('div');
  pillElement.className = 'applyonce-pill';
  shadowRoot.appendChild(pillElement);
}

function updateFloatingPill(totalDetected: number, autoFillable: number, missingCount: number, unsupportedCount: number) {
  if (totalDetected === 0 && unsupportedCount === 0) {
    if (pillElement) pillElement.style.display = 'none';
    return;
  }

  ensureFloatingWidget();
  if (!pillElement) return;

  pillElement.style.display = 'flex';
  pillElement.innerHTML = `
    <span style="display:flex; align-items:center; gap:6px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#22c55e;"></span>
      <strong>ApplyOnce AI</strong>
    </span>
    <span class="badge">${autoFillable} / ${totalDetected} ready</span>
    <button type="button" class="btn-fill" id="ao-quick-fill">Autofill</button>
    <button type="button" class="close-btn" id="ao-close-pill" title="Dismiss">✕</button>
  `;

  const fillBtn = shadowRoot?.getElementById('ao-quick-fill');
  fillBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!lastAnalysis) return;
    const highConfidence = lastAnalysis.matchedFields
      .filter(m => m.confidence === 'high' && !m.isAmbiguous && m.suggestedValue)
      .map(m => ({
        selector: m.detectedField.selector,
        value: m.suggestedValue,
        type: m.detectedField.type,
        allowOverwrite: false
      }));
    const filled = AutofillEngine.executeAutofill(highConfidence, false);
    if (fillBtn) {
      fillBtn.textContent = `Filled ${filled}!`;
      setTimeout(() => { fillBtn.textContent = 'Autofill'; }, 2000);
    }
  });

  const closeBtn = shadowRoot?.getElementById('ao-close-pill');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pillElement) pillElement.style.display = 'none';
  });
}
