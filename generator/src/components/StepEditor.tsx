import { useState } from 'react';
import type { Step, RunStepOnError } from '../types/workflow';
import VariableHighlightInput from './VariableHighlightInput';
import './StepEditor.css';

interface StepEditorProps {
  step: Step;
  index: number;
  onUpdate: (step: Step) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function StepEditor({
  step,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: StepEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStepType = (): string => {
    if ('run' in step) return 'run';
    if ('choose' in step) return 'choose';
    if ('prompt' in step) return 'prompt';
    if ('parallel' in step) return 'parallel';
    if ('fail' in step) return 'fail';
    return 'unknown';
  };

  const stepType = getStepType();

  return (
    <div className={`step-editor step-${stepType}`}>
      <div className="step-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="step-info">
          <span className="step-number">{index + 1}</span>
          <span className="step-type">{stepType.toUpperCase()}</span>
          {stepType === 'run' && 'run' in step && (
            <span className="step-preview">{step.run || '(empty command)'}</span>
          )}
          {stepType === 'choose' && 'choose' in step && (
            <span className="step-preview">{step.choose.message || '(no message)'}</span>
          )}
          {stepType === 'prompt' && 'prompt' in step && (
            <span className="step-preview">{step.prompt.message || '(no message)'}</span>
          )}
          {stepType === 'parallel' && 'parallel' in step && (
            <span className="step-preview">{step.parallel.length} branches</span>
          )}
          {stepType === 'fail' && 'fail' in step && (
            <span className="step-preview">{step.fail.message || '(no message)'}</span>
          )}
        </div>
        <div className="step-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="remove-btn"
            title="Remove"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="step-content">
          {stepType === 'run' && 'run' in step && (
            <RunStepEditor step={step} onUpdate={onUpdate} />
          )}
          {stepType === 'choose' && 'choose' in step && (
            <ChooseStepEditor step={step} onUpdate={onUpdate} />
          )}
          {stepType === 'prompt' && 'prompt' in step && (
            <PromptStepEditor step={step} onUpdate={onUpdate} />
          )}
          {stepType === 'parallel' && 'parallel' in step && (
            <ParallelStepEditor step={step} onUpdate={onUpdate} />
          )}
          {stepType === 'fail' && 'fail' in step && (
            <FailStepEditor step={step} onUpdate={onUpdate} />
          )}
        </div>
      )}
    </div>
  );
}

