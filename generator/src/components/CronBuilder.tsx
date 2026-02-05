import { useState, useEffect } from 'react';
import {
  buildCronFromState,
  CRON_PRESETS,
  DEFAULT_CRON_STATE,
  WEEKDAY_LABELS,
  type CronBuilderState,
  type RecurrenceType,
} from '../utils/cronBuilder';
import './CronBuilder.css';

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
  placeholder?: string;
}

export default function CronBuilder({ value, onChange, placeholder }: CronBuilderProps) {
  const [presetLabel, setPresetLabel] = useState<string>('');
  const [customCron, setCustomCron] = useState('');
  const [showHelper, setShowHelper] = useState(false);
  const [builderState, setBuilderState] = useState<CronBuilderState>(DEFAULT_CRON_STATE);

  const isCustom = !CRON_PRESETS.some((p) => p.cron && p.cron === value);

  useEffect(() => {
    if (value) {
      const found = CRON_PRESETS.find((p) => p.cron === value);
      if (found) {
        setPresetLabel(found.label);
        setShowHelper(false);
      } else {
        setPresetLabel('Custom / Build');
        setCustomCron(value);
      }
    } else {
      setPresetLabel('');
      setCustomCron('');
    }
  }, [value]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    const preset = CRON_PRESETS.find((p) => p.label === selected);
    if (preset?.cron) {
      onChange(preset.cron);
      setShowHelper(false);
    } else {
      setPresetLabel('Custom / Build');
      if (customCron) onChange(customCron);
    }
  };

  const handleCustomCronChange = (v: string) => {
    setCustomCron(v);
    onChange(v);
  };

  const handleBuilderChange = (next: Partial<CronBuilderState>) => {
    const state = { ...builderState, ...next };
    setBuilderState(state);
    onChange(buildCronFromState(state));
  };

  const toggleWeekDay = (day: number) => {
    const next = builderState.weekDays.includes(day)
      ? builderState.weekDays.filter((d) => d !== day)
      : [...builderState.weekDays, day];
    handleBuilderChange({ weekDays: next });
  };

  return (
    <div className="cron-builder">
      <div className="cron-preset-row">
        <select
          className="cron-preset-select"
          value={presetLabel || (isCustom ? 'Custom / Build' : '')}
          onChange={handlePresetChange}
        >
          <option value="">Select preset or custom...</option>
          {CRON_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {(presetLabel === 'Custom / Build' || isCustom) && (
        <>
          <div className="cron-custom-row">
            <input
              type="text"
              className="cron-custom-input"
              value={customCron}
              onChange={(e) => handleCustomCronChange(e.target.value)}
              placeholder={placeholder ?? 'e.g. 0 9 * * * or */5 * * * * *'}
            />
          </div>
          <button
            type="button"
            className="cron-helper-toggle"
            onClick={() => setShowHelper((v) => !v)}
          >
            {showHelper ? '▼ Hide calendar helper' : '▶ Build with calendar helper'}
          </button>

          {showHelper && (
            <div className="cron-helper-panel">
              <div className="cron-helper-field">
                <label>Repeat</label>
                <select
                  value={builderState.type}
                  onChange={(e) =>
                    handleBuilderChange({ type: e.target.value as RecurrenceType })
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="everyMinutes">Every N minutes</option>
                  <option value="everySeconds">Every N seconds</option>
                </select>
              </div>

              {(builderState.type === 'daily' ||
                builderState.type === 'weekly' ||
                builderState.type === 'monthly') && (
                <div className="cron-helper-time">
                  <div className="cron-helper-field">
                    <label>Hour</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={builderState.hour}
                      onChange={(e) =>
                        handleBuilderChange({ hour: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  <div className="cron-helper-field">
                    <label>Minute</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={builderState.minute}
                      onChange={(e) =>
                        handleBuilderChange({ minute: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>
              )}

              {builderState.type === 'weekly' && (
                <div className="cron-helper-field cron-weekdays">
                  <label>Days of week</label>
                  <div className="cron-weekday-chips">
                    {WEEKDAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`cron-weekday-chip ${
                          builderState.weekDays.includes(i) ? 'active' : ''
                        }`}
                        onClick={() => toggleWeekDay(i)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {builderState.type === 'monthly' && (
                <div className="cron-helper-field">
                  <label>Day of month (1–31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={builderState.dayOfMonth}
                    onChange={(e) =>
                      handleBuilderChange({
                        dayOfMonth: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                </div>
              )}

              {(builderState.type === 'everyMinutes' || builderState.type === 'everySeconds') && (
                <div className="cron-helper-field">
                  <label>
                    Every{' '}
                    {builderState.type === 'everySeconds' ? 'N seconds' : 'N minutes'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={59}
                    value={builderState.everyN}
                    onChange={(e) =>
                      handleBuilderChange({ everyN: parseInt(e.target.value, 10) || 1 })
                    }
                  />
                </div>
              )}

              <div className="cron-helper-result">
                <span className="cron-helper-label">Cron:</span>{' '}
                <code>{buildCronFromState(builderState)}</code>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
