/**
 * Helper to safely set values on modern web forms including React, Vue, Angular,
 * and standard HTML inputs without breaking synthetic event lifecycles.
 */

export function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string | number): void {
  const prototype = element instanceof HTMLInputElement 
    ? window.HTMLInputElement.prototype 
    : window.HTMLTextAreaElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  const nativeSetter = descriptor?.set;

  if (nativeSetter) {
    nativeSetter.call(element, value);
  } else {
    element.value = String(value);
  }

  // Dispatch synthetic input and change events that frameworks like React listen to
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
}

export function setSelectValue(element: HTMLSelectElement, value: string): boolean {
  const normalizedTarget = value.trim().toLowerCase();
  const digitsOnlyTarget = normalizedTarget.replace(/\D/g, '');
  let found = false;

  // 1. Try exact match on value or text
  for (let i = 0; i < element.options.length; i++) {
    const opt = element.options[i];
    const optVal = opt.value.trim().toLowerCase();
    const optText = opt.text.trim().toLowerCase();

    if (optVal === normalizedTarget || optText === normalizedTarget) {
      element.selectedIndex = i;
      found = true;
      break;
    }
  }

  // 2. Try dial code digit matching (e.g. "+91" matching value "91" or text "India (+91)")
  if (!found && digitsOnlyTarget) {
    for (let i = 0; i < element.options.length; i++) {
      const opt = element.options[i];
      const optValDigits = opt.value.replace(/\D/g, '');
      const optText = opt.text.toLowerCase();

      if (optValDigits === digitsOnlyTarget || optText.includes(`+${digitsOnlyTarget}`) || optText.includes(`(${digitsOnlyTarget})`)) {
        element.selectedIndex = i;
        found = true;
        break;
      }
    }
  }

  // 3. Fallback to substring matching if exact match not found
  if (!found) {
    for (let i = 0; i < element.options.length; i++) {
      const opt = element.options[i];
      const optVal = opt.value.trim().toLowerCase();
      const optText = opt.text.trim().toLowerCase();

      if (
        (optVal && normalizedTarget.includes(optVal)) ||
        (optText && (optText.includes(normalizedTarget) || normalizedTarget.includes(optText)))
      ) {
        element.selectedIndex = i;
        found = true;
        break;
      }
    }
  }

  // Dispatch events
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

  return found;
}

export function setCheckboxValue(element: HTMLInputElement, checked: boolean): void {
  if (element.checked !== checked) {
    element.checked = checked;
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
  }
}

export function setRadioValue(elements: HTMLInputElement[], targetValue: string): boolean {
  const normTarget = targetValue.trim().toLowerCase();
  for (const radio of elements) {
    const rVal = (radio.value || '').trim().toLowerCase();
    const rId = radio.id;
    let rLabel = '';
    if (rId) {
      const labelEl = document.querySelector(`label[for="${rId}"]`);
      if (labelEl) rLabel = labelEl.textContent?.trim().toLowerCase() || '';
    }
    const parentLabel = radio.closest('label')?.textContent?.trim().toLowerCase() || '';

    if (
      rVal === normTarget ||
      rLabel === normTarget ||
      parentLabel.includes(normTarget) ||
      (normTarget === 'yes' && (rVal === '1' || rVal === 'true' || rVal === 'yes')) ||
      (normTarget === 'no' && (rVal === '0' || rVal === 'false' || rVal === 'no'))
    ) {
      radio.checked = true;
      radio.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      radio.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      radio.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
      return true;
    }
  }
  return false;
}
