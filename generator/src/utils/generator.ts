import { stringify, parse } from 'yaml';
import type { Workflow } from '../types/workflow';
import type { ScheduleFile } from '../types/schedule';

/**
 * Generate YAML from workflow object
 */
export function generateYAML(workflow: Workflow): string {
  return stringify(workflow, {
    indent: 2,
    lineWidth: 0,
  });
}

/**
 * Generate JSON from workflow object
 */
export function generateJSON(workflow: Workflow): string {
  return JSON.stringify(workflow, null, 2);
}

/**
 * Parse YAML to workflow object
 */
export function parseYAML(content: string): Workflow {
  try {
    const parsed = parse(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML: root must be an object');
    }
    if (!Array.isArray(parsed.steps)) {
      throw new Error('Invalid workflow: "steps" must be an array');
    }
    return parsed as Workflow;
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse JSON to workflow object
 */
export function parseJSON(content: string): Workflow {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON: root must be an object');
    }
    if (!Array.isArray(parsed.steps)) {
      throw new Error('Invalid workflow: "steps" must be an array');
    }
    return parsed as Workflow;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download YAML
 */
export function downloadYAML(workflow: Workflow, filename: string = 'workflow.yaml'): void {
  const yaml = generateYAML(workflow);
  downloadFile(yaml, filename, 'text/yaml');
}

/**
 * Download JSON
 */
export function downloadJSON(workflow: Workflow, filename: string = 'workflow.json'): void {
  const json = generateJSON(workflow);
  downloadFile(json, filename, 'application/json');
}

// --- Schedule file (for tp schedule add) ---

/**
 * Generate YAML from schedule file object
 */
export function generateScheduleYAML(scheduleFile: ScheduleFile): string {
  return stringify(scheduleFile, {
    indent: 2,
    lineWidth: 0,
  });
}

/**
 * Generate JSON from schedule file object
 */
export function generateScheduleJSON(scheduleFile: ScheduleFile): string {
  return JSON.stringify(scheduleFile, null, 2);
}

/**
 * Parse YAML to schedule file object
 */
export function parseScheduleYAML(content: string): ScheduleFile {
  try {
    const parsed = parse(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML: root must be an object');
    }
    if (!Array.isArray(parsed.schedules)) {
      throw new Error('Invalid schedule file: "schedules" must be an array');
    }
    return parsed as ScheduleFile;
  } catch (error) {
    throw new Error(
      `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Parse JSON to schedule file object
 */
export function parseScheduleJSON(content: string): ScheduleFile {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON: root must be an object');
    }
    if (!Array.isArray(parsed.schedules)) {
      throw new Error('Invalid schedule file: "schedules" must be an array');
    }
    return parsed as ScheduleFile;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Download schedule YAML
 */
export function downloadScheduleYAML(
  scheduleFile: ScheduleFile,
  filename: string = 'schedules.yaml'
): void {
  const yaml = generateScheduleYAML(scheduleFile);
  downloadFile(yaml, filename, 'text/yaml');
}

/**
 * Download schedule JSON
 */
export function downloadScheduleJSON(
  scheduleFile: ScheduleFile,
  filename: string = 'schedules.json'
): void {
  const json = generateScheduleJSON(scheduleFile);
  downloadFile(json, filename, 'application/json');
}

