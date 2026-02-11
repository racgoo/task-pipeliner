import { describe, it, expect } from 'vitest';
import { offsetHoursToIANA, parseOffsetHours, resolveTimezone } from '../timezone-offset';

describe('Timezone Offset', () => {
  describe('parseOffsetHours()', () => {
    it('should parse positive offset without sign', () => {
      expect(parseOffsetHours('9')).toBe(9);
      expect(parseOffsetHours('14')).toBe(14);
    });

    it('should parse positive offset with plus sign', () => {
      expect(parseOffsetHours('+9')).toBe(9);
      expect(parseOffsetHours('+14')).toBe(14);
    });

    it('should parse negative offset', () => {
      expect(parseOffsetHours('-5')).toBe(-5);
      expect(parseOffsetHours('-12')).toBe(-12);
    });

    it('should parse zero offset', () => {
      expect(parseOffsetHours('0')).toBe(0);
      expect(parseOffsetHours('+0')).toBe(0);
      expect(parseOffsetHours('-0')).toBe(0);
    });

    it('should parse offset with leading zero', () => {
      expect(parseOffsetHours('+09')).toBe(9);
      expect(parseOffsetHours('-05')).toBe(-5);
    });

    it('should parse offset with minutes (minutes ignored)', () => {
      expect(parseOffsetHours('+09:00')).toBe(9);
      expect(parseOffsetHours('-05:30')).toBe(-5);
    });

    it('should return null for invalid format', () => {
      expect(parseOffsetHours('invalid')).toBeNull();
      expect(parseOffsetHours('abc')).toBeNull();
      // Empty string returns 0 (treated as UTC)
      expect(parseOffsetHours('')).toBe(0);
    });

    it('should return null for out of range hours', () => {
      expect(parseOffsetHours('15')).toBeNull(); // > 14
      expect(parseOffsetHours('-13')).toBeNull(); // < -12
    });

    it('should handle whitespace', () => {
      expect(parseOffsetHours('  9  ')).toBe(9);
      expect(parseOffsetHours('  +9  ')).toBe(9);
      expect(parseOffsetHours('  -5  ')).toBe(-5);
    });
  });

  describe('offsetHoursToIANA()', () => {
    it('should convert zero to UTC', () => {
      expect(offsetHoursToIANA(0)).toBe('UTC');
    });

    it('should convert positive hours to Etc/GMT-N format', () => {
      expect(offsetHoursToIANA(9)).toBe('Etc/GMT-9');
      expect(offsetHoursToIANA(14)).toBe('Etc/GMT-14');
    });

    it('should convert negative hours to Etc/GMT+N format', () => {
      expect(offsetHoursToIANA(-5)).toBe('Etc/GMT+5');
      expect(offsetHoursToIANA(-12)).toBe('Etc/GMT+12');
    });

    it('should handle edge cases', () => {
      expect(offsetHoursToIANA(1)).toBe('Etc/GMT-1');
      expect(offsetHoursToIANA(-1)).toBe('Etc/GMT+1');
    });
  });

  describe('resolveTimezone()', () => {
    it('should return undefined for empty string', () => {
      expect(resolveTimezone('')).toBeUndefined();
      expect(resolveTimezone('   ')).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      expect(resolveTimezone(undefined)).toBeUndefined();
    });

    it('should return IANA timezone for valid offset', () => {
      expect(resolveTimezone('9')).toBe('Etc/GMT-9');
      expect(resolveTimezone('+9')).toBe('Etc/GMT-9');
      expect(resolveTimezone('-5')).toBe('Etc/GMT+5');
      expect(resolveTimezone('0')).toBe('UTC');
    });

    it('should return undefined for invalid offset', () => {
      expect(resolveTimezone('invalid')).toBeUndefined();
      expect(resolveTimezone('15')).toBeUndefined(); // Out of range
      expect(resolveTimezone('-13')).toBeUndefined(); // Out of range
    });

    it('should handle whitespace in input', () => {
      expect(resolveTimezone('  9  ')).toBe('Etc/GMT-9');
      expect(resolveTimezone('  -5  ')).toBe('Etc/GMT+5');
    });
  });
});

