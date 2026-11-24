import {
  defaultCountries,
  getActiveFormattingMask,
  guessCountryByPartialPhoneNumber,
  parseCountry,
} from "react-international-phone";

/**
 * Format a stored phone number for DISPLAY only. Stored values, `tel:` and
 * WhatsApp links keep using the raw digits.
 *
 *   "919435315163"     -> "+91 94353 15163"
 *   "9435315163"       -> "+91 94353 15163"  (bare 10-digit = Indian mobile)
 *   "+91 94353-15163"  -> "+91 94353 15163"
 *   "+14155552671"     -> "+1 (415) 555-2671" (mask from react-international-phone)
 *   "12345"            -> "+12345"            (unknown: readable as-is)
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  // Indian numbers: 10-digit national, 91 + 10, or 0 + 10 (trunk prefix).
  let national: string | null = null;
  if (digits.length === 10 && !raw.startsWith("+")) national = digits;
  else if (digits.length === 12 && digits.startsWith("91")) national = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) national = digits.slice(1);
  if (national) return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;

  // Other countries: reuse the phone input library's country data and masks.
  const guess = guessCountryByPartialPhoneNumber({ phone: `+${digits}` });
  if (guess.country && guess.fullDialCodeMatch) {
    const country = parseCountry(
      defaultCountries.find((c) => c[1] === guess.country!.iso2)!
    );
    const rest = digits.slice(country.dialCode.length);
    const mask = getActiveFormattingMask({ phone: rest, country });
    const slots = (mask.match(/\./g) ?? []).length;
    if (rest && mask && slots === rest.length) {
      let i = 0;
      const formatted = mask.replace(/\./g, () => rest[i++]);
      return `+${country.dialCode} ${formatted}`;
    }
  }

  return `+${digits}`;
}
