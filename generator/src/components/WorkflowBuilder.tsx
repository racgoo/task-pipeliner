import { useState, useEffect, useRef } from 'react';
import type { Workflow, Step, Profile } from '../types/workflow';
import { generateYAML, generateJSON, downloadYAML, downloadJSON, parseYAML, parseJSON } from '../utils/generator';
import StepEditor from './StepEditor';
import { DagView, type NodePositions } from './DagView';
import './WorkflowBuilder.css';

export default function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: '',
    baseDir: '',
    shell: undefined,
    profiles: undefined,
    steps: [],
  });
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'dag'>('list');
  const [dagExpanded, setDagExpanded] = useState(false);
  const [dagNodePositions, setDagNodePositions] = useState<NodePositions>({});
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const dagEditorDrawerRef = useRef<HTMLDivElement>(null);
  const dagSectionRef = useRef<HTMLDivElement>(null);
  const stepsListRef = useRef<HTMLDivElement>(null);
  const [centerDagOnFirst, setCenterDagOnFirst] = useState(false);
  const [shellInput, setShellInput] = useState('');
  const [outputFormat, setOutputFormat] = useState<'yaml' | 'json'>('yaml');
  const [preview, setPreview] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [syncToCodeError, setSyncToCodeError] = useState<string | null>(null);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const collapseAllSteps = () => setExpandedSteps(new Set());
  const expandAllSteps = () =>
    setExpandedSteps(new Set(workflow.steps.map((_, i) => i)));

  const updateWorkflow = (updates: Partial<Workflow>) => {
    setWorkflow((prev) => ({ ...prev, ...updates }));
  };

  const addStep = (step: Step) => {
    const newIndex = workflow.steps.length;
    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, step],
    }));
    setExpandedSteps((prev) => new Set([...prev, newIndex]));
  };

  const insertStep = (atIndex: number, step: Step) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: [
        ...prev.steps.slice(0, atIndex),
        step,
        ...prev.steps.slice(atIndex),
      ],
    }));
    setExpandedSteps((prev) => new Set([...prev, atIndex]));
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
    setExpandedSteps((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
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

  const handleDragStart = (index: number) => {
    setDraggedStepIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedStepIndex !== null && draggedStepIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedStepIndex === null || draggedStepIndex === dropIndex) {
      setDraggedStepIndex(null);
      return;
    }

    const newSteps = [...workflow.steps];
    const [draggedStep] = newSteps.splice(draggedStepIndex, 1);
    newSteps.splice(dropIndex, 0, draggedStep);

    setWorkflow((prev) => ({
      ...prev,
      steps: newSteps,
    }));

    // Update expanded steps indices
    setExpandedSteps((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i === draggedStepIndex) {
          next.add(dropIndex);
        } else if (draggedStepIndex < dropIndex) {
          // Moved down
          if (i > draggedStepIndex && i <= dropIndex) {
            next.add(i - 1);
          } else {
            next.add(i);
          }
        } else {
          // Moved up
          if (i >= dropIndex && i < draggedStepIndex) {
            next.add(i + 1);
          } else {
            next.add(i);
          }
        }
      });
      return next;
    });

    setDraggedStepIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedStepIndex(null);
    setDragOverIndex(null);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'list' | 'dag') => {
    setViewMode(mode);
    
    if (mode === 'dag') {
      // Scroll to DAG section first, then center on first node
      setTimeout(() => {
        if (dagSectionRef.current) {
          dagSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      // Center on first node in DAG mode
      setTimeout(() => {
        setCenterDagOnFirst(true);
        setTimeout(() => setCenterDagOnFirst(false), 500);
      }, 200);
    } else if (mode === 'list') {
      // Scroll to first step in list mode
      setTimeout(() => {
        if (stepsListRef.current && workflow.steps.length > 0) {
          const firstStep = stepsListRef.current.querySelector('.step-drag-wrapper');
          if (firstStep) {
            firstStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    }
  };

  const getCleanProfiles = (): Profile[] | undefined => {
    if (!workflow.profiles?.length) return undefined;
    return workflow.profiles
      .map((p) => ({
        name: p.name,
        var: Object.fromEntries(Object.entries(p.var).filter(([k]) => k.trim() !== '')),
      }))
      .filter((p) => p.name.trim() !== '');
  };

  const generatePreview = () => {
    setSyncToCodeError(null);
    try {
      const profiles = getCleanProfiles();
      const cleanWorkflow: Workflow = {
        ...workflow,
        name: workflow.name || undefined,
        baseDir: workflow.baseDir || undefined,
        shell: workflow.shell && workflow.shell.length > 0 ? workflow.shell : undefined,
        profiles: profiles && profiles.length > 0 ? profiles : undefined,
      };
      setPreview(outputFormat === 'yaml' ? generateYAML(cleanWorkflow) : generateJSON(cleanWorkflow));
      setPreviewError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncToCodeError(`→ Code failed: ${message}`);
    }
  };

  const handlePreviewChange = (value: string) => {
    setPreview(value);
    setPreviewError(null);
  };

  const loadFromPreview = () => {
    setPreviewError(null);
    try {
      const parsed = outputFormat === 'yaml' ? parseYAML(preview) : parseJSON(preview);
      setWorkflow({
        name: parsed.name || '',
        baseDir: parsed.baseDir || '',
        shell: parsed.shell || undefined,
        profiles: parsed.profiles || undefined,
        steps: parsed.steps || [],
      });
      setShellInput(parsed.shell?.join(' ') ?? '');
      setExpandedSteps(new Set()); // collapse all after load so user can open what they need
      setSyncToCodeError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPreviewError(`← Visual failed: ${message}`);
    }
  };

  // Auto-generate preview when output format changes (if preview exists)
  useEffect(() => {
    if (preview && !previewError) {
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputFormat]);

  // DAG mode: scroll editor drawer into view when a step is selected
  useEffect(() => {
    if (viewMode !== 'dag' || selectedStepIndex == null) return;
    dagEditorDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [viewMode, selectedStepIndex]);

  // DAG expanded overlay: Escape to close
  useEffect(() => {
    if (!dagExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDagExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dagExpanded]);

  // DAG view: Delete key functionality disabled - steps should not be deleted via keyboard

  const handleDownload = () => {
    const profiles = getCleanProfiles();
    const cleanWorkflow: Workflow = {
      ...workflow,
      name: workflow.name || undefined,
      baseDir: workflow.baseDir || undefined,
      shell: workflow.shell && workflow.shell.length > 0 ? workflow.shell : undefined,
      profiles: profiles && profiles.length > 0 ? profiles : undefined,
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
          {syncToCodeError && (
            <div className="sync-error sync-error--to-code" role="alert">
              <strong>Error:</strong> {syncToCodeError}
            </div>
          )}
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
                value={shellInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setShellInput(value);
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

            <div className="form-group profiles-section">
              <label>Profiles (optional)</label>
              <p className="field-hint" style={{ marginBottom: 8 }}>
                Pre-set variables for <code>tp run --profile &lt;name&gt;</code>. Choose/prompt steps for these variables are skipped.
              </p>
              {(workflow.profiles ?? []).map((profile, pIndex) => (
                <div key={pIndex} className="profile-block">
                  <div className="profile-header">
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => {
                        const next = [...(workflow.profiles ?? [])];
                        next[pIndex] = { ...profile, name: e.target.value };
                        updateWorkflow({ profiles: next });
                      }}
                      placeholder="Profile name (e.g. Test)"
                      className="profile-name-input"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (workflow.profiles ?? []).filter((_, i) => i !== pIndex);
                        updateWorkflow({ profiles: next.length > 0 ? next : undefined });
                      }}
                      className="remove-profile-btn"
                      title="Remove profile"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="profile-vars">
                    {Object.entries(profile.var).map(([k, v], vIndex) => (
                      <div key={vIndex} className="profile-var-row">
                        <input
                          type="text"
                          value={k}
                          onChange={(e) => {
                            const next = [...(workflow.profiles ?? [])];
                            const newVar = { ...profile.var };
                            delete newVar[k];
                            newVar[e.target.value] = v;
                            next[pIndex] = { ...profile, var: newVar };
                            updateWorkflow({ profiles: next });
                          }}
                          placeholder="Variable name"
                          className="profile-var-key"
                        />
                        <input
                          type="text"
                          value={v}
                          onChange={(e) => {
                            const next = [...(workflow.profiles ?? [])];
                            const newVar = { ...profile.var, [k]: e.target.value };
                            next[pIndex] = { ...profile, var: newVar };
                            updateWorkflow({ profiles: next });
                          }}
                          placeholder="Value"
                          className="profile-var-value"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...(workflow.profiles ?? [])];
                            const newVar = { ...profile.var };
                            delete newVar[k];
                            next[pIndex] = { ...profile, var: newVar };
                            updateWorkflow({ profiles: next });
                          }}
                          title="Remove variable"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(workflow.profiles ?? [])];
                        const newVar = { ...profile.var, '': '' };
                        next[pIndex] = { ...profile, var: newVar };
                        updateWorkflow({ profiles: next });
                      }}
                      className="add-var-btn"
                    >
                      + Add variable
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next = [...(workflow.profiles ?? []), { name: '', var: {} }];
                  updateWorkflow({ profiles: next });
                }}
                className="add-profile-btn"
              >
                + Add profile
              </button>
            </div>
          </div>

          <div className="steps-section">
            <div className="section-header">
              <h3 className="section-title">Steps</h3>
              <div className="section-header-actions">
                <div className="view-mode-toggle-wrap">
                  <div className="view-mode-toggle" role="tablist" aria-label="Steps view mode">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'list'}
                      className={viewMode === 'list' ? 'view-mode-btn view-mode-btn--active' : 'view-mode-btn'}
                      onClick={() => handleViewModeChange('list')}
                    >
                      List
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'dag'}
                      className={viewMode === 'dag' ? 'view-mode-btn view-mode-btn--active' : 'view-mode-btn'}
                      onClick={() => handleViewModeChange('dag')}
                    >
                      DAG
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={collapseAllSteps}
                  className="collapse-all-btn"
                  title="Collapse all step blocks"
                >
                  <span className="btn-icon">−</span>
                  Collapse all
                </button>
                <button
                  type="button"
                  onClick={expandAllSteps}
                  className="expand-all-btn"
                  title="Expand all step blocks"
                >
                  <span className="btn-icon">+</span>
                  Expand all
                </button>
                <button 
                  onClick={generatePreview} 
                  className="sync-button sync-to-code" 
                  title="Convert the current workflow from the visual editor to YAML or JSON code and display it in the code editor on the right. Use this when you want to export changes made in the visual editor as code."
                >
                  <span className="button-icon">→</span>
                  <span className="button-text">→ Code</span>
                </button>
              </div>
            </div>
            <div className="step-type-buttons">
              <button
                onClick={() => {
                  if (viewMode === 'dag' && selectedStepIndex != null) {
                    insertStep(selectedStepIndex + 1, { run: '' });
                    setSelectedStepIndex(selectedStepIndex + 1);
                  } else {
                    addStep({ run: '' });
                    if (viewMode === 'dag') setSelectedStepIndex(workflow.steps.length);
                  }
                }}
              >
                + Run
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'dag' && selectedStepIndex != null) {
                    insertStep(selectedStepIndex + 1, { choose: { message: '', options: [] } });
                    setSelectedStepIndex(selectedStepIndex + 1);
                  } else {
                    addStep({ choose: { message: '', options: [] } });
                    if (viewMode === 'dag') setSelectedStepIndex(workflow.steps.length);
                  }
                }}
              >
                + Choose
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'dag' && selectedStepIndex != null) {
                    insertStep(selectedStepIndex + 1, { prompt: { message: '', as: '' } });
                    setSelectedStepIndex(selectedStepIndex + 1);
                  } else {
                    addStep({ prompt: { message: '', as: '' } });
                    if (viewMode === 'dag') setSelectedStepIndex(workflow.steps.length);
                  }
                }}
              >
                + Prompt
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'dag' && selectedStepIndex != null) {
                    insertStep(selectedStepIndex + 1, { parallel: [] });
                    setSelectedStepIndex(selectedStepIndex + 1);
                  } else {
                    addStep({ parallel: [] });
                    if (viewMode === 'dag') setSelectedStepIndex(workflow.steps.length);
                  }
                }}
              >
                + Parallel
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'dag' && selectedStepIndex != null) {
                    insertStep(selectedStepIndex + 1, { fail: { message: '' } });
                    setSelectedStepIndex(selectedStepIndex + 1);
                  } else {
                    addStep({ fail: { message: '' } });
                    if (viewMode === 'dag') setSelectedStepIndex(workflow.steps.length);
                  }
                }}
              >
                + Fail
              </button>
            </div>

            {viewMode === 'list' && (
              <div className="steps-list" ref={stepsListRef}>
                {workflow.steps.map((step, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`step-drag-wrapper ${draggedStepIndex === index ? 'step-drag-wrapper--dragging' : ''} ${dragOverIndex === index ? 'step-drag-wrapper--drag-over' : ''}`}
                  >
                    <StepEditor
                      step={step}
                      index={index}
                      onUpdate={(updatedStep) => updateStep(index, updatedStep)}
                      onRemove={() => removeStep(index)}
                      onMoveUp={() => moveStep(index, 'up')}
                      onMoveDown={() => moveStep(index, 'down')}
                      canMoveUp={index > 0}
                      canMoveDown={index < workflow.steps.length - 1}
                      isExpanded={expandedSteps.has(index)}
                      onToggle={() => toggleStep(index)}
                    />
                  </div>
                ))}
                {workflow.steps.length === 0 && (
                  <div className="empty-state">
                    <p>No steps yet. Add a step to get started!</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'dag' && (
              <div className="dag-section" ref={dagSectionRef}>
                <div className="dag-section-toolbar">
                  <button
                    type="button"
                    className="dag-expand-btn"
                    onClick={() => setDagExpanded(true)}
                    title="Expand DAG view"
                  >
                    Expand DAG
                  </button>
                </div>
                <p className="dag-ux-hint">
                  Drag nodes to rearrange the layout. Step order can be changed in List view or with ↑↓ in the editor below.
                </p>
                <DagView
                  steps={workflow.steps}
                  selectedStepIndex={selectedStepIndex}
                  onSelectStep={setSelectedStepIndex}
                  customPositions={dagNodePositions}
                  onPositionsChange={(positions) => {
                    const ids = new Set(workflow.steps.map((_, i) => String(i)));
                    const filtered: NodePositions = {};
                    for (const [id, pos] of Object.entries(positions)) {
                      if (ids.has(id)) filtered[id] = pos;
                    }
                    setDagNodePositions(filtered);
                  }}
                  centerOnFirstNode={centerDagOnFirst}
                />
                {selectedStepIndex != null && workflow.steps[selectedStepIndex] != null && (
                  <div className="dag-editor-drawer" ref={dagEditorDrawerRef}>
                    <div className="dag-editor-drawer__title">
                      Edit step {selectedStepIndex + 1}
                    </div>
                    <StepEditor
                      step={workflow.steps[selectedStepIndex]}
                      index={selectedStepIndex}
                      onUpdate={(updatedStep) => updateStep(selectedStepIndex, updatedStep)}
                      onRemove={() => {
                        removeStep(selectedStepIndex);
                        setSelectedStepIndex(null);
                      }}
                      onMoveUp={() => moveStep(selectedStepIndex, 'up')}
                      onMoveDown={() => moveStep(selectedStepIndex, 'down')}
                      canMoveUp={selectedStepIndex > 0}
                      canMoveDown={selectedStepIndex < workflow.steps.length - 1}
                      isExpanded={true}
                      onToggle={() => {}}
                    />
                  </div>
                )}
              </div>
            )}

            {viewMode === 'dag' && dagExpanded && (
              <div
                className="dag-expanded-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="Expand DAG view"
              >
                <div
                  className="dag-expanded-backdrop"
                  onClick={() => setDagExpanded(false)}
                />
                <div className="dag-expanded-content">
                  <div className="dag-expanded-header">
                    <span className="dag-expanded-title">DAG View</span>
                    <button
                      type="button"
                      className="dag-expanded-close"
                      onClick={() => setDagExpanded(false)}
                      title="Close"
                      aria-label="Close"
                    >
                      Close
                    </button>
                  </div>
                  <div className="dag-expanded-body">
                    <p className="dag-ux-hint dag-ux-hint--overlay">
                      Drag nodes to rearrange. Step order: List view or ↑↓ in the editor below.
                    </p>
                    <DagView
                      steps={workflow.steps}
                      selectedStepIndex={selectedStepIndex}
                      onSelectStep={setSelectedStepIndex}
                      fillContainer
                      customPositions={dagNodePositions}
                      onPositionsChange={(positions) => {
                        const ids = new Set(workflow.steps.map((_, i) => String(i)));
                        const filtered: NodePositions = {};
                        for (const [id, pos] of Object.entries(positions)) {
                          if (ids.has(id)) filtered[id] = pos;
                        }
                        setDagNodePositions(filtered);
                      }}
                      centerOnFirstNode={centerDagOnFirst}
                    />
                  </div>
                  {selectedStepIndex != null && workflow.steps[selectedStepIndex] != null && (
                    <div className="dag-expanded-drawer">
                      <div className="dag-editor-drawer__title">
                        <span>Edit step {selectedStepIndex + 1}</span>
                        <button
                          type="button"
                          className="dag-editor-drawer__close"
                          onClick={() => setSelectedStepIndex(null)}
                          title="Close editor"
                          aria-label="Close editor"
                        >
                          ×
                        </button>
                      </div>
                      <StepEditor
                        step={workflow.steps[selectedStepIndex]}
                        index={selectedStepIndex}
                        onUpdate={(updatedStep) => updateStep(selectedStepIndex, updatedStep)}
                        onRemove={() => {
                          removeStep(selectedStepIndex);
                          setSelectedStepIndex(null);
                        }}
                        onMoveUp={() => moveStep(selectedStepIndex, 'up')}
                        onMoveDown={() => moveStep(selectedStepIndex, 'down')}
                        canMoveUp={selectedStepIndex > 0}
                        canMoveDown={selectedStepIndex < workflow.steps.length - 1}
                        isExpanded={true}
                        onToggle={() => {}}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
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
            <div className="preview-error sync-error" role="alert">
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
            <strong>⚠️ YAML Syntax:</strong> If command contains quotes and colons before variables, wrap entire command in single quotes: <code>{'\'echo "mode: {{var}}" \''}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

