import { describe, it, expect, beforeEach } from 'vitest';
import { FormDetector } from '@/autofill/FormDetector';
import { AutofillEngine } from '@/autofill/AutofillEngine';
import { setNativeValue, setSelectValue, setCheckboxValue, setRadioValue } from '@/autofill/reactInputHandler';

describe('Module 7: Smart Autofill Engine & Security Restrictions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('scans and detects standard form elements with clean labels', () => {
    document.body.innerHTML = `
      <form id="job-form">
        <div>
          <label for="fname">First Name *</label>
          <input type="text" id="fname" name="first_name" required placeholder="John" />
        </div>
        <div>
          <label for="user-email">Email Address</label>
          <input type="email" id="user-email" name="email" autocomplete="email" />
        </div>
      </form>
    `;

    const detected = FormDetector.scanPage();
    expect(detected.length).toBe(2);
    expect(detected[0].name).toBe('first_name');
    expect(detected[0].label).toBe('First Name *');
    expect(detected[0].required).toBe(true);
    expect(detected[1].autocomplete).toBe('email');
  });

  it('strictly ignores password, OTP, CAPTCHA, and credit card security fields from auto-fill list', () => {
    document.body.innerHTML = `
      <form>
        <input type="password" id="user_pwd" name="password" />
        <input type="hidden" name="csrf_token" value="secret" />
        <input type="text" id="otp_code" name="one-time-code" />
        <input type="text" id="cc_number" name="creditcard" />
        <input type="text" id="valid_name" name="first_name" />
      </form>
    `;

    const detected = FormDetector.scanPage();
    expect(detected.length).toBe(1);
    expect(detected[0].name).toBe('first_name');
  });

  it('classifies file uploads and security inputs as unsupported fields', () => {
    document.body.innerHTML = `
      <form>
        <input type="file" id="resume_file" name="resume" />
        <input type="password" id="pwd" name="password" />
        <input type="text" id="fname" name="first_name" />
      </form>
    `;

    const { detected, unsupported } = FormDetector.scanPageDetails();
    expect(detected.length).toBe(1);
    expect(detected[0].name).toBe('first_name');

    expect(unsupported.length).toBe(2);
    expect(unsupported[0].type).toBe('file');
    expect(unsupported[0].reason).toContain('File upload');
    expect(unsupported[1].type).toBe('password');
  });

  it('preserves existing website values unless user explicitly approves overwriting', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="phone" name="phone" value="+1 (555) 999-8888 (Manual Entry)" />
        <input type="text" id="empty_city" name="city" value="" />
      </form>
    `;

    const items = [
      { selector: '#phone', value: '+1 (415) 000-1111', type: 'text' },
      { selector: '#empty_city', value: 'San Francisco', type: 'text' }
    ];

    // Case 1: overwriteExisting is false (Default)
    const filledWithoutOverwrite = AutofillEngine.executeAutofill(items, false);
    const phoneInput = document.getElementById('phone') as HTMLInputElement;
    const cityInput = document.getElementById('empty_city') as HTMLInputElement;

    expect(filledWithoutOverwrite).toBe(1); // Only the empty city field is filled
    expect(phoneInput.value).toBe('+1 (555) 999-8888 (Manual Entry)'); // Preserved!
    expect(cityInput.value).toBe('San Francisco'); // Filled!

    // Case 2: overwriteExisting is true (User checked overwrite in preview)
    const filledWithOverwrite = AutofillEngine.executeAutofill(items, true);
    expect(filledWithOverwrite).toBe(2);
    expect(phoneInput.value).toBe('+1 (415) 000-1111'); // Successfully overwritten!
  });

  it('correctly sets React-controlled inputs dispatching synthetic events', () => {
    document.body.innerHTML = `<input type="text" id="test-react-input" />`;
    const input = document.getElementById('test-react-input') as HTMLInputElement;

    let eventFired = false;
    input.addEventListener('input', () => { eventFired = true; });

    setNativeValue(input, 'Alexander');
    expect(input.value).toBe('Alexander');
    expect(eventFired).toBe(true);
  });

  it('correctly selects option in dropdown by value or text', () => {
    document.body.innerHTML = `
      <select id="degree-select">
        <option value="">Select Degree...</option>
        <option value="bs">Bachelor's Degree</option>
        <option value="ms">Master's Degree</option>
      </select>
    `;
    const select = document.getElementById('degree-select') as HTMLSelectElement;

    // Match by option text
    const matched = setSelectValue(select, "Bachelor's Degree");
    expect(matched).toBe(true);
    expect(select.value).toBe('bs');
  });

  it('correctly handles checkboxes and dispatches change events', () => {
    document.body.innerHTML = `<input type="checkbox" id="relocate" />`;
    const checkbox = document.getElementById('relocate') as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
    setCheckboxValue(checkbox, true);
    expect(checkbox.checked).toBe(true);
  });

  it('correctly selects matching radio button in a radio group', () => {
    document.body.innerHTML = `
      <form>
        <label><input type="radio" name="auth" value="yes" /> Yes</label>
        <label><input type="radio" name="auth" value="no" /> No</label>
      </form>
    `;
    const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="auth"]'));

    const success = setRadioValue(radios, 'yes');
    expect(success).toBe(true);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('handles phone autofill with separate country-code selector and 10-digit national number', () => {
    document.body.innerHTML = `
      <form class="phone-group">
        <select name="country_code" id="country_code">
          <option value="+1">United States (+1)</option>
          <option value="+91">India (+91)</option>
          <option value="+44">UK (+44)</option>
        </select>
        <input type="tel" name="phone_national" id="phone_national" placeholder="10-digit mobile number" maxlength="10" />
      </form>
    `;
    const items = [
      { selector: '#phone_national', value: '+919876543210', type: 'tel' }
    ];
    AutofillEngine.executeAutofill(items, false);
    const countrySelect = document.getElementById('country_code') as HTMLSelectElement;
    const phoneInput = document.getElementById('phone_national') as HTMLInputElement;

    expect(countrySelect.value).toBe('+91');
    expect(phoneInput.value).toBe('9876543210');
  });

  it('fills full international phone number when no separate country selector is present', () => {
    document.body.innerHTML = `
      <form>
        <input type="tel" name="full_phone" id="full_phone" placeholder="+91..." />
      </form>
    `;
    const items = [
      { selector: '#full_phone', value: '+919876543210', type: 'tel' }
    ];
    AutofillEngine.executeAutofill(items, false);
    const phoneInput = document.getElementById('full_phone') as HTMLInputElement;
    expect(phoneInput.value).toBe('+919876543210');
  });

  it('never produces duplicate country prefix like +91+91...', () => {
    document.body.innerHTML = `
      <form>
        <input type="tel" name="phone" id="phone_dup" />
      </form>
    `;
    const items = [
      { selector: '#phone_dup', value: '+91+919876543210', type: 'tel' }
    ];
    AutofillEngine.executeAutofill(items, false);
    const phoneInput = document.getElementById('phone_dup') as HTMLInputElement;
    expect(phoneInput.value).toBe('+919876543210');
  });

  it('excludes disabled and readOnly form elements from detection', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="editable_field" id="f1" />
        <input type="text" name="disabled_field" id="f2" disabled />
        <input type="text" name="aria_disabled_field" id="f3" aria-disabled="true" />
        <input type="text" name="readonly_field" id="f4" readonly />
      </form>
    `;
    const detected = FormDetector.scanPage();
    expect(detected.length).toBe(1);
    expect(detected[0].name).toBe('editable_field');
  });
});
