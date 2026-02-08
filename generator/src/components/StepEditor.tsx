import { useState, useRef, useEffect } from 'react';
import type { Step, RunStepOnError, Capture } from '../types/workflow';
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
  /** When provided, expand/collapse is controlled by parent (e.g. for "Collapse all") */
  isExpanded?: boolean;
  onToggle?: () => void;
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
  isExpanded: controlledExpanded,
  onToggle,
}: StepEditorProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isControlled = controlledExpanded !== undefined && onToggle !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  const handleToggle = isControlled ? onToggle! : () => setInternalExpanded((v) => !v);

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
      <div className="step-header" onClick={() => handleToggle()}>
        <div className="step-info">
          <span className="step-chevron" aria-hidden>{isExpanded ? '▼' : '▶'}</span>
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
  const [shellInput, setShellInput] = useState(step.shell?.join(' ') ?? '');
  const lastShellFromInputRef = useRef(step.shell?.join(' ') ?? '');

  useEffect(() => {
    const fromStep = step.shell?.join(' ') ?? '';
    if (fromStep !== lastShellFromInputRef.current) {
      setShellInput(fromStep);
      lastShellFromInputRef.current = fromStep;
    }
  }, [step.shell]);

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
        <label>Shell (optional)</label>
        <input
          type="text"
          value={shellInput}
          onChange={(e) => {
            const value = e.target.value;
            setShellInput(value);
            const trimmed = value.trim();
            lastShellFromInputRef.current = trimmed;
            if (trimmed) {
              const shellArray = trimmed.split(/\s+/).filter((s) => s !== '');
              onUpdate({
                ...step,
                shell: shellArray.length > 0 ? shellArray : undefined,
              });
            } else {
              onUpdate({
                ...step,
                shell: undefined,
              });
            }
          }}
          placeholder="bash -lc"
        />
        <div className="field-hint">
          Shell for this step (space-separated). Overrides workflow shell. If omitted, uses workflow shell or your current shell. Example: <code>zsh -c</code>
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
      <CapturesEditor
        captures={step.captures || []}
        onChange={(captures) =>
          onUpdate({
            ...step,
            captures: captures.length > 0 ? captures : undefined,
          })
        }
      />
    </div>
  );
}

