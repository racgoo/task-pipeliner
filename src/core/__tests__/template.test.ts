/**
 * Template Variable Substitution Tests
 */

import { describe, it, expect } from 'vitest';
import { substituteVariables } from '../template';
import { Workspace } from '../workspace';

describe('Template Variable Substitution', () => {
  it('should substitute variables without spaces', () => {
    const workspace = new Workspace();
    workspace.setVariable('name', 'John');
    workspace.setVariable('version', '1.0.0');

    const result = substituteVariables('Hello {{name}}, version {{version}}', workspace);
    expect(result).toBe('Hello John, version 1.0.0');
  });

  it('should substitute variables with spaces', () => {
    const workspace = new Workspace();
    workspace.setVariable('name', 'John');
    workspace.setVariable('mode', 'production');

    const result1 = substituteVariables('Hello {{ name }}', workspace);
    expect(result1).toBe('Hello John');

    const result2 = substituteVariables('Mode: {{ mode }}', workspace);
    expect(result2).toBe('Mode: production');
  });

  it('should substitute variables with multiple spaces', () => {
    const workspace = new Workspace();
    workspace.setVariable('env', 'dev');

    const result = substituteVariables('Environment: {{  env  }}', workspace);
    expect(result).toBe('Environment: dev');
  });

  it('should handle mixed spacing', () => {
    const workspace = new Workspace();
    workspace.setVariable('project', 'MyApp');
    workspace.setVariable('version', '2.0');
    workspace.setVariable('env', 'staging');

    const result = substituteVariables(
      'Deploying {{project}} v{{ version }} to {{  env  }}',
      workspace
    );
    expect(result).toBe('Deploying MyApp v2.0 to staging');
  });

  it('should return original text for non-existent variables', () => {
    const workspace = new Workspace();
    const result = substituteVariables('Hello {{unknown}}', workspace);
    expect(result).toBe('Hello {{unknown}}');
  });

  it('should return original text with spaces for non-existent variables', () => {
    const workspace = new Workspace();
    const result = substituteVariables('Hello {{ unknown }}', workspace);
    expect(result).toBe('Hello {{ unknown }}');
  });

  it('should substitute from facts', () => {
    const workspace = new Workspace();
    workspace.setFact('isProduction', 'true');

    const result = substituteVariables('Production: {{isProduction}}', workspace);
    expect(result).toBe('Production: true');
  });

  it('should substitute from choices', () => {
    const workspace = new Workspace();
    workspace.setChoice('env', 'staging');

    const result = substituteVariables('Environment: {{env}}', workspace);
    expect(result).toBe('Environment: staging');
  });

  it('should prioritize variables over facts and choices', () => {
    const workspace = new Workspace();
    workspace.setVariable('name', 'from-variable');
    workspace.setFact('name', 'from-fact');
    workspace.setChoice('name', 'from-choice');

    const result = substituteVariables('Name: {{name}}', workspace);
    expect(result).toBe('Name: from-variable');
  });

  it('should handle empty string values', () => {
    const workspace = new Workspace();
    workspace.setVariable('empty', '');

    const result = substituteVariables('Value: {{empty}}', workspace);
    expect(result).toBe('Value: ');
  });

  it('should handle special characters in values', () => {
    const workspace = new Workspace();
    workspace.setVariable('path', '/usr/local/bin');
    workspace.setVariable('url', 'https://example.com');

    const result = substituteVariables('Path: {{path}}, URL: {{url}}', workspace);
    expect(result).toBe('Path: /usr/local/bin, URL: https://example.com');
  });

  it('should handle quotes in values', () => {
    const workspace = new Workspace();
    workspace.setVariable('message', 'Hello "World"');

    const result = substituteVariables('Message: {{message}}', workspace);
    expect(result).toBe('Message: Hello "World"');
  });

  it('should handle multiple occurrences of the same variable', () => {
    const workspace = new Workspace();
    workspace.setVariable('name', 'Alice');

    const result = substituteVariables('{{name}} says hello to {{name}}', workspace);
    expect(result).toBe('Alice says hello to Alice');
  });

  it('should handle variables in complex strings', () => {
    const workspace = new Workspace();
    workspace.setVariable('project', 'MyApp');
    workspace.setVariable('version', '1.2.3');
    workspace.setVariable('env', 'production');

    const result = substituteVariables(
      'echo "Deploying {{ project }} v{{ version }} to {{ env }}"',
      workspace
    );
    expect(result).toBe('echo "Deploying MyApp v1.2.3 to production"');
  });
});
