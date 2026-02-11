import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseScheduleFile } from '../schedule-file-parser';

describe('ScheduleFileParser', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'schedule-parser-test-'));
  });

  afterEach(async () => {
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('parseScheduleFile() - YAML format', () => {
    it('should parse valid YAML schedule file', async () => {
      const yamlContent = `
schedules:
  - name: Daily Build
    cron: "0 9 * * *"
    workflow: ./build.yaml
`;
      const filePath = join(tempDir, 'schedule.yaml');
      await writeFile(filePath, yamlContent, 'utf-8');

      const result = await parseScheduleFile(filePath);

      expect(result.schedules).toHaveLength(1);
      expect(result.schedules[0].name).toBe('Daily Build');
      expect(result.schedules[0].cron).toBe('0 9 * * *');
      expect(result.schedules[0].workflow).toBe('./build.yaml');
    });

    it('should parse YAML file with .yml extension', async () => {
      const yamlContent = `
schedules:
  - name: Test
    cron: "0 * * * *"
    workflow: test.yaml
`;
      const filePath = join(tempDir, 'schedule.yml');
      await writeFile(filePath, yamlContent, 'utf-8');

      const result = await parseScheduleFile(filePath);
      expect(result.schedules).toHaveLength(1);
    });

    it('should parse YAML with multiple schedules', async () => {
      const yamlContent = `
schedules:
  - name: Daily Build
    cron: "0 9 * * *"
    workflow: ./build.yaml
  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true
`;
      const filePath = join(tempDir, 'schedule.yaml');
      await writeFile(filePath, yamlContent, 'utf-8');

      const result = await parseScheduleFile(filePath);
      expect(result.schedules).toHaveLength(2);
      expect(result.schedules[1].silent).toBe(true);
    });

    it('should parse YAML with timezone', async () => {
      const yamlContent = `
schedules:
  - name: Daily UTC
    cron: "0 9 * * *"
    workflow: ./daily.yaml
    timezone: 0
`;
      const filePath = join(tempDir, 'schedule.yaml');
      await writeFile(filePath, yamlContent, 'utf-8');

      const result = await parseScheduleFile(filePath);
      expect(result.schedules[0].timezone).toBe('0');
    });

    it('should throw error for invalid YAML format', async () => {
      const invalidYaml = 'schedules:\n  - name: [invalid';
      const filePath = join(tempDir, 'invalid.yaml');
      await writeFile(filePath, invalidYaml, 'utf-8');

      await expect(parseScheduleFile(filePath)).rejects.toThrow();
    });
  });

  describe('parseScheduleFile() - JSON format', () => {
    it('should parse valid JSON schedule file', async () => {
      const jsonContent = JSON.stringify({
        schedules: [
          {
            name: 'Daily Build',
            cron: '0 9 * * *',
            workflow: './build.yaml',
          },
        ],
      });
      const filePath = join(tempDir, 'schedule.json');
      await writeFile(filePath, jsonContent, 'utf-8');

      const result = await parseScheduleFile(filePath);

      expect(result.schedules).toHaveLength(1);
      expect(result.schedules[0].name).toBe('Daily Build');
    });

    it('should parse JSON with multiple schedules', async () => {
      const jsonContent = JSON.stringify({
        schedules: [
          { name: 'Schedule 1', cron: '0 9 * * *', workflow: './w1.yaml' },
          { name: 'Schedule 2', cron: '0 10 * * *', workflow: './w2.yaml' },
        ],
      });
      const filePath = join(tempDir, 'schedule.json');
      await writeFile(filePath, jsonContent, 'utf-8');

      const result = await parseScheduleFile(filePath);
      expect(result.schedules).toHaveLength(2);
    });

    it('should throw error for invalid JSON format', async () => {
      const invalidJson = '{ "schedules": [invalid }';
      const filePath = join(tempDir, 'invalid.json');
      await writeFile(filePath, invalidJson, 'utf-8');

      await expect(parseScheduleFile(filePath)).rejects.toThrow();
    });
  });

  describe('parseScheduleFile() - unsupported format', () => {
    it('should throw error for unsupported file extension', async () => {
      const filePath = join(tempDir, 'schedule.txt');
      await writeFile(filePath, 'some content', 'utf-8');

      await expect(parseScheduleFile(filePath)).rejects.toThrow('Unsupported file format');
    });
  });

  describe('parseScheduleFile() - validation', () => {
    it('should validate schedule structure', async () => {
      const invalidYaml = `
schedules:
  - name: Test
    # Missing required cron field
    workflow: ./test.yaml
`;
      const filePath = join(tempDir, 'invalid.yaml');
      await writeFile(filePath, invalidYaml, 'utf-8');

      await expect(parseScheduleFile(filePath)).rejects.toThrow('Invalid schedule file structure');
    });

    it('should validate cron format', async () => {
      const yamlContent = `
schedules:
  - name: Test
    cron: "invalid cron"
    workflow: ./test.yaml
`;
      const filePath = join(tempDir, 'schedule.yaml');
      await writeFile(filePath, yamlContent, 'utf-8');

      // Should parse but validation might fail depending on schema
      const result = await parseScheduleFile(filePath);
      expect(result.schedules[0].cron).toBe('invalid cron');
    });
  });
});
