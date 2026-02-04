import { describe, it, expect } from 'vitest';
import { YAMLParser, JSONParser } from '../parser';

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

    it('should reject workflow with choose inside parallel', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - parallel:
      - run: echo "hi"
      - choose:
          message: "Select"
          options:
            - id: a
              label: "A"
          as: x
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(yaml)).toThrow(/not allowed inside 'parallel' block/);
    });

    it('should reject workflow with prompt inside parallel', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - parallel:
      - run: echo "hi"
      - prompt:
          message: "Enter value"
          as: val
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(yaml)).toThrow(/not allowed inside 'parallel' block/);
    });

    it('should accept workflow with global shell configuration', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
shell:
  - bash
  - -lc
steps:
  - run: echo "hello"
`;
      const workflow = parser.parse(yaml);
      expect(workflow.shell).toEqual(['bash', '-lc']);
    });

    it('should accept step with shell configuration', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - run: echo "hello"
    shell:
      - zsh
      - -c
`;
      const workflow = parser.parse(yaml);
      expect(workflow.steps).toHaveLength(1);
      expect('shell' in workflow.steps[0] && workflow.steps[0].shell).toEqual(['zsh', '-c']);
    });

    it('should reject workflow with empty shell array', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
shell: []
steps:
  - run: echo "hello"
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(yaml)).toThrow(/shell.*cannot be empty/i);
    });

    it('should reject step with empty shell array', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
steps:
  - run: echo "hello"
    shell: []
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(yaml)).toThrow(/shell.*cannot be empty/i);
    });

    it('should accept workflow with profiles', () => {
      const parser = new YAMLParser();
      const yaml = `
name: Profiles Example
profiles:
  - name: Test
    var:
      mode: "dev"
      label: "test-label"
  - name: Prod
    var:
      mode: "prod"
      label: "prod-label"
steps:
  - run: echo "hi"
`;
      const workflow = parser.parse(yaml);
      expect(workflow.name).toBe('Profiles Example');
      expect(workflow.profiles).toHaveLength(2);
      expect(workflow.profiles?.[0].name).toBe('Test');
      expect(workflow.profiles?.[0].var).toEqual({ mode: 'dev', label: 'test-label' });
      expect(workflow.profiles?.[1].name).toBe('Prod');
      expect(workflow.profiles?.[1].var).toEqual({ mode: 'prod', label: 'prod-label' });
      expect(workflow.steps).toHaveLength(1);
    });

    it('should reject workflow with profile with empty name', () => {
      const parser = new YAMLParser();
      const yaml = `
name: test
profiles:
  - name: ""
    var:
      x: "y"
steps:
  - run: echo "hi"
`;
      expect(() => parser.parse(yaml)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(yaml)).toThrow(/Profile name|non-empty/i);
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

    it('should reject workflow with choose inside parallel', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        steps: [
          {
            parallel: [
              { run: 'echo "hi"' },
              {
                choose: {
                  message: 'Select',
                  options: [{ id: 'a', label: 'A' }],
                  as: 'x',
                },
              },
            ],
          },
        ],
      });
      expect(() => parser.parse(json)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(json)).toThrow(/not allowed inside 'parallel' block/);
    });

    it('should reject workflow with prompt inside parallel', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        steps: [
          {
            parallel: [{ run: 'echo "hi"' }, { prompt: { message: 'Enter value', as: 'val' } }],
          },
        ],
      });
      expect(() => parser.parse(json)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(json)).toThrow(/not allowed inside 'parallel' block/);
    });

    it('should accept workflow with global shell configuration', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        shell: ['bash', '-lc'],
        steps: [{ run: 'echo "hello"' }],
      });
      const workflow = parser.parse(json);
      expect(workflow.shell).toEqual(['bash', '-lc']);
    });

    it('should accept step with shell configuration', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        steps: [
          {
            run: 'echo "hello"',
            shell: ['zsh', '-c'],
          },
        ],
      });
      const workflow = parser.parse(json);
      expect(workflow.steps).toHaveLength(1);
      expect('shell' in workflow.steps[0] && workflow.steps[0].shell).toEqual(['zsh', '-c']);
    });

    it('should reject workflow with empty shell array', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        shell: [],
        steps: [{ run: 'echo "hello"' }],
      });
      expect(() => parser.parse(json)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(json)).toThrow(/shell.*cannot be empty/i);
    });

    it('should accept workflow with profiles', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'Profiles Example',
        profiles: [
          { name: 'Test', var: { mode: 'dev', label: 'test-label' } },
          { name: 'Prod', var: { mode: 'prod', label: 'prod-label' } },
        ],
        steps: [{ run: 'echo "hi"' }],
      });
      const workflow = parser.parse(json);
      expect(workflow.name).toBe('Profiles Example');
      expect(workflow.profiles).toHaveLength(2);
      expect(workflow.profiles?.[0].name).toBe('Test');
      expect(workflow.profiles?.[0].var).toEqual({ mode: 'dev', label: 'test-label' });
      expect(workflow.profiles?.[1].name).toBe('Prod');
      expect(workflow.steps).toHaveLength(1);
    });

    it('should coerce profile var values to string', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        profiles: [{ name: 'Numeric', var: { count: 42, flag: true } }],
        steps: [{ run: 'echo "hi"' }],
      });
      const workflow = parser.parse(json);
      expect(workflow.profiles?.[0].var.count).toBe('42');
      expect(workflow.profiles?.[0].var.flag).toBe('true');
    });

    it('should reject workflow with profile with empty name', () => {
      const parser = new JSONParser();
      const json = JSON.stringify({
        name: 'test',
        profiles: [{ name: '', var: { x: 'y' } }],
        steps: [{ run: 'echo "hi"' }],
      });
      expect(() => parser.parse(json)).toThrow('Invalid workflow structure');
      expect(() => parser.parse(json)).toThrow(/Profile name|non-empty/i);
    });
  });
});
