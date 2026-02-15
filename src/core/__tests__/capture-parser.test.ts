import { describe, it, expect } from 'vitest';
import type { Capture } from '@tp-types/workflow';
import { parseCapture } from '../workflow/capture-parser';

describe('Capture Parser', () => {
  describe('Full Capture', () => {
    it('should capture full stdout as single string', () => {
      const capture: Capture = { as: 'var1' };
      const stdout = ['line1', 'line2', 'line3'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should handle single line stdout', () => {
      const capture: Capture = { as: 'var1' };
      const stdout = ['single line'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('single line');
    });

    it('should handle empty stdout', () => {
      const capture: Capture = { as: 'var1' };
      const stdout: string[] = [];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('');
    });
  });

  describe('Regex Capture', () => {
    it('should extract first capture group from regex match', () => {
      const capture: Capture = { regex: 'channel=(\\S+)', as: 'channel' };
      const stdout = ['channel=production'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('production');
    });

    it('should extract from multiline stdout', () => {
      const capture: Capture = { regex: 'user=(\\S+)', as: 'user' };
      const stdout = ['channel=production', 'user=admin', 'env=staging'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('admin');
    });

    it('should return null if no match', () => {
      const capture: Capture = { regex: 'missing=(\\S+)', as: 'var' };
      const stdout = ['channel=production'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should return null if regex has no capture group', () => {
      const capture: Capture = { regex: 'channel=production', as: 'var' };
      const stdout = ['channel=production'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });
  });

  describe('JSON Capture', () => {
    it('should extract value using JSONPath', () => {
      const capture: Capture = { json: '$.meta.channel', as: 'channel' };
      const stdout = ['{"meta":{"channel":"production"}}'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('production');
    });

    it('should handle multiline JSON', () => {
      const capture: Capture = { json: '$.version', as: 'version' };
      const stdout = ['{', '  "version": "1.0.0"', '}'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('1.0.0');
    });

    it('should return null for invalid JSON', () => {
      const capture: Capture = { json: '$.version', as: 'version' };
      const stdout = ['invalid json'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should return null if JSONPath not found', () => {
      const capture: Capture = { json: '$.missing', as: 'var' };
      const stdout = ['{"version":"1.0.0"}'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should stringify non-string values', () => {
      const capture: Capture = { json: '$.count', as: 'count' };
      const stdout = ['{"count":42}'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('42');
    });
  });

  describe('YAML/YML Capture', () => {
    it('should extract value using JSONPath from YAML', () => {
      const capture: Capture = { yaml: '$.meta.channel', as: 'channel' };
      const stdout = ['meta:', '  channel: production'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('production');
    });

    it('should support yml alias', () => {
      const capture: Capture = { yml: '$.version', as: 'version' };
      const stdout = ['version: 1.0.0'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('1.0.0');
    });

    it('should return null for invalid YAML', () => {
      const capture: Capture = { yaml: '$.version', as: 'version' };
      const stdout = ['invalid: yaml: content'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should return null if JSONPath not found', () => {
      const capture: Capture = { yaml: '$.missing', as: 'var' };
      const stdout = ['version: 1.0.0'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });
  });

  describe('KV Capture', () => {
    it('should extract value for exact key match', () => {
      const capture: Capture = { kv: 'RACGOO', as: 'var' };
      const stdout = ['RACGOO=HI'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('HI');
    });

    it('should extract value when multiple keys exist', () => {
      const capture: Capture = { kv: 'RACGOO', as: 'var' };
      const stdout = ['RACGOO=HI', 'RACGOO2=HI2'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('HI');
    });

    it('should not match partial key (RACGOO2 when searching for RACGOO)', () => {
      const capture: Capture = { kv: 'RACGOO', as: 'var' };
      const stdout = ['RACGOO2=HI2'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should support key with spaces', () => {
      const capture: Capture = { kv: 'KEY', as: 'var' };
      const stdout = ['KEY = value'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('value');
    });

    it('should remove quotes from value', () => {
      const capture: Capture = { kv: 'KEY', as: 'var' };
      const stdout = ['KEY="quoted value"'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('quoted value');
    });

    it('should remove single quotes from value', () => {
      const capture: Capture = { kv: 'KEY', as: 'var' };
      const stdout = ["KEY='single quoted'"];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('single quoted');
    });

    it('should skip comment lines', () => {
      const capture: Capture = { kv: 'KEY', as: 'var' };
      const stdout = ['# KEY=commented', 'KEY=actual'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('actual');
    });

    it('should skip empty lines', () => {
      const capture: Capture = { kv: 'KEY', as: 'var' };
      const stdout = ['', 'KEY=value', ''];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('value');
    });

    it('should return null if key not found', () => {
      const capture: Capture = { kv: 'MISSING', as: 'var' };
      const stdout = ['KEY=value'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should handle keys with special regex characters', () => {
      const capture: Capture = { kv: 'key.with.dots', as: 'var' };
      const stdout = ['key.with.dots=value'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('value');
    });

    it('should extract value for key with underscores (e.g. TOP_SECRET)', () => {
      const capture: Capture = { kv: 'TOP_SECRET', as: 'TOP_SECRET_VARIABLE' };
      const stdout = ['TOP_SECRET=1234567890'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('1234567890');
    });

    it('should not return full line when key has underscores', () => {
      const capture: Capture = { kv: 'TOP_SECRET', as: 'var' };
      const stdout = ['TOP_SECRET=1234567890'];
      const result = parseCapture(capture, stdout);
      expect(result).not.toBe('TOP_SECRET=1234567890');
      expect(result).toBe('1234567890');
    });
  });

  describe('After Capture', () => {
    it('should extract text after marker', () => {
      const capture: Capture = { after: 'user=', as: 'var' };
      const stdout = ['prefix user=admin suffix'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('admin suffix');
    });

    it('should extract from multiline after marker', () => {
      const capture: Capture = { after: 'start:', as: 'var' };
      const stdout = ['before', 'start:content', 'after'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('content\nafter');
    });

    it('should return null if marker not found', () => {
      const capture: Capture = { after: 'missing=', as: 'var' };
      const stdout = ['content'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });
  });

  describe('Before Capture', () => {
    it('should extract text before marker', () => {
      const capture: Capture = { before: '\nend', as: 'var' };
      const stdout = ['content', 'end', 'after'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('content');
    });

    it('should return null if marker not found', () => {
      const capture: Capture = { before: 'missing', as: 'var' };
      const stdout = ['content'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });
  });

  describe('Between Capture', () => {
    it('should extract text between after and before markers', () => {
      const capture: Capture = { after: 'start:', before: '\nend', as: 'var' };
      const stdout = ['before', 'start:middle', 'end', 'after'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('middle');
    });

    it('should return null if after marker not found', () => {
      const capture: Capture = { after: 'missing:', before: 'end', as: 'var' };
      const stdout = ['content', 'end'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should return null if before marker not found', () => {
      const capture: Capture = { after: 'start:', before: 'missing', as: 'var' };
      const stdout = ['start:content'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });
  });

  describe('Line Capture', () => {
    it('should extract lines from specified range (1-based, inclusive)', () => {
      const capture: Capture = { line: { from: 2, to: 4 }, as: 'var' };
      const stdout = ['line1', 'line2', 'line3', 'line4', 'line5'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('line2\nline3\nline4');
    });

    it('should handle single line range', () => {
      const capture: Capture = { line: { from: 3, to: 3 }, as: 'var' };
      const stdout = ['line1', 'line2', 'line3'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('line3');
    });

    it('should handle first line', () => {
      const capture: Capture = { line: { from: 1, to: 1 }, as: 'var' };
      const stdout = ['line1', 'line2'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('line1');
    });

    it('should handle last line', () => {
      const capture: Capture = { line: { from: 2, to: 2 }, as: 'var' };
      const stdout = ['line1', 'line2'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('line2');
    });

    it('should return null if from > to', () => {
      const capture: Capture = { line: { from: 3, to: 2 }, as: 'var' };
      const stdout = ['line1', 'line2', 'line3'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should return null if from is out of range', () => {
      const capture: Capture = { line: { from: 10, to: 15 }, as: 'var' };
      const stdout = ['line1', 'line2'];
      const result = parseCapture(capture, stdout);
      expect(result).toBeNull();
    });

    it('should clamp to to stdout length', () => {
      const capture: Capture = { line: { from: 2, to: 10 }, as: 'var' };
      const stdout = ['line1', 'line2', 'line3'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('line2\nline3');
    });
  });

  describe('Error Handling', () => {
    it('should return null on parsing errors', () => {
      // Invalid regex that throws
      const capture: Capture = { regex: '[', as: 'var' };
      const stdout = ['content'];
      const result = parseCapture(capture, stdout);
      // Should handle error gracefully
      expect(result).toBeNull();
    });

    it('should treat unknown capture type as full capture', () => {
      // TypeScript won't allow this, but runtime might
      // If capture has 'as' but no known fields, it's treated as full capture
      const capture = { unknown: 'field', as: 'var' } as unknown as Capture;
      const stdout = ['content'];
      const result = parseCapture(capture, stdout);
      expect(result).toBe('content'); // Full capture behavior
    });
  });
});