function CapturesEditor({
  captures,
  onChange,
}: {
  captures: Capture[];
  onChange: (captures: Capture[]) => void;
}) {
  const addCapture = (type: string) => {
    let newCapture: Capture;
    switch (type) {
      case 'full':
        newCapture = { as: '' };
        break;
      case 'regex':
        newCapture = { regex: '', as: '' };
        break;
      case 'json':
        newCapture = { json: '', as: '' };
        break;
      case 'yaml':
        newCapture = { yaml: '', as: '' };
        break;
      case 'yml':
        newCapture = { yml: '', as: '' };
        break;
      case 'kv':
        newCapture = { kv: '', as: '' };
        break;
      case 'after':
        newCapture = { after: '', as: '' };
        break;
      case 'before':
        newCapture = { before: '', as: '' };
        break;
      case 'between':
        newCapture = { after: '', before: '', as: '' };
        break;
      case 'line':
        newCapture = { line: { from: 1, to: 1 }, as: '' };
        break;
      default:
        return;
    }
    onChange([...captures, newCapture]);
  };

  const updateCapture = (index: number, updates: Partial<Capture>) => {
    const updated = [...captures];
    updated[index] = { ...updated[index], ...updates } as Capture;
    onChange(updated);
  };

  const removeCapture = (index: number) => {
    onChange(captures.filter((_, i) => i !== index));
  };

  const getCaptureType = (capture: Capture): string => {
    if ('regex' in capture) return 'regex';
    if ('json' in capture) return 'json';
    if ('yaml' in capture) return 'yaml';
    if ('yml' in capture) return 'yml';
    if ('kv' in capture) return 'kv';
    if ('after' in capture && 'before' in capture) return 'between';
    if ('after' in capture) return 'after';
    if ('before' in capture) return 'before';
    if ('line' in capture) return 'line';
    return 'full';
  };

  return (
    <div className="form-group">
      <label>Captures (optional)</label>
      <div className="field-hint">
        Extract values from stdout and store them as variables for use in subsequent steps.
      </div>
      {captures.map((capture, index) => {
        const type = getCaptureType(capture);
        return (
          <div key={index} className="capture-item" style={{ marginBottom: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong>{type.charAt(0).toUpperCase() + type.slice(1)} Capture</strong>
              <button onClick={() => removeCapture(index)} style={{ padding: '4px 8px' }}>
                Remove
              </button>
            </div>
            {type === 'full' && (
              <div className="form-group">
                <label>Variable Name</label>
                <input
                  type="text"
                  value={capture.as || ''}
                  onChange={(e) => updateCapture(index, { as: e.target.value })}
                  placeholder="variable_name"
                />
              </div>
            )}
            {type === 'regex' && 'regex' in capture && (
              <>
                <div className="form-group">
                  <label>Regex Pattern</label>
                  <input
                    type="text"
                    value={capture.regex || ''}
                    onChange={(e) => updateCapture(index, { regex: e.target.value })}
                    placeholder='channel=(\\S+)'
                  />
                  <div className="field-hint">First capture group will be extracted</div>
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="channel"
                  />
                </div>
              </>
            )}
            {(type === 'json' || type === 'yaml' || type === 'yml') && (
              <>
                <div className="form-group">
                  <label>JSONPath Expression</label>
                  <input
                    type="text"
                    value={
                      type === 'json' && 'json' in capture
                        ? capture.json
                        : type === 'yaml' && 'yaml' in capture
                          ? capture.yaml
                          : type === 'yml' && 'yml' in capture
                            ? capture.yml
                            : ''
                    }
                    onChange={(e) => {
                      if (type === 'json') {
                        updateCapture(index, { json: e.target.value });
                      } else if (type === 'yaml') {
                        updateCapture(index, { yaml: e.target.value });
                      } else {
                        updateCapture(index, { yml: e.target.value });
                      }
                    }}
                    placeholder="$.meta.version"
                  />
                  <div className="field-hint">JSONPath expression to extract value</div>
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="version"
                  />
                </div>
              </>
            )}
            {type === 'kv' && 'kv' in capture && (
              <>
                <div className="form-group">
                  <label>Key</label>
                  <input
                    type="text"
                    value={capture.kv || ''}
                    onChange={(e) => updateCapture(index, { kv: e.target.value })}
                    placeholder="DATABASE_URL"
                  />
                  <div className="field-hint">Key name from .env style key=value pairs</div>
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="db_url"
                  />
                </div>
              </>
            )}
            {type === 'after' && 'after' in capture && !('before' in capture) && (
              <>
                <div className="form-group">
                  <label>After Marker</label>
                  <input
                    type="text"
                    value={capture.after || ''}
                    onChange={(e) => updateCapture(index, { after: e.target.value })}
                    placeholder="user="
                  />
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="user_value"
                  />
                </div>
              </>
            )}
            {type === 'before' && 'before' in capture && (
              <>
                <div className="form-group">
                  <label>Before Marker</label>
                  <input
                    type="text"
                    value={capture.before || ''}
                    onChange={(e) => updateCapture(index, { before: e.target.value })}
                    placeholder="end marker"
                  />
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="before_content"
                  />
                </div>
              </>
            )}
            {type === 'between' && 'after' in capture && 'before' in capture && (
              <>
                <div className="form-group">
                  <label>After Marker</label>
                  <input
                    type="text"
                    value={capture.after || ''}
                    onChange={(e) => updateCapture(index, { after: e.target.value })}
                    placeholder="start:"
                  />
                </div>
                <div className="form-group">
                  <label>Before Marker</label>
                  <input
                    type="text"
                    value={capture.before || ''}
                    onChange={(e) => updateCapture(index, { before: e.target.value })}
                    placeholder=" end"
                  />
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="between_content"
                  />
                </div>
              </>
            )}
            {type === 'line' && 'line' in capture && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>From Line (1-based)</label>
                    <input
                      type="number"
                      value={capture.line?.from || 1}
                      onChange={(e) =>
                        updateCapture(index, {
                          line: {
                            from: parseInt(e.target.value, 10) || 1,
                            to: capture.line?.to || 1,
                          },
                        })
                      }
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>To Line (1-based, inclusive)</label>
                    <input
                      type="number"
                      value={capture.line?.to || 1}
                      onChange={(e) =>
                        updateCapture(index, {
                          line: {
                            from: capture.line?.from || 1,
                            to: parseInt(e.target.value, 10) || 1,
                          },
                        })
                      }
                      min="1"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Variable Name</label>
                  <input
                    type="text"
                    value={capture.as || ''}
                    onChange={(e) => updateCapture(index, { as: e.target.value })}
                    placeholder="line_block"
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: '8px' }}>
        <select
          onChange={(e) => {
            if (e.target.value) {
              addCapture(e.target.value);
              e.target.value = '';
            }
          }}
          style={{ marginRight: '8px', padding: '4px' }}
        >
          <option value="">Add Capture...</option>
          <option value="full">Full Capture</option>
          <option value="regex">Regex Capture</option>
          <option value="json">JSON Capture</option>
          <option value="yaml">YAML Capture</option>
          <option value="yml">YML Capture</option>
          <option value="kv">KV Capture</option>
          <option value="after">After Capture</option>
          <option value="before">Before Capture</option>
          <option value="between">Between Capture</option>
          <option value="line">Line Capture</option>
        </select>
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

/** Step types allowed inside parallel (only run and fail are allowed, nested parallel is not allowed) */
type ParallelBranchType = 'run' | 'fail';

function ParallelStepEditor({
  step,
  onUpdate,
}: {
  step: Extract<Step, { parallel: Step[] }>;
  onUpdate: (step: Step) => void;
}) {
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(
    new Set(step.parallel.map((_, i) => i))
  );

  const toggleBranch = (index: number) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const addBranch = (type: ParallelBranchType = 'run') => {
    let newStep: Step;
    switch (type) {
      case 'run':
        newStep = { run: '' };
        break;
      case 'fail':
        newStep = { fail: { message: '' } };
        break;
      default:
        newStep = { run: '' };
    }
    const newIndex = step.parallel.length;
    onUpdate({
      ...step,
      parallel: [...step.parallel, newStep],
    });
    // Expand the newly added branch
    setExpandedBranches((prev) => new Set([...prev, newIndex]));
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
    // Update expanded branches after removal
    setExpandedBranches((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) {
          next.add(i);
        } else if (i > index) {
          next.add(i - 1);
        }
      });
      return next;
    });
  };

  const changeBranchType = (index: number, newType: ParallelBranchType) => {
    let newStep: Step;
    switch (newType) {
      case 'run':
        newStep = { run: '' };
        break;
      case 'fail':
        newStep = { fail: { message: '' } };
        break;
      default:
        newStep = { run: '' };
    }
    updateBranch(index, newStep);
  };

  const getBranchType = (branchStep: Step): ParallelBranchType | null => {
    if ('run' in branchStep) return 'run';
    if ('fail' in branchStep) return 'fail';
    // parallel, choose, prompt are not allowed inside parallel
    return null;
  };

  const isInvalidBranch = (branchStep: Step) => 
    'choose' in branchStep || 'prompt' in branchStep || 'parallel' in branchStep;

  return (
    <div className="parallel-step-editor">
      <div className="branches-section">
        <div className="branches-header">
            <div className="branches-header-row">
            <label>Parallel Branches</label>
            <div className="branch-type-buttons">
              <button onClick={() => addBranch('run')}>+ Run</button>
              <button onClick={() => addBranch('fail')}>+ Fail</button>
            </div>
          </div>
          <p className="parallel-restriction-hint">
            Only Run and Fail are allowed inside parallel. Choose, Prompt, and nested Parallel are not allowed.
          </p>
        </div>
        {step.parallel.map((branchStep, index) => {
          const isExpanded = expandedBranches.has(index);
          return (
            <div key={index} className="branch-editor">
              <div 
                className="branch-header" 
                onClick={(e) => {
                  // Don't toggle if clicking on select or button
                  if ((e.target as HTMLElement).closest('.branch-type-select, button')) {
                    return;
                  }
                  toggleBranch(index);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="branch-header-left">
                  <span className="branch-chevron">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span>Branch {index + 1}</span>
                  <select
                    value={getBranchType(branchStep) || 'run'}
                    onChange={(e) => {
                      e.stopPropagation();
                      changeBranchType(index, e.target.value as ParallelBranchType);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="branch-type-select"
                  >
                    <option value="run">Run</option>
                    <option value="fail">Fail</option>
                  </select>
                  {isInvalidBranch(branchStep) && (
                    <span className="branch-invalid-hint" title="Choose, Prompt, and nested Parallel are not allowed inside parallel">
                      (invalid)
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBranch(index);
                  }}
                >
                  Remove
                </button>
              </div>
              {isExpanded && (
                <div className="branch-content">
              {isInvalidBranch(branchStep) && (
                <div className="branch-invalid-banner">
                  Choose, Prompt, and nested Parallel are not allowed inside parallel. Change type to Run or Fail above.
                </div>
              )}
              {'run' in branchStep && (
                <RunStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
              {'choose' in branchStep && (
                <ChooseStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
              {'prompt' in branchStep && (
                <PromptStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
              {'parallel' in branchStep && (
                <div className="branch-invalid-banner">
                  Nested parallel is not allowed. Please change this branch type to Run or Fail.
                </div>
              )}
              {'fail' in branchStep && (
                <FailStepEditor step={branchStep} onUpdate={(s) => updateBranch(index, s)} />
              )}
                </div>
              )}
            </div>
          );
        })}
        {step.parallel.length === 0 && (
          <div className="empty-branches">
            <p>No branches yet. Add a Run or Fail branch to get started.</p>
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

