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
- `continue` (optional): `boolean` - Controls whether to proceed to the next step after this step completes, regardless of success or failure.
  - `continue: true` - Always proceed to the next step (even if this step fails)
  - `continue: false` - Always stop the workflow after this step (even if this step succeeds)
  - `continue` not set (default) - Proceed on success, stop on failure
- `onError.run` (optional): `string` - Fallback command executed when the main `run` command (after its retries) fails. **`onError` only performs side effects (cleanup, rollback, logging, etc.) and does not change whether the step is considered successful or failed.** If the main `run` fails, this step is treated as failed regardless of `onError` success.
- `onError.timeout` (optional): `number` - Timeout for this fallback command.
- `onError.retry` (optional): `number | "Infinity"` - Retry count for this fallback command. Use `"Infinity"` for infinite retries.

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

- **[Conditions](/docs/dsl-reference/conditions)** - Conditional execution
- **[Variables](/docs/dsl-reference/variables)** - Using variables
- **[Complete Example](/docs/dsl-reference/complete-example)** - Example with all features

