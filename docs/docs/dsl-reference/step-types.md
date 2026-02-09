# Step Types

Describes the step types available in workflows.

## Overview

Each step in the `steps` array can be one of the following types:

1. **`run`** - Execute shell commands
2. **`choose`** - User selection menu
3. **`prompt`** - User text input
4. **`parallel`** - Parallel execution
5. **`fail`** - Workflow failure

## 1. `run` - Execute Command

Execute a shell command.

### Syntax

```yaml
- run: <command>
  when?: <condition>   # Optional: Execute only if condition is met
  timeout?: <number>   # Optional: Timeout in seconds
  retry?: <number> | "Infinity"  # Optional: Number of retries on failure (default: 0). Use "Infinity" for infinite retries
  shell?: <array>      # Optional: Shell configuration (overrides workflow.shell)
  continue?: <bool>    # Optional: Continue workflow even if this step fails
  captures?:           # Optional: Extract stdout values into variables
    - as: <variable>   # Full capture: Store entire stdout
    - regex: <pattern> # Regex capture: Extract first capture group
      as: <variable>
    - json: <jsonpath> # JSON capture: Extract using JSONPath
      as: <variable>
    - yaml: <jsonpath> # YAML capture: Extract using JSONPath (yml alias also supported)
      as: <variable>
    - kv: <key>        # KV capture: Extract value from key=value pairs (.env style)
      as: <variable>
    - after: <marker>  # After capture: Extract text after marker
      before?: <marker> # Optional: Also extract before marker (between capture)
      as: <variable>
    - before: <marker> # Before capture: Extract text before marker
      as: <variable>
    - line:            # Line capture: Extract lines by range
        from: <number> # 1-based, inclusive
        to: <number>   # 1-based, inclusive
      as: <variable>
  onError?:            # Optional: Error handling behavior
    run: <command>     # Fallback command to run when the main run command fails (side effect)
    timeout?: <number> # Optional: Timeout for this fallback command
    retry?: <number> | "Infinity"  # Optional: Number of retries for this fallback command. Use "Infinity" for infinite retries
    onError?: ...      # Optional: Nested fallback (recursive onError chain)
```

### Properties

- `run` (required): `string` - Shell command to execute
- `when` (optional): `Condition` - Condition to check before execution
- `timeout` (optional): `number` - Maximum execution time in seconds. Command will be killed if it exceeds this time.
- `retry` (optional): `number | "Infinity"` - Number of retry attempts if command fails (default: 0, meaning no retry). Use `"Infinity"` for infinite retries until success
- `shell` (optional): `array` of `string` - Shell configuration for this step. Overrides workflow's global `shell`. Format: `[program, ...args]`. Example: `[bash, -lc]`.
- `continue` (optional): `boolean` - Controls whether to proceed to the next step after this step completes, regardless of success or failure.
  - `continue: true` - Always proceed to the next step (even if this step fails)
  - `continue: false` - Always stop the workflow after this step (even if this step succeeds)
  - `continue` not set (default) - Proceed on success, stop on failure
