import { FormDetector } from './FormDetector';
import { FieldMatcher } from './FieldMatcher';
import { MissingFieldService } from '@/adaptive/MissingFieldService';
import { StorageService } from '@/storage/StorageService';
import { setNativeValue, setSelectValue, setCheckboxValue, setRadioValue } from './reactInputHandler';
import { MatchedFormField, MissingFormField, UnsupportedFormField } from '@/adaptive/types';

export interface AutofillItem {
  selector: string;
  value: any;
  type: string;
  allowOverwrite?: boolean;
}

export interface AutofillExecutionResult {
  totalDetected: number;
  autoFilledCount: number;
  ambiguousCount: number;
  missingCount: number;
  unsupportedCount: number;
  matchedFields: MatchedFormField[];
  missingFields: MissingFormField[];
  unsupportedFields: UnsupportedFormField[];
}

export class AutofillEngine {
  /**
   * Scans the current page and produces a match report without modifying the DOM.
   */
  public static async analyzeCurrentPage(): Promise<AutofillExecutionResult> {
    const { detected, unsupported } = FormDetector.scanPageDetails();
    const profile = await StorageService.getProfile();
    const customFields = await StorageService.getCustomFields();
    const learnedMappings = await StorageService.getLearnedMappings();
    const currentDomain = window.location.hostname || '';

    const matchedFields: MatchedFormField[] = [];

    for (const field of detected) {
      const match = FieldMatcher.matchField(field, profile, customFields, learnedMappings, currentDomain);
      matchedFields.push(match);
    }

    const missingFields = MissingFieldService.identifyMissingAndAmbiguousFields(
      detected,
      matchedFields,
      profile,
      customFields
    );

    const autoFillable = matchedFields.filter(
      m => m.confidence === 'high' && !m.isAmbiguous && m.suggestedValue !== undefined && m.suggestedValue !== ''
    );
    const ambiguous = matchedFields.filter(m => m.isAmbiguous && m.confidence === 'medium');

    return {
      totalDetected: detected.length,
      autoFilledCount: autoFillable.length,
      ambiguousCount: ambiguous.length,
      missingCount: missingFields.length,
      unsupportedCount: unsupported.length,
      matchedFields,
      missingFields,
      unsupportedFields: unsupported
    };
  }

