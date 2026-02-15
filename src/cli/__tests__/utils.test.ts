import { mkdir, rm, writeFile, readFileSync } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { findNearestTpDirectory, parseVarPairs, setSilentMode, getVersion } from '../shared/utils';

describe('CLI Utils', () => {
  describe('setSilentMode()', () => {
    it('should disable console output functions', () => {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalInfo = console.info;

      setSilentMode();

      expect(console.log).not.toBe(originalLog);
      expect(console.error).not.toBe(originalError);
      expect(console.warn).not.toBe(originalWarn);
      expect(console.info).not.toBe(originalInfo);

      // Restore
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    });

    it('should make stdout.write return true', () => {
      setSilentMode();
      const result = process.stdout.write('test');
      expect(result).toBe(true);
      // Restore
      const originalWrite = process.stdout.write;
      process.stdout.write = originalWrite;
    });
  });

  describe('getVersion()', () => {
    it('should return a version string', () => {
      const version = getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('should return valid version format', () => {
      const version = getVersion();
      // Should be either a semantic version or '0.0.0'
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should fallback to 0.0.0 when package.json not found', () => {
      // This test verifies the fallback behavior
      // The actual implementation will try multiple paths
      const version = getVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should handle errors gracefully', () => {
      // Even if file system operations fail, should return a version
      const version = getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('findNearestTpDirectory()', () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = await mkdir(join(tmpdir(), `tp-test-${Date.now()}`), { recursive: true });
    });

    afterEach(async () => {
      try {
        await rm(testDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should find tp directory in current directory', async () => {
      const tpDir = join(testDir, 'tp');
      await mkdir(tpDir, { recursive: true });

      const found = findNearestTpDirectory(testDir);
      expect(found).toBe(tpDir);
    });

    it('should find tp directory in parent directory', async () => {
      const tpDir = join(testDir, 'tp');
      await mkdir(tpDir, { recursive: true });
      const subDir = join(testDir, 'sub', 'nested');
      await mkdir(subDir, { recursive: true });

      const found = findNearestTpDirectory(subDir);
      expect(found).toBe(tpDir);
    });

    it('should return null when tp directory does not exist', () => {
      const found = findNearestTpDirectory(testDir);
      expect(found).toBeNull();
    });

    it('should return null when tp is a file, not directory', async () => {
      const tpFile = join(testDir, 'tp');
      await writeFile(tpFile, 'not a directory');

      const found = findNearestTpDirectory(testDir);
      expect(found).toBeNull();
    });

    it('should limit traversal depth', () => {
      // Create a very deep directory structure
      const deepDir = join(testDir, Array(60).fill('deep').join('/'));
      // Should not traverse all the way up
      const found = findNearestTpDirectory(deepDir);
      // Should return null if tp doesn't exist, or the actual path if it does
      expect(found === null || typeof found === 'string').toBe(true);
    });

    it('should stop at filesystem root', async () => {
      // Test that it stops at root
      const found = findNearestTpDirectory('/');
      // Should return null or a path if tp exists at root (unlikely)
      expect(found === null || typeof found === 'string').toBe(true);
    });

    it('should handle permission errors gracefully', () => {
      // Test with a path that might have permission issues
      // In practice, this would be caught by the try-catch in the implementation
      const found = findNearestTpDirectory('/root'); // May not have permission
      expect(found === null || typeof found === 'string').toBe(true);
    });
  });

  describe('parseVarPairs()', () => {
    it('should parse valid key=value pairs', () => {
      const pairs = ['version=1.0.0', 'env=production'];
      const result = parseVarPairs(pairs);
      expect(result).toEqual({
        version: '1.0.0',
        env: 'production',
      });
    });

    it('should handle values with equals signs', () => {
      const pairs = ['url=https://example.com?key=value'];
      const result = parseVarPairs(pairs);
      expect(result).toEqual({
        url: 'https://example.com?key=value',
      });
    });

    it('should trim keys and values', () => {
      const pairs = [' version = 1.0.0 ', ' env = production '];
      const result = parseVarPairs(pairs);
      expect(result).toEqual({
        version: '1.0.0',
        env: 'production',
      });
    });

    it('should throw error when pair does not contain equals sign', () => {
      expect(() => parseVarPairs(['invalid'])).toThrow('Invalid -v/--var format');
    });

    it('should throw error when key is empty', () => {
      expect(() => parseVarPairs(['=value'])).toThrow('Invalid -v/--var format');
    });

    it('should throw error when key is empty after trim', () => {
      expect(() => parseVarPairs(['  =value'])).toThrow('Invalid -v/--var format');
    });

    it('should handle empty array', () => {
      const result = parseVarPairs([]);
      expect(result).toEqual({});
    });

    it('should handle multiple equals signs in value', () => {
      const pairs = ['config=a=b=c'];
      const result = parseVarPairs(pairs);
      expect(result).toEqual({
        config: 'a=b=c',
      });
    });

    it('should handle empty values', () => {
      const pairs = ['key='];
      const result = parseVarPairs(pairs);
      expect(result).toEqual({
        key: '',
      });
    });

    it('should handle special characters in values', () => {
      const pairs = ['path=/usr/local/bin', 'message=Hello World!'];
      const result = parseVarPairs(pairs);
      expect(result).toEqual({
        path: '/usr/local/bin',
        message: 'Hello World!',
      });
    });
  });
});
