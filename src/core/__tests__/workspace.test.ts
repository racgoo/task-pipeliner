import { describe, it, expect } from 'vitest';
import { Workspace } from '../workspace.js';

describe('Workspace', () => {
  it('should set and get facts', () => {
    const workspace = new Workspace();
    workspace.setFact('test', true);
    expect(workspace.hasFact('test')).toBe(true);
    expect(workspace.getFact('test')).toBe(true);
  });

  it('should set and get choices', () => {
    const workspace = new Workspace();
    workspace.setChoice('staging', 'staging');
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.getChoice('staging')).toBe('staging');
  });

  it('should return false for non-existent choice', () => {
    const workspace = new Workspace();
    expect(workspace.hasChoice('nonexistent')).toBe(false);
  });

  it('should clone workspace state', () => {
    const workspace = new Workspace();
    workspace.setFact('test', true);
    workspace.setChoice('staging', 'staging');
    
    const cloned = workspace.clone();
    expect(cloned.hasFact('test')).toBe(true);
    expect(cloned.hasChoice('staging')).toBe(true);
  });
});