  /**
   * Applies autofill to the page for approved matches and temporary user-provided values.
   * STRICT: Preserves existing non-empty website values unless overwrite is explicitly enabled.
   * Incorporates specialized phone number rules (country code selector handling, no double prefix, 10-digit detection).
   */
  public static executeAutofill(
    approvedMatches: AutofillItem[],
    overwriteExisting: boolean = false,
    highlightFields: boolean = true
  ): number {
    let filledCount = 0;

    for (const item of approvedMatches) {
      if (item.value === undefined || item.value === null || item.value === '') continue;

      try {
        const canOverwrite = overwriteExisting || Boolean(item.allowOverwrite);

        // 1. Radio groups
        if (item.type === 'radio_group') {
          const radios = Array.from(document.querySelectorAll<HTMLInputElement>(item.selector));
          if (radios.length > 0) {
            const alreadyChecked = radios.some(r => r.checked);
            if (alreadyChecked && !canOverwrite) {
              continue; // Preserve existing website choice
            }

            const success = setRadioValue(radios, String(item.value));
            if (success) {
              filledCount++;
              if (highlightFields) {
                this.highlightElement(radios[0].closest('fieldset') || radios[0].parentElement || radios[0]);
              }
            }
          }
          continue;
        }

        const el = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(item.selector);
        if (!el) continue;

        // Skip password or security inputs always
        if (FormDetector.isIgnoredOrSecurityField(el)) continue;

        // 2. Select dropdowns
        if (el instanceof HTMLSelectElement) {
          const hasExisting = Boolean(el.selectedIndex > 0 && el.value);
          if (hasExisting && !canOverwrite) {
            continue; // Preserve existing website selection
          }

          const success = setSelectValue(el, String(item.value));
          if (success) {
            filledCount++;
            if (highlightFields) this.highlightElement(el);
          }
        } else if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          // 3. Checkboxes
          const isChecked = item.value === true || item.value === 'yes' || item.value === 'true' || item.value === 1;
          setCheckboxValue(el, isChecked);
          filledCount++;
          if (highlightFields) this.highlightElement(el);
        } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          // 4. Text / Tel / Number / TextArea inputs
          const inputEl = el as HTMLInputElement;
          const hasExisting = Boolean(inputEl.value && inputEl.value.trim().length > 0);
          if (hasExisting && !canOverwrite) {
            continue; // Preserve existing user-typed or pre-filled value
          }

          // Special Phone handling rules
          let valueToFill = item.value;
          const isPhoneField = inputEl.type === 'tel' ||
            (inputEl.getAttribute('autocomplete') || '').startsWith('tel') ||
            /\b(phone|mobile|cell|contact_number)\b/i.test(`${inputEl.name} ${inputEl.id} ${inputEl.getAttribute('placeholder') || ''}`);

          if (isPhoneField && typeof valueToFill === 'string') {
            const container = inputEl.closest('.form-group, .field, .input-container, .input-group, form, div') || inputEl.parentElement;
            
            // Check for adjacent or nearby country-code selector
            let countrySelect: HTMLSelectElement | null = null;
            if (container) {
              countrySelect = container.querySelector<HTMLSelectElement>(
                'select[name*="country_code"], select[name*="dial_code"], select[name*="phone_code"], select[id*="country_code"], select[autocomplete="tel-country-code"]'
              );
            }

            const maxLength = inputEl.getAttribute('maxlength');
            const expects10Digits = maxLength === '10' ||
              /\b(10[- ]?digit|national|without country code)\b/i.test(
                `${inputEl.name} ${inputEl.id} ${inputEl.getAttribute('placeholder') || ''} ${inputEl.getAttribute('aria-label') || ''}`
              );

            if (countrySelect) {
              // If separate country selector exists: select +91 / India and fill 10-digit national number
              const optionsText = Array.from(countrySelect.options).map(o => `${o.value} ${o.text}`).join(' ');
              if (optionsText.includes('+91') || optionsText.toLowerCase().includes('india')) {
                setSelectValue(countrySelect, '+91');
                if (highlightFields) this.highlightElement(countrySelect);
              }
              valueToFill = valueToFill.replace(/\D/g, '').slice(-10);
            } else if (expects10Digits) {
              // If site explicitly expects 10-digit mobile number, fill only 10 digits
              valueToFill = valueToFill.replace(/\D/g, '').slice(-10);
            } else {
              // Full international number: check for duplicate country code
              let clean = valueToFill.trim();
              if (clean.startsWith('+91+91')) {
                clean = clean.replace('+91+91', '+91');
              }

              // Check if static prefix addon in UI contains +91
              const prefixAddon = container?.querySelector('.input-group-text, .prefix, span');
              if (prefixAddon && prefixAddon.textContent?.trim().includes('+91')) {
                clean = clean.replace(/\D/g, '').slice(-10);
              }
              valueToFill = clean;
            }
          }

          setNativeValue(inputEl, valueToFill);
          filledCount++;
          if (highlightFields) this.highlightElement(inputEl);
        }
      } catch (err) {
        console.warn(`ApplyOnce AI: Could not fill field for selector ${item.selector}:`, err);
      }
    }

    return filledCount;
  }

  /**
   * Adds subtle visual highlight indicator to autofilled elements.
   */
  private static highlightElement(element: HTMLElement): void {
    element.classList.add('applyonce-autofilled');
    element.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
    element.style.borderColor = '#2563eb';
    element.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';

    setTimeout(() => {
      element.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.15)';
    }, 3000);
  }
}