function RunStepEditor({
  step,
  onUpdate,
}: {
  step: Extract<Step, { run: string }>;
  onUpdate: (step: Step) => void;
}) {
  const updateOnError = (changes: Partial<RunStepOnError>) => {
    const current: RunStepOnError = step.onError ?? { run: '' };
    const next: RunStepOnError = { ...current, ...changes };

    // If all fields are empty/undefined, remove onError
    if (!next.run && !next.timeout && !next.retry && !next.onError) {
      onUpdate({ ...step, onError: undefined });
      return;
    }

    onUpdate({ ...step, onError: next });
  };

  return (
    <div className="run-step-editor">
      <div className="form-group">
        <VariableHighlightInput
          label="Command"
          value={step.run}
          onChange={(value) => onUpdate({ ...step, run: value })}
          placeholder="echo 'Hello, World!' or echo 'Version: {{version}}'"
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Timeout (seconds, optional)</label>
          <input
            type="number"
            value={step.timeout || ''}
            onChange={(e) =>
              onUpdate({
                ...step,
                timeout: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            placeholder="60"
          />
        </div>
        <div className="form-group">
          <label>Retry (optional)</label>
          <input
            type="number"
            value={step.retry || ''}
            onChange={(e) =>
              onUpdate({
                ...step,
                retry: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            placeholder="0"
          />
        </div>
      </div>
      <div className="form-group">
        <label>Error Handling (onError, optional)</label>
        <input
          type="text"
          value={step.onError?.run || ''}
          onChange={(e) => updateOnError({ run: e.target.value || '' })}
          placeholder='Fallback command, e.g. pnpm lint:fix'
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>onError Timeout (seconds, optional)</label>
          <input
            type="number"
            value={step.onError?.timeout ?? ''}
            onChange={(e) =>
              updateOnError({
                timeout: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            placeholder="30"
          />
        </div>
        <div className="form-group">
          <label>onError Retry (optional)</label>
          <input
            type="number"
            value={step.onError?.retry ?? ''}
            onChange={(e) =>
              updateOnError({
                retry: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            placeholder="0"
          />
        </div>
      </div>
      <div className="form-group">
        <label
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            cursor: 'pointer',
            border: '1px solid #ccc',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <input
            style={{ display: 'inline-block', width: '16px', height: '16px' }}
            type="checkbox"
            checked={step.continue === true}
            onChange={(e) =>
              onUpdate({
                ...step,
                continue: e.target.checked ? true : undefined,
              })
            }
          />{' '}
          Always continue to next step
        </label>
        <div className="field-hint">
          When checked, the workflow always proceeds to the next step after this run (even if it fails). When unchecked, it uses the default behavior: continue on success, stop on failure.
        </div>
      </div>
    </div>
  );
}

function ChooseStepEditor({
  step,
  onUpdate,
}: {
  step: Extract<Step, { choose: any }>;
  onUpdate: (step: Step) => void;
}) {
  const updateOption = (index: number, field: 'id' | 'label', value: string) => {
    const newOptions = [...step.choose.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onUpdate({ ...step, choose: { ...step.choose, options: newOptions } });
  };

  const addOption = () => {
    onUpdate({
      ...step,
      choose: {
        ...step.choose,
        options: [...step.choose.options, { id: '', label: '' }],
      },
    });
  };

  const removeOption = (index: number) => {
    onUpdate({
      ...step,
      choose: {
        ...step.choose,
        options: step.choose.options.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="choose-step-editor">
      <div className="form-group">
        <label>Message</label>
        <input
          type="text"
          value={step.choose.message}
          onChange={(e) =>
            onUpdate({ ...step, choose: { ...step.choose, message: e.target.value } })
          }
          placeholder="Select an option:"
        />
      </div>
      <div className="form-group">
        <label>
          Variable Name (optional) <span className="variable-hint-inline">(Use in commands as {'{{variableName}}'})</span>
        </label>
        <input
          type="text"
          value={step.choose.as || ''}
          onChange={(e) =>
            onUpdate({ ...step, choose: { ...step.choose, as: e.target.value || undefined } })
          }
          placeholder="choice"
        />
      </div>
      <div className="form-group">
        <label>Options</label>
        {step.choose.options.map((option, index) => (
          <div key={index} className="option-row">
            <input
              type="text"
              value={option.id}
              onChange={(e) => updateOption(index, 'id', e.target.value)}
              placeholder="option-id"
            />
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(index, 'label', e.target.value)}
              placeholder="Option Label"
            />
            <button onClick={() => removeOption(index)}>Remove</button>
          </div>
        ))}
        <button onClick={addOption} className="add-option-btn">
          + Add Option
        </button>
      </div>
    </div>
  );
}

function PromptStepEditor({
  step,
  onUpdate,
}: {
  step: Extract<Step, { prompt: any }>;
  onUpdate: (step: Step) => void;
}) {
  return (
    <div className="prompt-step-editor">
      <div className="form-group">
        <label>Message</label>
        <input
          type="text"
          value={step.prompt.message}
          onChange={(e) =>
            onUpdate({ ...step, prompt: { ...step.prompt, message: e.target.value } })
          }
          placeholder="Enter value:"
        />
      </div>
      <div className="form-group">
        <label>
          Variable Name * <span className="variable-hint-inline">(Use in commands as {'{{variableName}}'})</span>
        </label>
        <input
          type="text"
          value={step.prompt.as}
          onChange={(e) =>
            onUpdate({ ...step, prompt: { ...step.prompt, as: e.target.value } })
          }
          placeholder="variableName"
          required
        />
      </div>
      <div className="form-group">
        <label>Default Value (optional)</label>
        <input
          type="text"
          value={step.prompt.default || ''}
          onChange={(e) =>
            onUpdate({
              ...step,
              prompt: { ...step.prompt, default: e.target.value || undefined },
            })
          }
          placeholder="default value"
        />
      </div>
    </div>
  );
}

function ParallelStepEditor({
  step,
  onUpdate,
}: {
  step: Extract<Step, { parallel: Step[] }>;
  onUpdate: (step: Step) => void;
}) {
  const addBranch = (type: 'run' | 'choose' | 'prompt' = 'run') => {
    let newStep: Step;
    switch (type) {
      case 'run':
        newStep = { run: '' };
        break;
      case 'choose':
        newStep = { choose: { message: '', options: [] } };
        break;
      case 'prompt':
        newStep = { prompt: { message: '', as: '' } };
        break;
      default:
        newStep = { run: '' };
    }
    onUpdate({
      ...step,
      parallel: [...step.parallel, newStep],
    });
  };

  const updateBranch = (index: number, branchStep: Step) => {
    const newParallel = [...step.parallel];
    newParallel[index] = branchStep;
    onUpdate({ ...step, parallel: newParallel });
  };

  const removeBranch = (index: number) => {
    onUpdate({
      ...step,
      parallel: step.parallel.filter((_, i) => i !== index),
    });
  };

  const changeBranchType = (index: number, newType: 'run' | 'choose' | 'prompt') => {
    let newStep: Step;
    switch (newType) {
      case 'run':
        newStep = { run: '' };
        break;
      case 'choose':
        newStep = { choose: { message: '', options: [] } };
        break;
      case 'prompt':
        newStep = { prompt: { message: '', as: '' } };
        break;
    }
    updateBranch(index, newStep);
  };

  const getBranchType = (branchStep: Step): 'run' | 'choose' | 'prompt' => {
    if ('run' in branchStep) return 'run';
    if ('choose' in branchStep) return 'choose';
    if ('prompt' in branchStep) return 'prompt';
    return 'run';
  };

  return (
    <div className="parallel-step-editor">
      <div className="branches-section">
        <div className="branches-header">
          <label>Parallel Branches</label>
          <div className="branch-type-buttons">
            <button onClick={() => addBranch('run')}>+ Run</button>
            <button onClick={() => addBranch('choose')}>+ Choose</button>
            <button onClick={() => addBranch('prompt')}>+ Prompt</button>
          </div>
        </div>
        {step.parallel.map((branchStep, index) => (
          <div key={index} className="branch-editor">
            <div className="branch-header">
              <div className="branch-header-left">
                <span>Branch {index + 1}</span>
                <select
                  value={getBranchType(branchStep)}
                  onChange={(e) => changeBranchType(index, e.target.value as 'run' | 'choose' | 'prompt')}
                  className="branch-type-select"
                >
                  <option value="run">Run</option>
                  <option value="choose">Choose</option>
                  <option value="prompt">Prompt</option>
                </select>
              </div>
              <button onClick={() => removeBranch(index)}>Remove</button>
            </div>
            <div className="branch-content">
              {'run' in branchStep && (
                <RunStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
              {'choose' in branchStep && (
                <ChooseStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
              {'prompt' in branchStep && (
                <PromptStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
            </div>
          </div>
        ))}
        {step.parallel.length === 0 && (
          <div className="empty-branches">
            <p>No branches yet. Add a branch to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FailStepEditor({
  step,
  onUpdate,
}: {
  step: Extract<Step, { fail: any }>;
  onUpdate: (step: Step) => void;
}) {
  return (
    <div className="fail-step-editor">
      <div className="form-group">
        <label>Error Message</label>
        <input
          type="text"
          value={step.fail.message}
          onChange={(e) =>
            onUpdate({ ...step, fail: { ...step.fail, message: e.target.value } })
          }
          placeholder="Workflow failed"
        />
      </div>
    </div>
  );
}

