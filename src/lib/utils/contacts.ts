/**
 * Utility functions for Contacts Picker API integration
 */

// TypeScript types for Contacts Picker API
// Note: This API is not fully standardized, so we define our own types
export interface ContactProperty {
  tel?: string[];
  email?: string[];
  name?: string[];
  icon?: Blob[];
  address?: unknown[];
}

export interface Contact {
  tel?: string[];
  email?: string[];
  name?: string[];
  icon?: Blob[];
  address?: unknown[];
}

export interface ContactsSelectOptions {
  multiple?: boolean;
  properties?: ('name' | 'email' | 'tel' | 'address' | 'icon')[];
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
  
  interface ContactsManager {
    select: (
      properties: ('name' | 'email' | 'tel' | 'address' | 'icon')[],
      options?: { multiple?: boolean }
    ) => Promise<Contact[]>;
    getProperties?: () => Promise<('name' | 'email' | 'tel' | 'address' | 'icon')[]>;
  }
  
  var ContactsManager: {
    prototype: ContactsManager;
    new (): ContactsManager;
  } | undefined;
}

/**
 * Check if Contacts Picker API is available
 * 
 * The Contacts Picker API is available in:
 * - Chrome/Edge on Android (requires HTTPS or localhost)
 * - Chrome/Edge on Desktop (requires HTTPS or localhost)
 * - Samsung Internet
 * 
 * NOT available in:
 * - Safari (iOS/macOS)
 * - Firefox
 */
export function isContactsPickerAvailable(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  // Check for secure context (required for the API)
  const isSecureContext = 
    typeof window !== 'undefined' &&
    (window.isSecureContext || 
     window.location.protocol === 'https:' ||
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

  if (!isSecureContext) {
    return false;
  }

  // Check for ContactsManager in window (some browsers expose it this way)
  const hasContactsManager = typeof window !== 'undefined' && 'ContactsManager' in window;
  
  // Check for contacts in navigator
  const hasNavigatorContacts = 'contacts' in navigator;
  
  // Check if select method exists
  const hasSelectMethod = 
    hasNavigatorContacts && 
    typeof navigator.contacts?.select === 'function';

  // API is available if we have ContactsManager OR (navigator.contacts with select method)
  return hasContactsManager || hasSelectMethod;
}

/**
 * Normalize phone number from contact to Indian format
 * Handles various formats and converts to +91XXXXXXXXXX
 */
export function normalizePhoneFromContact(phoneNumber: string): string | null {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Handle different formats
  if (cleaned.startsWith('+91')) {
    // Already has +91, extract the number part
    const numberPart = cleaned.replace(/^\+91/, '').replace(/\D/g, '');
    if (numberPart.length === 10 && /^[6-9]\d{9}$/.test(numberPart)) {
      return `+91${numberPart}`;
    }
  } else if (cleaned.startsWith('91')) {
    // Has 91 but no +
    const numberPart = cleaned.replace(/^91/, '').replace(/\D/g, '');
    if (numberPart.length === 10 && /^[6-9]\d{9}$/.test(numberPart)) {
      return `+91${numberPart}`;
    }
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and check if it's a valid 10-digit number
    const numberPart = cleaned.slice(1).replace(/\D/g, '');
    if (numberPart.length === 10 && /^[6-9]\d{9}$/.test(numberPart)) {
      return `+91${numberPart}`;
    }
  } else {
    // Just digits, check if it's a valid 10-digit Indian number
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
      return `+91${digits}`;
    }
    // If it's 12 digits starting with 91, extract the last 10
    if (digits.length === 12 && digits.startsWith('91')) {
      const numberPart = digits.slice(2);
      if (/^[6-9]\d{9}$/.test(numberPart)) {
        return `+91${numberPart}`;
      }
    }
  }

  return null;
}

/**
 * Extract phone number from contact
 * Returns the first valid Indian phone number found
 */
export function extractPhoneFromContact(contact: Contact): string | null {
  if (!contact.tel || contact.tel.length === 0) {
    return null;
  }

  // Try each phone number until we find a valid Indian number
  for (const phone of contact.tel) {
    const normalized = normalizePhoneFromContact(phone);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

/**
 * Select contact using Contacts Picker API
 */
export async function selectContact(): Promise<Contact | null> {
  if (!isContactsPickerAvailable()) {
    throw new Error('Contacts Picker API is not available');
  }

  // The API is accessed via navigator.contacts
  // ContactsManager is just the interface name, not a constructor
  if (!navigator.contacts) {
    throw new Error('Contacts Picker API is not available');
  }

  try {
    const contacts = await navigator.contacts.select(
      ['tel', 'name', 'email'],
      { multiple: false }
    );

    if (!contacts || contacts.length === 0) {
      return null;
    }

    return contacts[0];
  } catch (error) {
    // User cancelled or permission denied
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('cancel')) {
        return null; // User cancelled, not an error
      }
    }
    throw error;
  }
}