- `captures` (optional): `array` of capture objects - Extract values from stdout and store them as variables. Only applies to `run` steps. Each item uses a strategy (full, regex, json, yaml, kv, after/before/between, line) and an `as` variable name. Parsing failures for a given capture are skipped (that variable is not set); other captures in the array are still applied. See [Capture Strategies](#capture-strategies) below and the [Captures](/docs/dsl-reference/captures) page for full details.
- `onError.run` (optional): `string` - Fallback command executed when the main `run` command (after its retries) fails. **`onError` only performs side effects (cleanup, rollback, logging, etc.) and does not change whether the step is considered successful or failed.** If the main `run` fails, this step is treated as failed regardless of `onError` success.
- `onError.timeout` (optional): `number` - Timeout for this fallback command.
- `onError.retry` (optional): `number | "Infinity"` - Retry count for this fallback command. Use `"Infinity"` for infinite retries.

### Stdout capture (`captures`)

When you add `captures` to a `run` step, the command’s **stdout** is collected and then parsed according to each capture strategy. Extracted values are stored as variables (using the `as` field) and can be used in later steps with `{{variableName}}`. You can specify multiple captures in one step; each capture that parses successfully sets its variable. If a capture fails to match or parse, that variable is simply not set and the workflow continues. For a complete reference of all strategies and behavior, see [Captures](/docs/dsl-reference/captures).

### Examples

```yaml
# Simple command
- run: 'npm install'

# Command with condition
- when:
    file: ./package.json
  run: 'npm install'

# Command with variable substitution
- run: 'echo "Building {{version}}"'

# Command with timeout (30 seconds)
- run: 'npm install'
  timeout: 30

# Command with retry (retry up to 3 times)
- run: 'npm install'
  retry: 3

# Command with infinite retry (retry until success)
- run: 'npm install'
  retry: Infinity

# PM2-like process manager: auto-restart crashed server
- run: 'node server.js'
  retry: Infinity

# Command with fallback on error
- run: 'pnpm lint'
  onError:
    run: 'pnpm lint:fix'

# Command with multi-level fallback on error
- run: 'step1'
  onError:
    run: 'step2'
    onError:
      run: 'step3'

# Command that records failure but continues workflow
- run: 'pnpm typecheck'
  continue: true
  onError:
    run: 'echo "Type check failed, but continuing..."'

# Shell configuration examples
# Unix/Linux/macOS
- run: 'echo "Running with bash"'
  shell: [bash, -lc]

- run: 'echo "Running with zsh"'
  shell: [zsh, -c]

# Windows
- run: 'echo Running with Command Prompt'
  shell: [cmd, /c]

- run: 'Write-Host "Running with PowerShell"'
  shell: [powershell, -Command]

- run: 'Write-Host "Running with PowerShell Core"'
  shell: [pwsh, -Command]

# Capture stdout values into variables
# Full capture: Store entire stdout
- run: 'cat config.txt'
  captures:
    - as: config_content

# Regex capture: Extract first capture group
- run: 'echo "channel=production user=admin"'
  captures:
    - regex: "channel=(\\S+)"
      as: channel
    - regex: "user=(\\S+)"
      as: user

# JSON capture: Extract using JSONPath
- run: 'echo "{\"version\":\"1.0.0\"}"'
  captures:
    - json: "$.version"
      as: version

# YAML capture: Extract using JSONPath
- run: |
    echo "version: 1.0.0"
    echo "env: production"
  captures:
    - yaml: "$.version"
      as: yaml_version

# KV capture: Extract from key-value pairs (.env style)
- run: 'cat .env'
  captures:
    - kv: DATABASE_URL
      as: db_url
    - kv: API_KEY
      as: api_key

# Before/After/Between capture
- run: 'echo "prefix user=admin suffix"'
  captures:
    - after: "user="
      as: user_value

- run: |
    echo "content before"
    echo "end marker"
  captures:
    - before: "end marker"
      as: before_content

- run: 'echo "start:middle content end"'
  captures:
    - after: "start:"
      before: " end"
      as: between_content

# Line capture: Extract lines by range (1-based, inclusive)
- run: |
    echo "line 1"
    echo "line 2"
    echo "line 3"
  captures:
    - line:
        from: 2
        to: 3
      as: line_block

# Use captured values in subsequent steps
- run: 'echo "Version: {{version}}, Channel: {{channel}}"'
- run: 'echo "DB: {{db_url}}"'
```

### Capture Strategies

The `captures` field allows you to extract values from command stdout and store them as variables for use in subsequent steps.

#### Full Capture

Store the entire stdout as a single string.

```yaml
- run: 'cat file.txt'
  captures:
    - as: file_content
```

#### Regex Capture

Extract the first capture group from a regex match.

```yaml
- run: 'echo "channel=production"'
  captures:
    - regex: "channel=(\\S+)"
      as: channel
```

#### JSON Capture

Extract values from JSON output using JSONPath expressions.

```yaml
- run: 'echo "{\"meta\":{\"version\":\"1.0.0\"}}"'
  captures:
    - json: "$.meta.version"
      as: version
```

#### YAML Capture

Extract values from YAML output using JSONPath expressions. Both `yaml` and `yml` are supported (aliases).

```yaml
- run: |
    echo "meta:"
    echo "  version: 1.0.0"
  captures:
    - yaml: "$.meta.version"
      as: version
    # or use yml alias
    - yml: "$.meta.version"
      as: version2
```

#### KV Capture

Extract values from key-value pairs in `.env` style format. Supports `KEY=value` and `KEY = value` (with spaces). Automatically skips comments and empty lines.

```yaml
- run: 'cat .env'
  captures:
    - kv: DATABASE_URL
      as: db_url
    - kv: API_KEY
      as: api_key
```

#### Before/After/Between Capture

Extract text before, after, or between markers.

```yaml
# After marker
- run: 'echo "prefix value suffix"'
  captures:
    - after: "prefix "
      as: after_value

# Before marker
- run: 'echo "content before end"'
  captures:
    - before: " end"
      as: before_value

# Between markers
- run: 'echo "start:middle content:end"'
  captures:
    - after: "start:"
    - before: ":end"
      as: between_value
```

#### Line Capture

Extract a range of lines (1-based, inclusive).

```yaml
- run: |
    echo "line 1"
    echo "line 2"
    echo "line 3"
    echo "line 4"
  captures:
    - line:
        from: 2
        to: 3
      as: line_block
```

---

## 2. `choose` - User Choice

Prompt user to select from a list of options. The choice menu includes a **real-time search feature** that allows you to filter options by typing.

### Syntax

```yaml
- choose:
    message: <string>              # Required: Question to display
    options:                        # Required: Array of options
      - id: <string>                # Required: Unique identifier (stored as value)
        label: <string>             # Required: Display text
      - id: <string>
        label: <string>
    as: <variable-name>             # Optional: Variable name to store result
  when: <condition>                 # Optional: Show choice prompt only if condition is met
```

### Properties

- `choose.message` (required): `string` - Question text displayed to user
- `choose.options` (required): `array` of objects with:
  - `id` (required): `string` - Unique identifier (this value is stored)
  - `label` (required): `string` - Display text shown to user
- `choose.as` (optional): `string` - Variable name to store the selected `id`
- `when` (optional): `Condition` - Show choice prompt only if condition is met

### Interactive Features

The choice menu provides an enhanced interactive experience:

- **Real-time search**: Type to filter options instantly - only matching options are shown
- **Arrow key navigation**: Use ↑↓ keys to navigate through options
- **Enter to select**: Press Enter to confirm your choice
- **Backspace**: Remove characters from search term
- **Escape**: Clear search term and show all options

### Examples

```yaml
# Basic choice
- choose:
    message: "Select environment:"
    options:
      - id: dev
        label: "Development"
      - id: staging
        label: "Staging"
      - id: prod
        label: "Production"

# Choice with variable storage
- choose:
    message: "Select environment:"
    options:
      - id: dev
        label: "Development"
      - id: prod
        label: "Production"
    as: env  # Selected id stored in 'env' variable
```

---

## 3. `prompt` - Text Input

Ask user for text input.

### Syntax

```yaml
- prompt:
    message: <string>              # Required: Question to display
    as: <variable-name>            # Required: Variable name to store result
    default: <string>              # Optional: Default value
  when: <condition>               # Optional: Show prompt only if condition is met
```

### Properties

- `prompt.message` (required): `string` - Question text displayed to user
- `prompt.as` (required): `string` - Variable name to store the input value
- `prompt.default` (optional): `string` - Default value if user presses Enter without input
- `when` (optional): `Condition` - Show prompt only if condition is met

### Examples

```yaml
# Basic prompt
- prompt:
    message: "Enter version number:"
    as: version

# Prompt with default value
- prompt:
    message: "Enter version number:"
    as: version
    default: "1.0.0"
```

---

## 4. `parallel` - Parallel Execution

Execute multiple steps simultaneously.

**Important:** `parallel` can only be used inside the `steps` array at the workflow level. Nested `parallel` (parallel inside parallel) is **not allowed**.

### Syntax

```yaml
- parallel:
    - <step1>
    - <step2>
    - <step3>
  when?: <condition>  # Optional: Execute parallel block only if condition is met
```

### Properties

- `parallel` (required): `array` of steps - Steps to execute in parallel. **Only `run` and `fail` steps are allowed inside `parallel`.** `choose`, `prompt`, and nested `parallel` are **not allowed** inside `parallel`.
- `when` (optional): `Condition` - Execute parallel block only if condition is met

**Restrictions:**
- `parallel` can only be used in the `steps` array at the workflow level
- Do not use `choose` or `prompt` inside `parallel`; the workflow validator will reject it
- Do not nest `parallel` inside `parallel`; nested parallel execution is not supported

### Examples

```yaml
# Basic parallel execution
- parallel:
    - run: 'npm run test:unit'
    - run: 'npm run test:integration'
    - run: 'npm run lint'

# Parallel with fail step
- parallel:
    - run: 'npm run test'
    - run: 'npm run lint'
    - fail:
        message: "This will fail"
```

---

## 5. `fail` - Fail Workflow

Stop the workflow with an error message.

### Syntax

```yaml
- fail:
    message: <string>
  when?: <condition>  # Optional: Fail only if condition is met
```

### Properties

- `fail.message` (required): `string` - Error message to display
- `when` (optional): `Condition` - Fail only if condition is met

### Examples

```yaml
# Fail if file doesn't exist
- when:
    not:
      file: ./dist
  fail:
    message: "Build output not found"
```

---

## Next Steps

- **[Captures](/docs/dsl-reference/captures)** - Stdout capture strategies for `run` steps
- **[Conditions](/docs/dsl-reference/conditions)** - Conditional execution
- **[Variables](/docs/dsl-reference/variables)** - Using variables
- **[Complete Example](/docs/dsl-reference/complete-example)** - Example with all features

