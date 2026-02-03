import { useState, useEffect } from 'react';
import type { Workflow, Step } from '../types/workflow';
import { generateYAML, generateJSON, downloadYAML, downloadJSON, parseYAML, parseJSON } from '../utils/generator';
import StepEditor from './StepEditor';
import './WorkflowBuilder.css';

export default function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: '',
    baseDir: '',
    shell: undefined,
    steps: [],
  });
  const [outputFormat, setOutputFormat] = useState<'yaml' | 'json'>('yaml');
  const [preview, setPreview] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);

  const updateWorkflow = (updates: Partial<Workflow>) => {
    setWorkflow((prev) => ({ ...prev, ...updates }));
  };

  const addStep = (step: Step) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, step],
    }));
  };

  const updateStep = (index: number, step: Step) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? step : s)),
    }));
  };

  const removeStep = (index: number) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === workflow.steps.length - 1) return;

    const newSteps = [...workflow.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

    setWorkflow((prev) => ({
      ...prev,
      steps: newSteps,
    }));
  };

  const generatePreview = () => {
    const cleanWorkflow: Workflow = {
      ...workflow,
      name: workflow.name || undefined,
      baseDir: workflow.baseDir || undefined,
      shell: workflow.shell && workflow.shell.length > 0 ? workflow.shell : undefined,
    };
    setPreview(outputFormat === 'yaml' ? generateYAML(cleanWorkflow) : generateJSON(cleanWorkflow));
    setPreviewError(null);
  };

  const handlePreviewChange = (value: string) => {
    setPreview(value);
    setPreviewError(null);
  };

  const loadFromPreview = () => {
    try {
      const parsed = outputFormat === 'yaml' ? parseYAML(preview) : parseJSON(preview);
      setWorkflow({
        name: parsed.name || '',
        baseDir: parsed.baseDir || '',
        shell: parsed.shell || undefined,
        steps: parsed.steps || [],
      });
      setPreviewError(null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to parse');
    }
  };

  // Auto-generate preview when output format changes (if preview exists)
  useEffect(() => {
    if (preview && !previewError) {
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputFormat]);

  const handleDownload = () => {
    const cleanWorkflow: Workflow = {
      ...workflow,
      name: workflow.name || undefined,
      baseDir: workflow.baseDir || undefined,
      shell: workflow.shell && workflow.shell.length > 0 ? workflow.shell : undefined,
    };
    if (outputFormat === 'yaml') {
      downloadYAML(cleanWorkflow);
    } else {
      downloadJSON(cleanWorkflow);
    }
  };

  return (
    <div className="workflow-builder">
      <div className="builder-header">
        <h1>Task Pipeliner Workflow Generator</h1>
        <p>Create workflow configurations visually</p>
        <div className="header-links">
          <a href="https://task-pipeliner.racgoo.com/" target="_blank" rel="noopener noreferrer">
            📚 Documentation
          </a>
          <a href="https://github.com/racgoo/task-pipeliner" target="_blank" rel="noopener noreferrer">
            💻 GitHub
          </a>
        </div>
      </div>

      <div className="builder-content">
        <div className="builder-panel">
          <div className="panel-header">
            <h2>Visual Editor</h2>
          </div>
          <div className="workflow-config">
            <h3 className="section-title">Workflow Configuration</h3>
            <div className="form-group">
              <label>Name (optional)</label>
              <input
                type="text"
                value={workflow.name || ''}
                onChange={(e) => updateWorkflow({ name: e.target.value })}
                placeholder="My Workflow"
              />
            </div>
            <div className="form-group">
              <label>Base Directory (optional)</label>
              <input
                type="text"
                value={workflow.baseDir || ''}
                onChange={(e) => updateWorkflow({ baseDir: e.target.value })}
                placeholder="./"
              />
            </div>
            <div className="form-group">
              <label>Shell (optional)</label>
              <input
                type="text"
                value={workflow.shell?.join(' ') || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const trimmed = value.trim();
                  if (trimmed) {
                    const shellArray = trimmed.split(/\s+/).filter((s) => s !== '');
                    updateWorkflow({ shell: shellArray.length > 0 ? shellArray : undefined });
                  } else {
                    updateWorkflow({ shell: undefined });
                  }
                }}
                placeholder="bash -lc"
              />
              <div className="field-hint">
                Global shell for all steps (space-separated). If omitted, uses your current shell ($SHELL). Example: <code>bash -lc</code> or <code>zsh -c</code>
              </div>
            </div>
          </div>

          <div className="steps-section">
            <div className="section-header">
              <h3 className="section-title">Steps</h3>
              <button 
                onClick={generatePreview} 
                className="sync-button sync-to-code" 
                title="Convert the current workflow from the visual editor to YAML or JSON code and display it in the code editor on the right. Use this when you want to export changes made in the visual editor as code."
              >
                <span className="button-icon">→</span>
                <span className="button-text">→ Code</span>
              </button>
            </div>
            <div className="step-type-buttons">
              <button onClick={() => addStep({ run: '' })}>+ Run</button>
              <button onClick={() => addStep({ choose: { message: '', options: [] } })}>
                + Choose
              </button>
              <button onClick={() => addStep({ prompt: { message: '', as: '' } })}>
                + Prompt
              </button>
              <button onClick={() => addStep({ parallel: [] })}>+ Parallel</button>
              <button onClick={() => addStep({ fail: { message: '' } })}>+ Fail</button>
            </div>

            <div className="steps-list">
              {workflow.steps.map((step, index) => (
                <StepEditor
                  key={index}
                  step={step}
                  index={index}
                  onUpdate={(updatedStep) => updateStep(index, updatedStep)}
                  onRemove={() => removeStep(index)}
                  onMoveUp={() => moveStep(index, 'up')}
                  onMoveDown={() => moveStep(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < workflow.steps.length - 1}
                />
              ))}
              {workflow.steps.length === 0 && (
                <div className="empty-state">
                  <p>No steps yet. Add a step to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="preview-panel">
          <div className="preview-header">
            <div className="panel-header">
              <h2>YAML / JSON Editor</h2>
            </div>
            <div className="preview-controls">
              <select
                value={outputFormat}
                onChange={(e) => {
                  setOutputFormat(e.target.value as 'yaml' | 'json');
                  if (preview) {
                    generatePreview();
                  }
                }}
              >
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
              </select>
              <button 
                onClick={loadFromPreview} 
                disabled={!preview} 
                className="sync-button sync-from-code" 
                title="Parse the YAML or JSON entered in the code editor and load it into the visual editor on the left. Use this when you want to edit or modify an existing YAML/JSON file. Parsing will fail if there are errors in the code."
              >
                <span className="button-icon">←</span>
                <span className="button-text">← Visual</span>
              </button>
              <button onClick={handleDownload} disabled={workflow.steps.length === 0}>
                Download
              </button>
            </div>
          </div>
          {previewError && (
            <div className="preview-error">
              <strong>Error:</strong> {previewError}
            </div>
          )}
          <div className="preview-content">
            <textarea
              value={preview}
              onChange={(e) => handlePreviewChange(e.target.value)}
              placeholder="Click '→ Code' in the Visual Editor to generate YAML/JSON, or paste your YAML/JSON here and click '← Visual' to import into the visual editor"
              className="preview-textarea"
              spellCheck={false}
            />
          </div>
          <div className="variable-hint">
            <strong>💡 Variable Usage:</strong> Use <code>{'{{variableName}}'}</code> or <code>{'{{ variableName }}'}</code> (with spaces) in commands to reference variables from <code>prompt</code> or <code>choose</code> steps. Variables are highlighted in <span className="variable-highlight">green</span>.
            <br />
            <strong>⚠️ YAML Syntax:</strong> If command contains quotes and colons before variables, wrap entire command in single quotes: <code>{'\'echo "mode: {{var}}\"\''}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

