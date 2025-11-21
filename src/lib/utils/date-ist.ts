/**
 * IST (Indian Standard Time) date utilities
 * IST is UTC+5:30
 * All dates in the app should be handled in IST for consistency
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Convert a UTC date string to IST date string (YYYY-MM-DD)
 * Used when reading dates from database
 */
export function utcToIstDate(utcDateString: string | null | undefined): string {
  if (!utcDateString) return "";
  
  // If it's already a date string (YYYY-MM-DD), return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(utcDateString)) {
    return utcDateString;
  }
  
  try {
    // Parse as UTC
    const utcDate = new Date(utcDateString);
    if (isNaN(utcDate.getTime())) return "";
    
    // Convert to IST by adding offset
    const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
    
    // Extract date components in IST
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDate.getUTCDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Convert an IST date string (YYYY-MM-DD) to UTC ISO string
 * Used when saving dates to database
 * The date is interpreted as IST midnight, then converted to UTC
 */
export function istDateToUtc(istDateString: string | null | undefined): string | undefined {
  if (!istDateString || !istDateString.trim()) return undefined;
  
  try {
    // Parse the date string as IST midnight (YYYY-MM-DD)
    const [year, month, day] = istDateString.split("-").map(Number);
    
    // Create date representing IST midnight
    // IST is UTC+5:30, so IST midnight = UTC 18:30 previous day
    // We create UTC date at 18:30 previous day, then add 5:30 to get IST midnight
    // Actually simpler: Create UTC date at (year, month, day, 0, 0, 0) then subtract 5:30
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    
    // Subtract IST offset to convert IST midnight to UTC
    // IST midnight (00:00 IST) = UTC 18:30 previous day
    const utcEquivalent = new Date(utcDate.getTime() - IST_OFFSET_MS);
    
    return utcEquivalent.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Convert UTC date to IST Date object for formatting
 */
export function utcToIstDateObject(utcDateString: string | null | undefined): Date | null {
  if (!utcDateString) return null;
  
  try {
    const utcDate = new Date(utcDateString);
    if (isNaN(utcDate.getTime())) return null;
    
    // Convert to IST by adding offset
    return new Date(utcDate.getTime() + IST_OFFSET_MS);
  } catch {
    return null;
  }
}

/**
 * Get current date in IST as YYYY-MM-DD string
 */
export function getCurrentIstDate(): string {
  const now = new Date();
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse an IST date string to a Date object (for date pickers)
 * The Date object will represent the IST date in local time
 */
export function parseIstDate(istDateString: string | null | undefined): Date | undefined {
  if (!istDateString || !istDateString.trim()) return undefined;
  
  try {
    const [year, month, day] = istDateString.split("-").map(Number);
    // Create date in local timezone (browser will handle it)
    // This is for date pickers which work in local time
    return new Date(year, month - 1, day);
  } catch {
    return undefined;
  }
}

/**
 * Format a Date object to IST date string (YYYY-MM-DD)
 * Used when date picker returns a Date object
 */
export function formatDateToIst(date: Date | null | undefined): string {
  if (!date) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

