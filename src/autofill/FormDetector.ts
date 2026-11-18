import { DetectedFormField, UnsupportedFormField } from '@/adaptive/types';

// Sensitive / Ignored field identifiers that ApplyOnce AI must NEVER touch or auto-fill
const SECURITY_PATTERNS = [
  'password', 'pass', 'pwd',
  'otp', 'one-time', '2fa', 'mfa', 'token', 'verification_code', 'security_code',
  'captcha', 'recaptcha', 'hcaptcha',
  'creditcard', 'cardnumber', 'cvv', 'cvc', 'expiry', 'payment'
];

// Helper to safely escape CSS selectors across browsers and test environments
function cssEscape(str: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(str);
  }
  return str.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, '\\$1');
}

export class FormDetector {
  /**
   * Generates a stable unique CSS selector for a given element.
   */
  public static getUniqueSelector(el: Element): string {
    if (el.id && !el.id.match(/\d{4,}/)) { // Avoid auto-generated dynamic IDs
      return `#${cssEscape(el.id)}`;
    }
    const name = el.getAttribute('name');
    if (name) {
      const type = el.getAttribute('type');
      if (type === 'radio') {
        const val = el.getAttribute('value') || '';
        return `input[name="${cssEscape(name)}"][value="${cssEscape(val)}"]`;
      }
      return `${el.tagName.toLowerCase()}[name="${cssEscape(name)}"]`;
    }

    // Path fallback
    const path: string[] = [];
    let current: Element | null = el;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${cssEscape(current.id)}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = current;
        let nth = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          if (sibling.tagName === current.tagName) nth++;
        }
        if (nth > 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  /**
   * Extracts clean associated label or textual question for an element.
   * Inspects <label for>, enclosing label, aria-label, aria-labelledby, aria-describedby, and nearby headers.
   */
  public static extractLabel(el: HTMLElement): string {
    // 1. Explicit <label for="id">
    if (el.id) {
      const labelEl = document.querySelector(`label[for="${cssEscape(el.id)}"]`);
      if (labelEl && labelEl.textContent?.trim()) {
        return labelEl.textContent.trim().replace(/\s+/g, ' ');
      }
    }

    // 2. Enclosing parent <label>
    const parentLabel = el.closest('label');
    if (parentLabel && parentLabel.textContent?.trim()) {
      return parentLabel.textContent.trim().replace(/\s+/g, ' ');
    }

    // 3. ARIA attributes (aria-label, aria-labelledby)
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel?.trim()) return ariaLabel.trim();

    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const ids = ariaLabelledBy.split(/\s+/);
      const textParts: string[] = [];
      for (const id of ids) {
        const target = document.getElementById(id);
        if (target && target.textContent) textParts.push(target.textContent.trim());
      }
      if (textParts.length > 0) return textParts.join(' ').replace(/\s+/g, ' ');
    }

    // 4. Preceding sibling or parent container label (Common in Lever, Greenhouse, Workday)
    const container = el.closest('.field, .form-group, .input-container, .form-item, div');
    if (container) {
      const heading = container.querySelector('label, .label, .title, span.font-medium, h3, h4, p.form-label');
      if (heading && heading !== el && heading.textContent?.trim()) {
        return heading.textContent.trim().replace(/\s+/g, ' ');
      }
    }

    // 5. Placeholder / title fallback
    const placeholder = el.getAttribute('placeholder');
    if (placeholder?.trim()) return placeholder.trim();

    const title = el.getAttribute('title');
    if (title?.trim()) return title.trim();

