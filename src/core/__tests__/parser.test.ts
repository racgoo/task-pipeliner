import { describe, it, expect } from 'vitest';
import { YAMLParser, JSONParser, getParser } from '../parser.js';

describe('Workflow Parser', () => {
  describe('YAMLParser', () => {
    it('should parse YAML workflow', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - run: echo "hello"
  - run: echo "world"
`;
      const workflow = parser.parse(yaml);
      
      expect(workflow.name).toBe('test');
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0]).toHaveProperty('run', 'echo "hello"');
      expect(workflow.steps[1]).toHaveProperty('run', 'echo "world"');
    });

    it('should extract step line numbers from YAML', () => {
      const parser = new YAMLParser();
      const yaml = `steps:
  - run: echo "hello"
  - run: echo "world"
`;
      const lineNumbers = parser.extractStepLineNumbers(yaml);
      
      expect(lineNumbers.get(0)).toBe(2); // First step is on line 2
      expect(lineNumbers.get(1)).toBe(3); // Second step is on line 3
    });
  });

  describe('JSONParser', () => {
    it('should parse JSON workflow', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        steps: [
          { run: 'echo "hello"' },
          { run: 'echo "world"' }
        ]
      });
      const workflow = parser.parse(json);
      
      expect(workflow.name).toBe('test');
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0]).toHaveProperty('run', 'echo "hello"');
      expect(workflow.steps[1]).toHaveProperty('run', 'echo "world"');
    });

    it('should throw error for invalid JSON', () => {
      const parser = new JSONParser();
      const invalidJson = '{ invalid json }';
      
      expect(() => parser.parse(invalidJson)).toThrow('Invalid JSON format');
    });

    it('should extract step line numbers from JSON', () => {
      const parser = new JSONParser();
      const json = `{
  "steps": [
    {
      "run": "echo hello"
    },
    {
      "run": "echo world"
    }
  ]
}`;
      const lineNumbers = parser.extractStepLineNumbers(json);
      
      // JSON steps start at the line where the object starts
      expect(lineNumbers.size).toBeGreaterThan(0);
      expect(lineNumbers.get(0)).toBeDefined();
      expect(lineNumbers.get(1)).toBeDefined();
    });
  });

  describe('getParser', () => {
    it('should return YAMLParser for .yaml extension', () => {
      const parser = getParser('workflow.yaml');
      expect(parser).toBeInstanceOf(YAMLParser);
    });

    it('should return YAMLParser for .yml extension', () => {
      const parser = getParser('workflow.yml');
      expect(parser).toBeInstanceOf(YAMLParser);
    });

    it('should return JSONParser for .json extension', () => {
      const parser = getParser('workflow.json');
      expect(parser).toBeInstanceOf(JSONParser);
    });

    it('should default to YAMLParser for unknown extension', () => {
      const parser = getParser('workflow.txt');
      expect(parser).toBeInstanceOf(YAMLParser);
    });

    it('should handle case-insensitive extensions', () => {
      expect(getParser('workflow.YAML')).toBeInstanceOf(YAMLParser);
      expect(getParser('workflow.YML')).toBeInstanceOf(YAMLParser);
      expect(getParser('workflow.JSON')).toBeInstanceOf(JSONParser);
    });
  });
});

