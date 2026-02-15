/**
 * Numeric UTC offset to IANA timezone for node-cron.
 * User-facing: number like +9, -5, 0 (hours from UTC).
 * node-cron expects IANA: Etc/GMT-9 = UTC+9, Etc/GMT+5 = UTC-5, UTC = 0.
 */

const OFFSET_REGEX = /^([+-])?(\d{1,2})(?::(\d{2}))?$/;

/**
 * Parse offset string to hours (integer).
 * Accepts: "9", "+9", "-5", "0", "+09", "-05", "+09:00" (minutes ignored for Etc/GMT).
 * Returns null if invalid. Integer hours only for Etc/GMT compatibility (-12 to +14).
 */
export function parseOffsetHours(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '0' || trimmed === '+0' || trimmed === '-0') {
    return 0;
  }
  const m = trimmed.match(OFFSET_REGEX);
  if (!m) return null;
  const sign = m[1];
  const hours = parseInt(m[2], 10);
  if (hours > 14) return null;
  const neg = sign === '-';
  const result = neg ? -hours : hours;
  if (result < -12 || result > 14) return null;
  return result;
}

/**
 * Convert UTC offset hours to IANA timezone string for node-cron.
 * +9 → Etc/GMT-9, -5 → Etc/GMT+5, 0 → UTC.
 */
export function offsetHoursToIANA(hours: number): string {
  if (hours === 0) return 'UTC';
  // IANA: Etc/GMT-N = UTC+N, Etc/GMT+N = UTC-N
  const sign = hours > 0 ? '-' : '+';
  const abs = Math.abs(hours);
  return `Etc/GMT${sign}${abs}`;
}

/**
 * Resolve user timezone input (numeric offset string) to IANA timezone.
 * Returns undefined if input is empty or invalid (caller may then use system local).
 */
export function resolveTimezone(offsetStr: string | undefined): string | undefined {
  if (!offsetStr?.trim()) return undefined;
  const hours = parseOffsetHours(offsetStr);
  if (hours === null) return undefined;
  return offsetHoursToIANA(hours);
}
