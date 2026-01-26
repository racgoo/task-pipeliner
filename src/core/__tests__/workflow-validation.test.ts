import { describe, it, expect } from 'vitest';
import { YAMLParser, JSONParser } from '../parser.js';

describe('Workflow Validation', () => {
  describe('YAMLParser', () => {
    it('should validate correct workflow', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - run: echo "hello"
`;
      const workflow = parser.parse(yaml);
      expect(workflow.name).toBe('test');
      expect(workflow.steps).toHaveLength(1);
    });

    it('should reject workflow with invalid step', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - invalid_step: "this should fail"
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
    });

    it('should reject workflow without steps', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
    });

    it('should reject workflow with empty steps array', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps: []
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
    });

    it('should validate workflow with all step types', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - run: echo "hello"
  - choose:
      message: "Select"
      options:
        - id: opt1
          label: "Option 1"
      as: choice
  - prompt:
      message: "Enter name"
      as: name
  - parallel:
      - run: echo "task1"
      - run: echo "task2"
  - fail:
      message: "Error"
`;
      const workflow = parser.parse(yaml);
      expect(workflow.steps).toHaveLength(5);
    });
  });

  describe('JSONParser', () => {
    it('should validate correct workflow', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        steps: [{ run: 'echo "hello"' }],
      });
      const workflow = parser.parse(json);
      expect(workflow.name).toBe('test');
      expect(workflow.steps).toHaveLength(1);
    });

    it('should reject workflow with invalid step', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        steps: [{ invalid_step: 'this should fail' }],
      });
      expect(() => parser.parse(json)).toThrow('Invalid workflow structure');
    });

    it('should reject workflow without steps', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
      });
      expect(() => parser.parse(json)).toThrow('Invalid workflow structure');
    });

    it('should reject invalid JSON format', () => {
      const parser = new JSONParser();
      const json = '{ invalid json }';
      expect(() => parser.parse(json)).toThrow('Invalid JSON format');
    });

    it('should validate workflow with conditions', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        steps: [
          {
            run: 'echo "hello"',
            when: {
              var: {
                env: 'dev',
              },
            },
          },
        ],
      });
      const workflow = parser.parse(json);
      expect(workflow.steps).toHaveLength(1);
      expect(workflow.steps[0]).toHaveProperty('when');
    });
  });
});
