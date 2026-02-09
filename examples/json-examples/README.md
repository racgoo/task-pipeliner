# JSON Examples

This directory contains JSON format workflow examples. All examples are equivalent to their YAML counterparts in the `yaml-examples/` directory.

## Running JSON Examples

```bash
# From project root
task-pipeliner run examples/json-examples/basic.json

# Or from examples directory
cd examples/json-examples
task-pipeliner run basic.json
```

**Try the capture example** (stdout capture strategies and variables):

```bash
task-pipeliner run examples/json-examples/capture-example.json
```

## Available Examples

### Basic Examples

- **basic.json** - Basic workflow with choose, when conditions, and prompts
- **simple.json** - Minimal workflow example with basic features

### Feature Examples

- **parallel.json** - Parallel execution example (only `run` / `parallel` / `fail` allowed inside parallel; `choose` and `prompt` are not allowed)
- **conditions.json** - All condition types (var, file, all, any, not)
- **prompt.json** - User input prompts with defaults
- **variables.json** - Variable usage and substitution examples
- **var-value-example.json** - Variable value comparison examples
- **choice-as-example.json** - Using 'as' keyword in choose steps
- **file-checks.json** - File existence check examples
- **timeout-retry-example.json** - Timeout and retry features
  - Command timeout and automatic retry with exponential backoff
  - Infinite retry with `retry: "Infinity"` (retry until success)

- **pm2-like-example.json** - PM2-like process manager using infinite retry
  - Auto-restart crashed servers and processes
  - Keep services running indefinitely
  - Database connection retry until successful
  - Graceful shutdown handling
- **multi-choice.json** - Multiple sequential choice steps
- **searchable-choice-example.json** - Real-time search in choice prompts
  - Demonstrates search functionality when you have many options
  - Type to filter options instantly
  - Arrow key navigation
  - Useful for long lists (countries, languages, frameworks, etc.)
- **shell-example.json** - Shell configuration examples
  - Global and step-level shell configuration
  - Default: uses your current shell (`$SHELL`)
- **shell-windows-example.json** - Windows shell configuration
  - cmd.exe, PowerShell, pwsh, Git Bash, WSL examples
- **profiles-example.json** - Profile-based non-interactive runs
  - Pre-defined variable sets for `tp run --profile <name>`
  - Skips choose/prompt when variable is set in the profile

### Advanced Examples

- **advanced.json** - Advanced workflow patterns with complex logic (nested parallel uses only run/parallel/fail)
- **cicd.json** - CI/CD pipeline example
- **react.json** - React-specific build and deployment workflow
- **base-dir-example.json** - baseDir configuration example
- **capture-example.json** - Stdout capture examples (equivalent to capture-example.yaml)
  - Full capture: store entire stdout as string
  - Regex: extract first capture group
  - JSON/YAML: extract using JSONPath
  - KV: key-value pairs (.env style)
  - Before/After/Between: extract text around markers
  - Line: extract line range (1-based, inclusive)
  - Use captured values in subsequent steps with `{{variable}}`

## YAML vs JSON

Both formats are fully supported and functionally equivalent. Choose the format that fits your preference:

- **YAML**: More human-readable, better for documentation
- **JSON**: More structured, easier to generate programmatically

## Format Support

task-pipeliner supports both YAML (`.yaml`, `.yml`) and JSON (`.json`) formats. The parser automatically detects the format based on file extension.

