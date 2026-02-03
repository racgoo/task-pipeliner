import { stringify, parse } from 'yaml';
import type { Workflow } from '../types/workflow';

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

