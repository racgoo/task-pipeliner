import { useState, useEffect } from 'react';
import type { ScheduleDefinition, ScheduleFile } from '../types/schedule';
import {
  generateScheduleYAML,
  generateScheduleJSON,
  parseScheduleYAML,
  parseScheduleJSON,
  downloadScheduleYAML,
  downloadScheduleJSON,
} from '../utils/generator';
import CronBuilder from './CronBuilder';
import './ScheduleBuilder.css';

const DEFAULT_SCHEDULE: ScheduleDefinition = {
  name: '',
  cron: '0 9 * * *',
  workflow: '',
};

export default function ScheduleBuilder() {
  const [schedules, setSchedules] = useState<ScheduleDefinition[]>([{ ...DEFAULT_SCHEDULE }]);
  const [outputFormat, setOutputFormat] = useState<'yaml' | 'json'>('yaml');
  const [preview, setPreview] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);

  const getCleanSchedules = (): ScheduleDefinition[] => {
    return schedules
      .filter((s) => s.name.trim() !== '' && s.workflow.trim() !== '' && s.cron.trim() !== '')
      .map((s) => ({
        name: s.name.trim(),
        cron: s.cron.trim(),
        workflow: s.workflow.trim(),
        ...(s.baseDir?.trim() ? { baseDir: s.baseDir.trim() } : {}),
        ...(s.silent ? { silent: true } : {}),
        ...(s.profile?.trim() ? { profile: s.profile.trim() } : {}),
      }));
  };

  const generatePreview = () => {
    const clean = getCleanSchedules();
    if (clean.length === 0) {
      setPreview('');
      setPreviewError(null);
      return;
    }
    const file: ScheduleFile = { schedules: clean };
    setPreview(
      outputFormat === 'yaml' ? generateScheduleYAML(file) : generateScheduleJSON(file)
    );
    setPreviewError(null);
  };

  const handlePreviewChange = (value: string) => {
    setPreview(value);
    setPreviewError(null);
  };

  const loadFromPreview = () => {
    try {
      const file =
        outputFormat === 'yaml' ? parseScheduleYAML(preview) : parseScheduleJSON(preview);
      setSchedules(
        file.schedules.length > 0
          ? file.schedules.map((s) => ({
              name: s.name,
              cron: s.cron,
              workflow: s.workflow,
              baseDir: s.baseDir ?? '',
              silent: s.silent ?? false,
              profile: s.profile ?? '',
            }))
          : [{ ...DEFAULT_SCHEDULE }]
      );
      setPreviewError(null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to parse');
    }
  };

  useEffect(() => {
    if (preview && !previewError) {
      const clean = getCleanSchedules();
      if (clean.length > 0) {
        const file: ScheduleFile = { schedules: clean };
        setPreview(
          outputFormat === 'yaml' ? generateScheduleYAML(file) : generateScheduleJSON(file)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputFormat]);

  const addSchedule = () => {
    setSchedules((prev) => [...prev, { ...DEFAULT_SCHEDULE }]);
  };

  const updateSchedule = (index: number, updates: Partial<ScheduleDefinition>) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const removeSchedule = (index: number) => {
    setSchedules((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleDownload = () => {
    const clean = getCleanSchedules();
    if (clean.length === 0) return;
    const file: ScheduleFile = { schedules: clean };
    if (outputFormat === 'yaml') {
      downloadScheduleYAML(file);
    } else {
      downloadScheduleJSON(file);
    }
  };

  return (
    <div className="schedule-builder workflow-builder">
      <div className="builder-header">
        <h1>Task Pipeliner Schedule Generator</h1>
        <p>Create schedule files (YAML/JSON) for tp schedule add</p>
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
          <div className="schedule-config">
            <div className="section-header">
              <h3 className="section-title">Schedules</h3>
              <button
                type="button"
                onClick={generatePreview}
                className="sync-button sync-to-code"
                title="Generate code from visual editor and show in code editor"
              >
                <span className="button-icon">→</span>
                <span className="button-text">→ Code</span>
              </button>
            </div>
            <p className="field-hint" style={{ marginBottom: 12 }}>
              Add one or more schedules. Use <code>tp schedule add &lt;file&gt;</code> to register
              them.
            </p>

            <div className="schedules-list">
              {schedules.map((schedule, index) => (
                <div key={index} className="schedule-block">
                  <div className="schedule-block-header">
                    <span className="schedule-block-title">Schedule {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSchedule(index)}
                      className="remove-schedule-btn"
                      title="Remove schedule"
                      disabled={schedules.length === 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="schedule-fields">
                    <div className="form-group">
                      <label>Name (alias)</label>
                      <input
                        type="text"
                        value={schedule.name}
                        onChange={(e) => updateSchedule(index, { name: e.target.value })}
                        placeholder="e.g. Daily Build"
                      />
                    </div>

                    <div className="form-group">
                      <label>Cron expression</label>
                      <CronBuilder
                        value={schedule.cron}
                        onChange={(cron) => updateSchedule(index, { cron })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Workflow path</label>
                      <input
                        type="text"
                        value={schedule.workflow}
                        onChange={(e) => updateSchedule(index, { workflow: e.target.value })}
                        placeholder="e.g. ./workflow.yaml"
                      />
                      <div className="field-hint">
                        Path relative to schedule file or absolute
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Base directory (optional)</label>
                      <input
                        type="text"
                        value={schedule.baseDir ?? ''}
                        onChange={(e) => updateSchedule(index, { baseDir: e.target.value })}
                        placeholder="e.g. /path/to/workflows"
                      />
                    </div>

                    <div className="form-group schedule-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={schedule.silent ?? false}
                          onChange={(e) => updateSchedule(index, { silent: e.target.checked })}
                        />
                        Silent (suppress output)
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Profile (optional)</label>
                      <input
                        type="text"
                        value={schedule.profile ?? ''}
                        onChange={(e) => updateSchedule(index, { profile: e.target.value })}
                        placeholder="e.g. Production"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addSchedule} className="add-schedule-btn">
              + Add schedule
            </button>
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
                  if (preview) generatePreview();
                }}
              >
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
              </select>
              <button
                onClick={loadFromPreview}
                disabled={!preview}
                className="sync-button sync-from-code"
                title="Load from code into visual editor"
              >
                <span className="button-icon">←</span>
                <span className="button-text">← Visual</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={getCleanSchedules().length === 0}
              >
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
              placeholder="Click '→ Code' to generate YAML/JSON from the visual editor, or paste schedule file content and click '← Visual' to load"
              className="preview-textarea"
              spellCheck={false}
            />
          </div>
          <div className="variable-hint">
            <strong>Usage:</strong> Download the file and run{' '}
            <code>tp schedule add schedules.yaml</code>. Paths in the schedule file are relative to
            the schedule file&apos;s directory.
          </div>
        </div>
      </div>
    </div>
  );
}
