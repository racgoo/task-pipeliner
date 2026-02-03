import { useState, useEffect, useRef } from 'react';
import './VariableHighlightInput.css';

interface VariableHighlightInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  label?: string;
}

/**
 * Input component that highlights variable usage ({{variable}})
 */
export default function VariableHighlightInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  label,
}: VariableHighlightInputProps) {
  const [hasVariables, setHasVariables] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if value contains variables
  useEffect(() => {
    const variablePattern = /\{\{[\w]+\}\}/g;
    setHasVariables(variablePattern.test(value));
  }, [value]);

  const extractVariables = (text: string): string[] => {
    const variablePattern = /\{\{([\w]+)\}\}/g;
    const matches = text.matchAll(variablePattern);
    return Array.from(matches, (m) => m[1]);
  };

  const variables = extractVariables(value);

  return (
    <div className="variable-input-wrapper">
      {label && (
        <label className="variable-input-label">
          {label}
          {hasVariables && (
            <span className="variable-indicator" title="Contains variables">
              {' '}
              💚
            </span>
          )}
        </label>
      )}
      <div className="variable-input-container">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`variable-input ${hasVariables ? 'has-variables' : ''} ${className}`}
          onFocus={() => setShowTooltip(hasVariables)}
          onBlur={() => setShowTooltip(false)}
        />
        {hasVariables && showTooltip && (
          <div className="variable-tooltip">
            <strong>Variables detected:</strong>
            <ul>
              {variables.map((varName, idx) => (
                <li key={idx}>
                  <code>{'{{' + varName + '}}'}</code>
                </li>
              ))}
            </ul>
            <div className="variable-tooltip-hint">
              Variables from <code>prompt</code> or <code>choose</code> steps can be used here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

