import { describe, it, expect } from 'vitest';
import { SETUP_WORKFLOW_EXAMPLES, SETUP_SCHEDULE_EXAMPLES } from '../setup-examples';

describe('SetupExamples', () => {
  describe('SETUP_WORKFLOW_EXAMPLES', () => {
    it('should contain example workflow files', () => {
      expect(SETUP_WORKFLOW_EXAMPLES.length).toBeGreaterThan(0);
    });

    it('should have filename and content for each example', () => {
      for (const example of SETUP_WORKFLOW_EXAMPLES) {
        expect(example.filename).toBeTruthy();
        expect(typeof example.filename).toBe('string');
        expect(example.content).toBeTruthy();
        expect(typeof example.content).toBe('string');
      }
    });

    it('should have valid YAML filenames', () => {
      for (const example of SETUP_WORKFLOW_EXAMPLES) {
        expect(example.filename).toMatch(/\.ya?ml$/);
      }
    });

    it('should contain example-hello.yaml', () => {
      const helloExample = SETUP_WORKFLOW_EXAMPLES.find((e) => e.filename === 'example-hello.yaml');
      expect(helloExample).toBeDefined();
      expect(helloExample?.content).toContain('name:');
      expect(helloExample?.content).toContain('steps:');
    });

    it('should contain example-build.yaml', () => {
      const buildExample = SETUP_WORKFLOW_EXAMPLES.find((e) => e.filename === 'example-build.yaml');
      expect(buildExample).toBeDefined();
      expect(buildExample?.content).toContain('name:');
      expect(buildExample?.content).toContain('profiles:');
    });

    it('should have valid YAML content structure', () => {
      for (const example of SETUP_WORKFLOW_EXAMPLES) {
        expect(example.content).toContain('name:');
        expect(example.content).toContain('steps:');
      }
    });
  });

  describe('SETUP_SCHEDULE_EXAMPLES', () => {
    it('should contain example schedule files', () => {
      expect(SETUP_SCHEDULE_EXAMPLES.length).toBeGreaterThan(0);
    });

    it('should have filename and content for each example', () => {
      for (const example of SETUP_SCHEDULE_EXAMPLES) {
        expect(example.filename).toBeTruthy();
        expect(typeof example.filename).toBe('string');
        expect(example.content).toBeTruthy();
        expect(typeof example.content).toBe('string');
      }
    });

    it('should have valid YAML filenames', () => {
      for (const example of SETUP_SCHEDULE_EXAMPLES) {
        expect(example.filename).toMatch(/\.ya?ml$/);
      }
    });

    it('should contain example-daily.yaml', () => {
      const dailyExample = SETUP_SCHEDULE_EXAMPLES.find((e) => e.filename === 'example-daily.yaml');
      expect(dailyExample).toBeDefined();
      expect(dailyExample?.content).toContain('schedules:');
      expect(dailyExample?.content).toContain('cron:');
    });

    it('should contain example-hourly.yaml', () => {
      const hourlyExample = SETUP_SCHEDULE_EXAMPLES.find((e) => e.filename === 'example-hourly.yaml');
      expect(hourlyExample).toBeDefined();
      expect(hourlyExample?.content).toContain('schedules:');
    });

    it('should have valid schedule content structure', () => {
      for (const example of SETUP_SCHEDULE_EXAMPLES) {
        expect(example.content).toContain('schedules:');
      }
    });
  });
});

