/**
 * Utility functions for managing recent contacts
 * Stores frequently used contacts in localStorage for quick access
 */

export interface RecentContact {
  phone: string;
  name?: string;
  lastUsed: string; // ISO date string
  useCount: number;
}

const STORAGE_KEY = "rps_recent_contacts";
const MAX_RECENT_CONTACTS = 10;

/**
 * Get all recent contacts from localStorage
 */
export function getRecentContacts(): RecentContact[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const contacts = JSON.parse(stored) as RecentContact[];
    // Sort by most recently used, then by use count
    return contacts.sort((a, b) => {
      const dateCompare =
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.useCount - a.useCount;
    });
  } catch {
    return [];
  }
}

/**
 * Add or update a contact in recent contacts
 */
export function addRecentContact(phone: string, name?: string): void {
  if (typeof window === "undefined") return;
  if (!phone || phone.trim() === "") return;

  try {
    const contacts = getRecentContacts();
    const existingIndex = contacts.findIndex((c) => c.phone === phone);

    if (existingIndex !== -1) {
      // Update existing contact
      contacts[existingIndex] = {
        ...contacts[existingIndex],
        name: name || contacts[existingIndex].name,
        lastUsed: new Date().toISOString(),
        useCount: contacts[existingIndex].useCount + 1,
      };
    } else {
      // Add new contact
      contacts.push({
        phone,
        name,
        lastUsed: new Date().toISOString(),
        useCount: 1,
      });
    }

    // Keep only the most recent contacts
    const trimmed = contacts
      .sort((a, b) => {
        const dateCompare =
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.useCount - a.useCount;
      })
      .slice(0, MAX_RECENT_CONTACTS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save recent contact:", error);
  }
}

/**
 * Search recent contacts by phone number or name
 */
export function searchRecentContacts(query: string): RecentContact[] {
  if (!query || query.trim() === "") return getRecentContacts();

  const contacts = getRecentContacts();
  const lowerQuery = query.toLowerCase();

  return contacts.filter(
    (contact) =>
      contact.phone.includes(query) ||
      contact.name?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Clear all recent contacts
 */
export function clearRecentContacts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear recent contacts:", error);
  }
}

/**
 * Remove a specific contact from recent contacts
 */
export function removeRecentContact(phone: string): void {
  if (typeof window === "undefined") return;

  try {
    const contacts = getRecentContacts();
    const filtered = contacts.filter((c) => c.phone !== phone);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove recent contact:", error);
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Indian format: +91 XXXXX XXXXX
  if (cleaned.startsWith("+91")) {
    const digits = cleaned.slice(3);
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
  }

  // Default format with country code
  if (cleaned.startsWith("+")) {
    const countryCode = cleaned.slice(0, cleaned.length - 10);
    const number = cleaned.slice(cleaned.length - 10);
    if (number.length === 10) {
      return `${countryCode} ${number.slice(0, 5)} ${number.slice(5)}`;
    }
  }

  return phone;
}