    return '';
  }

  /**
   * Determines if a field is sensitive, security restricted, hidden, or disabled.
   */
  public static isIgnoredOrSecurityField(el: HTMLElement): boolean {
    const inputEl = el as HTMLInputElement;
    const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
    const name = (el.getAttribute('name') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();

    // 1. Ignore standard buttons, hidden inputs, or file inputs
    if (['password', 'hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(type)) {
      return true;
    }

    // 2. Check disabled or readonly status
    if (inputEl.disabled || el.getAttribute('aria-disabled') === 'true' || inputEl.readOnly) {
      return true;
    }

    // 3. Security pattern checks
    const testString = `${name} ${id} ${autocomplete}`;
    for (const pat of SECURITY_PATTERNS) {
      if (testString.includes(pat)) return true;
    }

    // 4. Check if element is hidden via styles
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      try {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          // Radio/checkboxes sometimes hide raw input for custom styled wrappers
          if (type !== 'radio' && type !== 'checkbox') {
            return true;
          }
        }
      } catch {
        // Fallback for non-browser mock environments
      }
    }

    return false;
  }

  /**
   * Scans document and classifies supported vs unsupported form fields.
   * Excludes disabled, readOnly, hidden, and sensitive security elements.
   */
  public static scanPageDetails(root: Document | HTMLElement = document): {
    detected: DetectedFormField[];
    unsupported: UnsupportedFormField[];
  } {
    const elements = root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea'
    );

    const detected: DetectedFormField[] = [];
    const unsupported: UnsupportedFormField[] = [];
    const seenRadioGroups = new Set<string>();

    elements.forEach((el) => {
      const inputEl = el as HTMLInputElement;
      const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
      const name = el.getAttribute('name') || '';
      const id = el.id || '';
      const label = this.extractLabel(el) || name || id || 'Unlabeled field';
      const selector = this.getUniqueSelector(el);

      // Check if disabled or readOnly - skip completely to avoid filling uneditable inputs
      if (inputEl.disabled || el.getAttribute('aria-disabled') === 'true' || inputEl.readOnly) {
        return;
      }

      // Check if unsupported or security restricted
      if (type === 'file') {
        unsupported.push({
          id: id || `unsupported_file_${unsupported.length + 1}`,
          name,
          label,
          type: 'file',
          reason: 'File uploads require direct user file selection (browser security policy)',
          selector
        });
        return;
      }

      if (type === 'password') {
        unsupported.push({
          id: id || `unsupported_pwd_${unsupported.length + 1}`,
          name,
          label,
          type: 'password',
          reason: 'Password / security input strictly excluded for privacy and safety',
          selector
        });
        return;
      }

      const testString = `${name} ${id} ${(el.getAttribute('autocomplete') || '')} ${label}`.toLowerCase();
      let securityReason = '';
      if (testString.includes('captcha') || testString.includes('recaptcha') || testString.includes('hcaptcha')) {
        securityReason = 'CAPTCHA human verification cannot be automated';
      } else if (testString.includes('otp') || testString.includes('token') || testString.includes('2fa') || testString.includes('verification_code')) {
        securityReason = 'One-time authentication code excluded';
      } else if (testString.includes('creditcard') || testString.includes('cardnumber') || testString.includes('cvv') || testString.includes('cvc')) {
        securityReason = 'Payment credentials strictly prohibited';
      }

      if (securityReason) {
        unsupported.push({
          id: id || `unsupported_sec_${unsupported.length + 1}`,
          name,
          label,
          type,
          reason: securityReason,
          selector
        });
        return;
      }

      if (['submit', 'button', 'reset', 'image', 'hidden'].includes(type)) {
        return; // Ignore standard form chrome
      }

      // Check if element is visually hidden
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        try {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            if (type !== 'radio' && type !== 'checkbox') {
              return;
            }
          }
        } catch {
          // ignore in mocked environments
        }
      }

      const placeholder = el.getAttribute('placeholder') || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const autocomplete = el.getAttribute('autocomplete') || '';
      const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

      let options: { value: string; label: string }[] | undefined = undefined;
      if (el instanceof HTMLSelectElement) {
        options = Array.from(el.options).map(opt => ({
          value: opt.value,
          label: opt.text.trim()
        }));
      }

      // Radio button handling: group by name
      if (type === 'radio' && name) {
        if (!seenRadioGroups.has(name)) {
          seenRadioGroups.add(name);
          const radios = root.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${cssEscape(name)}"]`);
          const radioOptions = Array.from(radios).map(r => {
            const rId = r.id;
            let rLabel = r.value;
            if (rId) {
              const lbl = document.querySelector(`label[for="${cssEscape(rId)}"]`);
              if (lbl?.textContent) rLabel = lbl.textContent.trim();
            }
            const parentLbl = r.closest('label');
            if (parentLbl?.textContent) rLabel = parentLbl.textContent.trim();
            return { value: r.value, label: rLabel };
          });

          const fieldset = el.closest('fieldset');
          const groupLegend = fieldset?.querySelector('legend')?.textContent?.trim();
          const groupLabel = groupLegend || label;

          detected.push({
            id: id || `radio_group_${name}`,
            name,
            type: 'radio_group',
            selector: `input[type="radio"][name="${cssEscape(name)}"]`,
            label: groupLabel || name,
            placeholder: '',
            ariaLabel,
            autocomplete,
            options: radioOptions,
            currentValue: (Array.from(radios).find(r => r.checked)?.value) || '',
            required
          });
        }
        return;
      }

      let currentValue = '';
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        currentValue = el.checked ? 'true' : 'false';
      } else {
        currentValue = el.value || '';
      }

      detected.push({
        id: id || `field_${detected.length + 1}`,
        name,
        type,
        selector,
        label,
        placeholder,
        ariaLabel,
        autocomplete,
        options,
        currentValue,
        required
      });
    });

    return { detected, unsupported };
  }

  /**
   * Scans the document for supported application fields (Backwards compatible helper)
   */
  public static scanPage(root: Document | HTMLElement = document): DetectedFormField[] {
    return this.scanPageDetails(root).detected;
  }
}
