# task-pipeliner

> A powerful workflow orchestration tool with condition-based execution and beautiful CLI output

**Version:** 0.3.4

![fox2](https://github.com/user-attachments/assets/fdf8d786-6a91-4d2d-9dc1-72be6f3ccd98)

[![npm version](https://img.shields.io/npm/v/task-pipeliner)](https://www.npmjs.com/package/task-pipeliner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**task-pipeliner** is a modern workflow orchestration tool that lets you define, coordinate, and execute complex workflows using simple YAML or JSON files. With conditional execution, parallel tasks, interactive prompts, and beautiful terminal output, it's perfect for build scripts, deployment workflows, and CI/CD pipelines. *This project is still in beta; the interface may change slightly.*

**README-Language-Map** [KR [한국어 버전]](https://github.com/racgoo/task-pipeliner/blob/main/README.ko.md) / [EN [English Version]](https://github.com/racgoo/task-pipeliner)

## 🔗 Resources

### Documentation & Tools

- 📚 **[Documentation](https://task-pipeliner.racgoo.com/)** - Complete DSL reference and guides
- 🎨 **[Visual Generator](https://task-pipeliner-generator.racgoo.com/)** - Create workflows visually in your browser

### Repositories & Package Managers

- 💻 **[GitHub](https://github.com/racgoo/task-pipeliner)** - Source code and issue tracking
- 📦 **[npm](https://www.npmjs.com/package/task-pipeliner)** - Package on npm registry
- 🍺 **[Homebrew](https://github.com/racgoo/homebrew-task-pipeliner)** - Homebrew tap for macOS/Linux
- 🪟 **[Scoop](https://github.com/racgoo/scoop-task-pipeliner)** - Scoop bucket for Windows

### CLI Commands

**Project setup (recommended for new projects):**
```bash
tp setup   # Create tp/, tp/workflows, tp/schedules and add 2 example workflows + 2 example schedules (echo-based; includes choose, when, profiles, prompt)
```
Run from your project root. Creates `tp/workflows/` and `tp/schedules/`; example workflows demonstrate choose, when, profiles, and prompt; example schedules include cron and profile usage. Does not overwrite existing files.

**Run Workflows:**
```bash
tp run workflow.yaml        # Run a workflow
tp run                      # Select and run a workflow from nearest tp/workflows directory
tp run workflow.yaml --profile Test   # Run with profile (skip choose/prompt for variables set in profile)
tp run workflow.yaml -p Test         # Short form for profile
tp run workflow.yaml --silent  # Run in silent mode (suppress all console output)
tp run workflow.yaml -s     # Short form for silent mode
```

**Open Resources:**
```bash
tp open generator  # Open visual generator
tp open docs       # Open documentation
```

**History Management:**
```bash
tp history         # View workflow execution history
tp history show    # Select and view a specific history
tp history remove   # Remove a specific history
tp history remove-all # Remove all histories
```

**Workflow Scheduling:**
```bash
tp schedule        # View all schedules (same as tp schedule list)
tp schedule list   # List schedules with daemon status (each schedule shown as a card: cron, human "when" description, next run, etc.)
tp schedule add schedules.yaml  # Add schedules from a file; if no file given, select from nearest tp/schedules
tp schedule add    # Select a schedule file from nearest tp/schedules directory
tp schedule remove # Remove a schedule; after removal, the removed schedule is shown in the same card format as list
tp schedule remove-all # Remove all schedules
tp schedule toggle # Enable/disable a schedule; after toggle, shows clear ENABLED/DISABLED state (bold, colored) and the schedule card
tp schedule start  # Start scheduler in foreground mode
tp schedule start -d  # Start scheduler daemon in background
tp schedule stop   # Stop the scheduler daemon
tp schedule status # Check daemon status (real-time mode; Ctrl+C exits the view only, daemon keeps running)
```
After `tp schedule add`, `toggle`, or `remove`, the affected schedule(s) are displayed in the same card layout as `tp schedule list` (cron expression, human-readable “when” description, next run, enabled state). Toggle result emphasizes ENABLED or DISABLED so the new state is obvious.

**Data & upgrades:**
```bash
tp clean   # Remove all data in ~/.pipeliner (schedules, daemon state, workflow history)
```
After upgrading to a new version, if you see compatibility issues (e.g. schedules or daemon not working), run `tp clean` to reset local data. The daemon is stopped first if it is running.

## ✨ Features

-  **Condition-based execution** - Run steps based on file existence, user choices, environment variables, and more

- **Parallel execution** - Run multiple tasks simultaneously

- **Interactive prompts** - Ask users for input and choices during execution

- **YAML & JSON support** - Declarative pipelining in YAML & JSON formats

- **Variable substitution** - Use `{{variables}}` throughout your workflows

- **Profiles** - Run workflows non-interactively with pre-set variables (`tp run --profile <name>`); choose/prompt steps are skipped when the variable is set in the profile

- **Execution history** - Track and review past workflow executions with detailed step-by-step records

- **Workflow scheduling** - Schedule workflows to run automatically at specified times using cron expressions

## 🚀 Quick Start

### Installation

#### Homebrew (macOS/Linux)

Install using Homebrew for the easiest setup on macOS and Linux:

```bash
# Add the tap (repository)
brew tap racgoo/task-pipeliner

# Install task-pipeliner
brew install task-pipeliner
```

After installation, you can run:
```bash
task-pipeliner run workflow.yaml
# or use the short alias
tp run workflow.yaml
```

**Updating:**
```bash
# Update Homebrew's package registry first
brew update

# Then upgrade task-pipeliner
brew upgrade task-pipeliner
```

If you see compatibility issues after an upgrade (e.g. schedules or daemon), run `tp clean` to reset `~/.pipeliner` data (schedules, daemon state, history).

#### Scoop (Windows)

Install using Scoop on Windows:

```bash
# Add the bucket (repository)
scoop bucket add task-pipeliner https://github.com/racgoo/scoop-task-pipeliner

# Install task-pipeliner
scoop install task-pipeliner
```

After installation, you can run:
```bash
task-pipeliner run workflow.yaml
# or use the short alias
tp run workflow.yaml
```

**Updating:**
```bash
scoop update task-pipeliner
```

If you see compatibility issues after an upgrade, run `tp clean` to reset `~/.pipeliner` data.

#### Global Installation (npm)

Install globally using npm to use `task-pipeliner` or `tp` commands directly:

```bash
npm install -g task-pipeliner
# or
pnpm add -g task-pipeliner
```

After global installation, you can run:
```bash
task-pipeliner run workflow.yaml
# or use the short alias
tp run workflow.yaml
```

#### Project Installation (Development)

Install as a dev dependency to use with `npx`:

```bash
npm install -D task-pipeliner
# or
pnpm add -D task-pipeliner
```

After project installation, run with:
```bash
npx task-pipeliner run workflow.yaml
# or use the short alias
npx tp run workflow.yaml
```

### Basic Usage

Create a `workflow.yaml` or `workflow.json` file:

**YAML Format (`workflow.yaml`):**

```yaml
name: My Workflow

steps:
  - run: echo "Hello, World!"
  
  - choose:
      message: "What would you like to do?"
      options:
        - id: build
          label: "Build project"
        - id: test
          label: "Run tests"
      as: action
  
  - when:
      var:
        action: build
    run: npm run build
  
  - when:
      var:
        action: test
    run: npm test
```

**JSON Format (`workflow.json`):**

```json
{
  "name": "My Workflow",
  "steps": [
    {
      "run": "echo \"Hello, World!\""
    },
    {
      "choose": {
        "message": "What would you like to do?",
        "options": [
          {
            "id": "build",
            "label": "Build project"
          },
          {
            "id": "test",
            "label": "Run tests"
          }
        ],
        "as": "action"
      }
    },
    {
      "when": {
        "var": {
          "action": "build"
        }
      },
      "run": "npm run build"
    },
    {
      "when": {
        "var": {
          "action": "test"
        }
      },
      "run": "npm test"
    }
  ]
}
```

Run it:

```bash
task-pipeliner run workflow.yaml
# or
task-pipeliner run workflow.json
# or use the short alias
tp run workflow.yaml
tp run workflow.json

# Run in silent mode (suppress all console output)
tp run workflow.yaml --silent
# or use the short form
tp run workflow.yaml -s
```

**Using the `tp` Directory (Recommended):**

The recommended project layout uses a `tp` directory with two subdirectories:

- **`tp/workflows/`** – workflow files (YAML or JSON). When you run `tp run` without a file, task-pipeliner finds the nearest `tp` directory and lets you choose a workflow from `tp/workflows/`.
- **`tp/schedules/`** – schedule files (YAML or JSON). When you run `tp schedule add` without a file path, you can select a schedule file from the nearest `tp/schedules/`.

**Quick setup:** Run `tp setup` from your project root to create `tp/`, `tp/workflows/`, and `tp/schedules/` and to add two example workflows and two example schedule files (echo-based; examples include choose, when, profiles, prompt, and schedule profile usage). Existing files are not overwritten.

```bash
# Option 1: Use tp setup (creates tp/workflows and tp/schedules + examples)
tp setup

# Option 2: Create the structure manually
mkdir -p tp/workflows tp/schedules
mv workflow.yaml tp/workflows/

# Run without specifying a file - interactive selection from tp/workflows
tp run
```

When you run `tp run` without a file:
1. The nearest `tp` directory is found (current directory or any parent).
2. All workflow files (`.yaml`, `.yml`, `.json`) in **`tp/workflows/`** are listed.
3. An interactive, searchable menu is shown: type to filter, use arrow keys (↑↓) to move, Enter to select and run.

The menu shows both the filename and the workflow `name` from the YAML/JSON for easy identification.

**Silent Mode:**
The `--silent` (or `-s`) flag suppresses all console output during workflow execution. This is useful for:
- CI/CD pipelines where you only need exit codes
- Automated scripts that don't need verbose output
- Reducing noise in logs

Note: Silent mode suppresses all output including command output, step headers, and error messages. The workflow still executes normally and returns appropriate exit codes.

## 📖 DSL Syntax

### Workflow Structure

A workflow file is a YAML or JSON document with the following structure:

**YAML Format:**

```yaml
name: Workflow Name                    # Optional: Display name for the workflow
baseDir: ./                            # Optional: Base directory for command execution
                                      #   - Relative path: resolved from YAML file location
                                      #   - Absolute path: used as-is
                                      #   - If omitted: uses current working directory
shell:                                 # Optional: Global shell configuration for all run commands
  - bash                               #   - First element: shell program (bash, zsh, sh, etc.)
  - -lc                                #   - Rest: shell arguments (-c, -lc, etc.)
                                      #   - If omitted: uses platform default shell
profiles:                              # Optional: Pre-set variables for tp run --profile <name>
  - name: Test                         #   - name: profile name
    var:                               #   - var: key-value map (used for {{variable}} and to skip choose/prompt)
      mode: "dev"
      label: "test-label"

steps:                                 # Required: Array of steps to execute
  - some-step-1
  - some-step-2
  # ...
```

**JSON Format:**

```json
{
  "name": "Workflow Name",             // Optional: Display name for the workflow
  "baseDir": "./",                     // Optional: Base directory for command execution
                                       //   - Relative path: resolved from JSON file location
                                       //   - Absolute path: used as-is
                                       //   - If omitted: uses current working directory
  "shell": ["bash", "-lc"],           // Optional: Global shell configuration for all run commands
                                       //   - First element: shell program
                                       //   - Rest: shell arguments
                                       //   - If omitted: uses platform default shell
  "profiles": [                        // Optional: Pre-set variables for tp run --profile <name>
    { "name": "Test", "var": { "mode": "dev", "label": "test-label" } }
  ],
  "steps": [                           // Required: Array of steps to execute
    { /* some-step-1 */ },
    { /* some-step-2 */ }
  ]
}
```

#### `name` (optional)
- **Type**: `string`
- **Description**: Display name for the workflow
- **Example**: `name: "Build and Deploy"`

#### `baseDir` (optional)
- **Type**: `string` (relative or absolute path)
- **Description**: Base directory for all command executions
- **Resolution**:
  - **Relative path** (e.g., `./`, `../frontend`): Resolved relative to the workflow file's directory
  - **Absolute path** (e.g., `/home/user/project`): Used as-is
  - **If omitted**: Uses `process.cwd()` (current working directory)
- **Example**:
  ```yaml
  baseDir: ./frontend        # Relative to workflow file
  baseDir: /app/frontend     # Absolute path
  ```

#### `shell` (optional)
- **Type**: `array` of `string`
- **Description**: Global shell configuration for all `run` commands in the workflow
- **Format**: `[program, ...args]` - First element is the shell program, rest are arguments
- **Priority**: Step-level `shell` > Workflow-level `shell` > User's current shell
- **User's current shell** (when omitted):
  - **Linux/macOS**: Uses `$SHELL` environment variable (e.g., `/bin/zsh`, `/bin/bash`)
  - **Windows**: Uses `%COMSPEC%` (typically `cmd.exe`)
  - **Behavior**: Commands run in the same shell environment as where you execute `tp run`
- **Example**:
  ```yaml
  # Unix/Linux/macOS
  shell: [bash, -lc]         # Use bash login shell
  shell: [zsh, -c]           # Use zsh
  shell: [sh, -c]            # Use sh (POSIX)
  
  # Windows
  shell: [cmd, /c]           # Command Prompt
  shell: [powershell, -Command]  # Windows PowerShell
  shell: [pwsh, -Command]    # PowerShell Core
  ```
- **Cross-platform examples**:
  - **Linux/macOS**: `[bash, -lc]`, `[zsh, -c]`, `[/bin/bash, -c]`
  - **Windows**: `[cmd, /c]`, `[powershell, -Command]`, `[pwsh, -Command]`
  - **Git Bash (Windows)**: `[bash, -c]`
  - **WSL**: `[wsl, bash, -c]` or use `wsl` command directly

#### `profiles` (optional)
- **Type**: `array` of `{ name: string, var: Record<string, string> }`
- **Description**: Named sets of variables for non-interactive runs. Use with `tp run --profile <name>`.
- **Behavior**: When a profile is used, any **choose** or **prompt** step that stores into a variable already set in the profile is skipped; the profile value is used for `{{variable}}` substitution and conditions.
- **Example**:
  ```yaml
  profiles:
    - name: Test
      var:
        mode: "dev"
        label: "test-label"
    - name: Prod
      var:
        mode: "prod"
        label: "prod-label"
  ```
  ```bash
  tp run workflow.yaml --profile Test   # Uses Test profile variables; choose/prompt for mode, label are skipped
  ```

#### `steps` (required)
- **Type**: `array` of `Step` objects
- **Description**: List of steps to execute sequentially
- **Execution**: Steps run in order, one after another (unless parallel)

---

### Step Types

Each step in the `steps` array can be one of the following types:

#### 1. `run` - Execute Command

Execute a shell command.

**Syntax:**
```yaml
- run: <command>
  when?: <condition>  # Optional: Execute only if condition is met
  timeout?: <number>  # Optional: Timeout in seconds
  retry?: <number> | "Infinity"  # Optional: Number of retries on failure (default: 0). Use "Infinity" for infinite retries
  shell?: <array>     # Optional: Shell configuration (overrides workflow.shell)
  continue?: <bool>   # Optional: Continue to next step after this step completes (regardless of success/failure)
  onError?:            # Optional: Error handling behavior
    run: <command>     # Fallback command when main run command fails (side effect)
    timeout?: <number> # Optional: Timeout for this fallback command
    retry?: <number> | "Infinity"  # Optional: Retry count for this fallback command. Use "Infinity" for infinite retries
    onError?: ...      # Optional: Nested fallback (recursive onError chain)
```

**Properties:**
- `run` (required): `string` - Shell command to execute
- `when` (optional): `Condition` - Condition to check before execution
- `timeout` (optional): `number` - Maximum execution time in seconds. Command will be killed if it exceeds this time.
- `retry` (optional): `number | "Infinity"` - Number of retry attempts if command fails (default: 0, meaning no retry). Use `"Infinity"` for infinite retries until success
- `shell` (optional): `array` of `string` - Shell configuration for this step. Overrides workflow's global `shell`. Format: `[program, ...args]`. Example: `[bash, -lc]`, `[zsh, -c]`.
- `continue` (optional): `boolean` - Controls whether to proceed to the next step after this step completes, regardless of success or failure.
  - `continue: true` - Always proceed to the next step (even if this step fails)
  - `continue: false` - Always stop the workflow after this step (even if this step succeeds)
  - `continue` not set (default) - Proceed on success, stop on failure
 - `onError.run` (optional): `string` - Fallback command executed when the main `run` command (after its retries) fails. **onError only performs side effects (e.g., cleanup, rollback) and does not affect the step's success/failure status.** If the main `run` fails, this step is considered failed regardless of onError execution.
 - `onError.timeout` (optional): `number` - Timeout for this fallback command.
 - `onError.retry` (optional): `number | "Infinity"` - Retry count for this fallback command. Use `"Infinity"` for infinite retries.

**Examples:**
```yaml
# Simple command
steps:
  - run: npm install

  # Command with condition
  - when:
      file: ./package.json
    run: npm install

  # Variable input
  - choose:
      message: Select execution mode.
      options:
        - id: 1.1.1
          label: Version 1.1.1 (string displayed in display area)
        - id: 1.1.2
          label: Version 1.1.2 (string displayed in display area)
        - id: 1.1.3
          label: Version 1.1.3 (string displayed in display area)
      as: version

  # Command with variable substitution
  - run: echo "Building {{version}}"

  # Command with timeout (30 seconds)
  - run: npm install
    timeout: 30

  # Command with retry (retry up to 3 times)
  - run: npm install
    retry: 3

  # Command with infinite retry (retry until success)
  - run: npm install
    retry: Infinity

  # PM2-like process manager: auto-restart crashed server
  - run: node server.js
    retry: Infinity

  # Using both timeout and retry
  - run: npm install
    timeout: 60
    retry: 2

  # Command with fallback on error
  - run: pnpm lint
    onError:
      run: pnpm lint:fix

  # Command with multi-level fallback on error
  - run: step1
    onError:
      run: step2
      onError:
        run: step3

  # Command that records failure but continues workflow
  - run: pnpm typecheck
    continue: true
    onError:
      run: echo "Type check failed, but continuing..."

  # Command with custom shell (step-level)
  - run: echo $SHELL
    shell:
      - zsh
      - -c

  # Command with bash login shell
  - run: source ~/.bashrc && echo "Loaded profile"
    shell:
      - bash
      - -lc
```

**Behavior:**
- Command runs in the `baseDir` (if specified) or current working directory
- The main `run` command's success/failure determines the final step result. `onError` only performs additional actions (cleanup, rollback, etc.) on failure and does not change the step's success status.
- The `continue` flag controls workflow execution after this step completes:
  - `continue: true` - Always proceed to the next step (regardless of success/failure)
  - `continue: false` - Always stop the workflow (regardless of success/failure)
  - `continue` not set - Default behavior: proceed on success, stop on failure
- Output is displayed in real-time with CLI formatting
- If `timeout` is specified and command exceeds the time limit, it will be killed and the step will fail
- If `retry` is specified, the command will be retried up to the retry value until it succeeds

---

#### 2. `choose` - User Choice

Prompt user to select from a list of options. The choice menu includes a **real-time search feature** that allows you to filter options by typing.

**Syntax:**
```yaml
steps:
  - choose:
      message: <string>              # Required: Question to display
      options:                        # Required: Array of options
        - id: <string>                # Required: Unique identifier (stored as value)
          label: <string>             # Required: Display text
        - id: <string>
          label: <string>
      as: <variable-name>             # Optional: Variable name to store result
    when: <condition>                 # Condition for providing choice prompt
```

**Properties:**
- `choose.message` (required): `string` - Question text displayed to user
- `choose.options` (required): `array` of objects with:
  - `id` (required): `string` - Unique identifier (this value is stored)
  - `label` (required): `string` - Display text shown to user
- `choose.as` (optional): `string` - Variable name to store the selected `id`
  - If omitted: choice is stored by its `id` (for backward compatibility)
  - If provided: selected `id` is stored in this variable name
- `when` (optional): `Condition` - Show choice prompt only if condition is met

**Interactive Features:**
- **Real-time search**: Type to filter options instantly - only matching options are shown
- **Arrow key navigation**: Use ↑↓ keys to navigate through options
- **Enter to select**: Press Enter to confirm your choice
- **Backspace**: Remove characters from search term
- **Escape**: Clear search term and show all options

**Examples:**
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

# Conditional choice
- when:
    file: ./package.json
  choose:
    message: "Run tests?"
    options:
      - id: yes
        label: "Yes"
      - id: no
        label: "No"
    as: runTests
```

**Storage:**
- Selected option's `id` is stored as:
  1. A choice (accessible via `hasChoice(id)`)
  2. A variable with the `id` name (for backward compatibility)
  3. If `as` is provided: also stored as a variable with the `as` name

**Usage in conditions:**
```yaml
# After choice with 'as: env'
- when:
    var:         # Definition that uses a variable
      env: prod  # Check if 'env' variable equals 'prod'
  run: echo "Deploying to production"
```

---

#### 3. `prompt` - Text Input

Ask user for text input.

**Syntax:**
```yaml
- prompt:
    message: <string>              # Required: Question to display
    as: <variable-name>            # Required: Variable name to store result
    default: <string>              # Optional: Default value
  when: <condition>               # Optional: Show prompt only if condition is met
```

**Properties:**
- `prompt.message` (required): `string` - Question text displayed to user
- `prompt.as` (required): `string` - Variable name to store the input value
- `prompt.default` (optional): `string` - Default value if user presses Enter without input
- `when` (optional): `Condition` - Show prompt only if condition is met

**Examples:**
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

# Conditional prompt
- when:
    var:
      env: prod
  prompt:
    message: "Enter production deployment reason:"
    as: deployReason
```

**Storage:**
- User input is stored as a variable with the name specified in `as`
- Can be used in commands with `{{variable}}` syntax
- Can be checked in conditions with `var` conditions

**Usage:**
```yaml
# Use in command
- run: echo "Building version {{version}}"

# Check in condition
- when:
    var:
      version: "1.0.0"
  run: echo "Deploying stable version"
```

---

#### 4. `parallel` - Parallel Execution

Execute multiple steps simultaneously. Like `steps`, `parallel` contains an array of steps, each starting with `-`. All these steps execute at the same time.

**Syntax:**
```yaml
- parallel:
    - <step1>  # Each step starts with `-`, same format as `steps`
    - <step2>
    - <step3>
  when?: <condition>  # Optional: Execute parallel block only if condition is met
```

**Properties:**
- `parallel` (required): `array` of steps - Steps to execute in parallel. **Only `run`, nested `parallel`, and `fail` steps are allowed.** `choose` and `prompt` (user input steps) are **not allowed** inside `parallel`—user input cannot run in parallel.
- `when` (optional): `Condition` - Execute parallel block only if condition is met

**Restriction:** Steps inside `parallel` may only be `run`, nested `parallel`, or `fail`. Do **not** use `choose` or `prompt` inside `parallel`; the workflow validator will reject it and report an error (e.g. `'choose' step is not allowed inside 'parallel' block`).

**Examples:**
```yaml
# Basic parallel execution
# Each step inside parallel starts with `-`, same format as `steps`
- parallel:
    - run: npm run test:unit
    - run: npm run test:integration
    - run: npm run lint

# Parallel with conditions
# Each step can have its own `when` condition
- parallel:
    - when:
          file: ./src
        run: echo "Building frontend..."
    - when:
          file: ./api
        run: echo "Building backend..."

# Conditional parallel block
# The entire parallel block can have a `when` condition
- when:
    var:
      env: staging
  parallel:
    - run: npm run test
    - run: npm run lint

# Nested parallel (allowed); only run / parallel / fail inside parallel
- parallel:
    - run: npm run test
    - parallel:
        - run: npm run lint
        - run: npm run typecheck
```

**Behavior:**
- All steps in the `parallel` array start executing at the same time
- Workflow waits for all parallel steps to complete before continuing
- If any step fails, the workflow stops
- Each parallel branch has its own isolated workspace state (cloned)
- **`choose` and `prompt` are not allowed inside `parallel`** (user input cannot run in parallel; use them in sequential steps before or after a `parallel` block)

---

#### 5. `fail` - Fail Workflow

Stop the workflow with an error message.

**Syntax:**
```yaml
- fail:
    message: <string>
  when?: <condition>  # Optional: Fail only if condition is met
```

**Properties:**
- `fail.message` (required): `string` - Error message to display
- `when` (optional): `Condition` - Fail only if condition is met

**Examples:**
```yaml
# Fail if file doesn't exist
- when:
    not:
      file: ./dist
  fail:
    message: "Build output not found"

# Fail based on variable
- when:
    var:
      env: prod
  fail:
    message: "Cannot deploy to production without approval"
```

**Behavior:**
- Immediately stops workflow execution
- Displays the error message
- Exits with non-zero status code

---

### Conditions (`when` clause)

Conditions control when steps execute. All conditions are evaluated as questions about the workspace state.

#### Condition Types

##### 1. File Existence (`file`)

Check if a file or directory exists.

**Syntax:**
```yaml
when:
  file: <path>
```

**Properties:**
- `file`: `string` - File or directory path (relative to current working directory)

**Examples:**
```yaml
- when:
    file: ./dist
  run: echo "Build exists"

- when:
    file: ./package.json
  run: npm install

- when:
    not:
      file: ./node_modules
  run: npm install
```

**Behavior:**
- Paths are resolved relative to `process.cwd()` (current working directory)
- Returns `true` if file or directory exists, `false` otherwise

---

##### 2. Variable Value Comparison (`var` object)

Check if a variable equals a specific value.

**Syntax:**
```yaml
when:
  var:
    <variable-name>: <expected-value>
```

**Properties:**
- `var`: `object` - Object with variable name as key and expected value as value
- Keys: Variable names (from `prompt.as` or `choose.as`)
- Values: Expected string values to compare

**Examples:**
```yaml
# Check if env variable equals 'prod'
- when:
    var:
      env: prod
  run: echo "Deploying to production"

# Check if version equals specific value
- when:
    var:
      version: "1.0.0"
  run: echo "Deploying stable version"

# Multiple variable checks (all must match)
- when:
    var:
      env: staging
      version: "2.0.0"
  run: echo "Deploying v2.0.0 to staging"
```

**Behavior:**
- Compares variable value (as string) with expected value
- Returns `true` if values match exactly (case-sensitive)
- Returns `false` if variable doesn't exist or values don't match
- All key-value pairs in the object must match (AND logic)

---

##### 3. Variable Existence (`var` string)

Check if a variable exists (regardless of value).

**Syntax:**
```yaml
when:
  var: <variable-name>
# or
when:
  has: <variable-name>  # Alias for var
```

**Properties:**
- `var` or `has`: `string` - Variable name to check

**Examples:**
```yaml
# Check if variable exists
- when:
    var: version
  run: echo "Version: {{version}}"

# Use 'has' alias
- when:
    has: projectName
  run: echo "Project: {{projectName}}"
```

**Behavior:**
- Returns `true` if variable exists (from `prompt.as` or `choose.as`)
- Returns `false` if variable doesn't exist
- Only checks existence, not value

---

##### 4. Combined Conditions

Combine multiple conditions using `all`, `any`, and `not`.

###### `all` - AND Logic

All conditions must be true.

**Syntax:**
```yaml
when:
  all:
    - <condition1>
    - <condition2>
    - <condition3>
```

**Examples:**
```yaml
- when:
    all:
      - file: ./dist
      - var:
          env: production
  run: echo "Production build ready"

- when:
    all:
      - var:
          env: staging
      - var:
          version: "2.0.0"
      - file: ./dist
  run: echo "Deploying v2.0.0 to staging"
```

**Behavior:**
- Returns `true` only if ALL conditions in the array are `true`
- Returns `false` if ANY condition is `false`
- Short-circuit evaluation: stops checking after first `false`

---

###### `any` - OR Logic

Any condition can be true.

**Syntax:**
```yaml
when:
  any:
    - <condition1>
    - <condition2>
    - <condition3>
```

**Examples:**
```yaml
- when:
    any:
      - var:
          env: staging
      - var:
          env: production
  run: echo "Deploying to server"

- when:
    any:
      - file: ./dist
      - file: ./build
  run: echo "Build output found"
```

**Behavior:**
- Returns `true` if ANY condition in the array is `true`
- Returns `false` only if ALL conditions are `false`
- Short-circuit evaluation: stops checking after first `true`

---

###### `not` - Negation

Negate a condition.

**Syntax:**
```yaml
when:
  not:
    <condition>
```

**Examples:**
```yaml
# Fail if file doesn't exist
- when:
    not:
      file: ./dist
  fail:
    message: "Build output not found"

# Execute if variable doesn't equal value
- when:
    not:
      var:
        env: prod
  run: echo "Not production environment"

# Complex negation
- when:
    not:
      all:
        - file: ./dist
        - var:
            env: prod
  run: echo "Production not ready"
```

**Behavior:**
- Returns `true` if inner condition is `false`
- Returns `false` if inner condition is `true`
- Can negate any condition type

---

##### 5. Nested Conditions

Nest conditions to create complex logic.

**Examples:**
```yaml
# Complex nested condition
- when:
    all:
      - file: ./dist
      - any:
          - var:
              env: staging
          - var:
              env: production
      - not:
          var:
            version: "0.0.0"
  run: echo "Ready to deploy"

# Multiple levels of nesting
- when:
    any:
      - all:
          - var:
              env: prod
          - file: ./dist
      - all:
          - var:
              env: staging
          - not:
              file: ./test-results
  run: echo "Conditional deployment"
```

---

### Variable Substitution

Variables can be used in commands using the `{{variable}}` syntax. Optional whitespace is supported: `{{var}}`, `{{ var }}`, `{{  var  }}` all work.

**Syntax:**
```yaml
run: echo "{{variableName}}"
# or with optional spaces
run: echo "{{ variableName }}"
```

**⚠️ Important YAML Syntax Rules:**

When using `{{variable}}` in commands, follow these rules to avoid parsing errors:

✅ **Safe patterns:**
```yaml
# Start with a word (no quotes needed)
- run: echo "Building {{version}}..."
- run: npm run build --version={{version}}

# Wrap entire command in single quotes
- run: 'echo "Selected: {{mode}}"'
```

❌ **Problematic patterns:**
```yaml
# DO NOT: quotes + colons before variables
- run: echo "mode: {{mode}}"        # ❌ YAML parsing error!

# FIX: Wrap entire command in single quotes
- run: 'echo "mode: {{mode}}"'      # ✅ Works correctly
```

**Examples:**
```yaml
# Use prompt variable
- prompt:
    message: "Enter project name:"
    as: projectName
- run: echo "Building {{projectName}}..."

# Use choice variable
- choose:
    message: "Select environment:"
    options:
      - id: dev
        label: "Development"
    as: env
- run: echo "Deploying to {{env}}"

# Multiple variables
- run: echo "Building {{projectName}} version {{version}} for {{env}}"
```

**Behavior:**
- Variables are replaced with their string values
- If variable doesn't exist, it's replaced with empty string
- Variables are resolved at execution time

---

### Complete Example

A complete example demonstrating all features:

```yaml
name: Complete Workflow Example
baseDir: ./
shell: [bash, -c]  # Optional: Use bash for all steps (default: user's current shell)

steps:
  # 1. Simple command
  - run: echo "Starting workflow..."

  # 2. User choice with variable storage
  - choose:
      message: "Select deployment environment:"
      options:
        - id: dev
          label: "Development"
        - id: staging
          label: "Staging"
        - id: prod
          label: "Production"
      as: env

  # 3. Conditional step based on variable value
  - when:
      var:
        env: prod
    prompt:
      message: "Enter production deployment reason:"
      as: deployReason

  # 4. Variable value comparison
  - when:
      var:
        env: dev
    run: echo "Deploying to development..."

  - when:
      var:
        env: staging
    run: echo "Deploying to staging..."

  # 5. Complex condition (all)
  - when:
      all:
        - var:
            env: prod
        - var: deployReason
        - file: ./dist
    run: echo "Production deployment approved"

  # 6. Parallel execution
  - parallel:
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run lint

  # 6.5. Step-level shell override
  - run: echo "Running with zsh"
    shell: [zsh, -c]  # Override workflow shell for this step only

  # 7. File existence check
  - when:
      file: ./test-results
    run: echo "Tests completed"

  # 8. Combined condition (any)
  - when:
      any:
        - var:
            env: staging
        - var:
            env: prod
    run: echo "Deploying to server..."

  # 9. Negation
  - when:
      not:
        file: ./dist
    fail:
      message: "Build output not found"

  # 10. Variable substitution
  - run: echo "Deploying {{projectName}} version {{version}} to {{env}}"
```

---

## 📜 History Management

task-pipeliner automatically records workflow execution history, allowing you to review past executions, debug issues, and track performance.

### Viewing History

All workflow executions are automatically saved to `~/.pipeliner/workflow-history/` with timestamped filenames.

**Interactive Menu:**
```bash
tp history
```

This opens an interactive menu where you can:
- **Show** - View and select a history to view
- **Remove** - Delete a specific history file
- **Remove All** - Delete all history files

**View Specific History:**
```bash
tp history show
```

This command:
1. Lists all available history files
2. Lets you select one to view
3. Displays detailed execution information including:
   - Execution timestamp
   - Total duration
   - Step-by-step results (success/failure)
   - Command output (stdout/stderr)
   - Step durations

**Example Output:**
```
┌─────────────────────────────────────────┐
│  Workflow Execution History             │
│                                         │
│  File: workflow-2026-01-26_21-51-17...  │
│  Started: 2026-01-26 21:51:17           │
│  Total Duration: 5.23s                  │
│  Total Steps: 3                         │
│  ✓ Successful: 2                        │
│  ✗ Failed: 1                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✓ Step 1/3 - Run                       │
│  Duration: 1.23s | Status: Success      │
│                                         │
│  Command: npm install                   │
└─────────────────────────────────────────┘
```

### Removing History

**Remove Specific History:**
```bash
tp history remove
```

Opens an interactive menu to select which history file to delete.

**Remove All Histories:**
```bash
tp history remove-all
```

Removes all stored workflow execution histories. You'll be prompted for confirmation unless you use the `-y` flag:

```bash
tp history remove-all -y  # Skip confirmation
```

### History File Format

History files are stored as JSON in `~/.pipeliner/workflow-history/` with the following structure:

```json
{
  "initialTimestamp": 1706281877000,
  "records": [
    {
      "step": { "run": "npm install" },
      "output": {
        "success": true,
        "stdout": ["...", "..."],
        "stderr": []
      },
      "duration": 1234,
      "status": "success"
    }
  ]
}
```

Each record contains:
- **step**: The step definition that was executed
- **output**: Command output (stdout/stderr) and success status
- **duration**: Execution time in milliseconds
- **status**: `"success"` or `"failure"`

---

## ⏰ Workflow Scheduling

Schedule workflows to run automatically at specified times using cron expressions.

### Adding Schedules

Create a schedule file (YAML or JSON) defining your schedules:

**YAML (`schedules.yaml`):**
```yaml
schedules:
  - name: Daily Build          # Schedule alias (for identification)
    cron: "0 9 * * *"          # Cron expression
    workflow: ./build.yaml     # Path relative to schedule file

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true               # Optional: run in silent mode

  - name: Production Deploy
    cron: "0 18 * * 5"         # Every Friday at 6 PM
    workflow: ./deploy.yaml
    profile: Production        # Optional: use specific profile

  - name: Hourly Check
    cron: "0 * * * *"
    workflow: simple.yaml
    baseDir: /path/to/workflows  # Optional: base directory for workflow path

  - name: Daily UTC
    cron: "0 9 * * *"
    workflow: ./daily.yaml
    timezone: 0                   # Optional: UTC offset (hours). +9, -5, 0. Omit = system local
```

**Field Descriptions:**
- `name`: Alias to identify the schedule
- `cron`: Execution time (cron expression)
- `workflow`: Path to workflow file (relative to schedule file or `baseDir`, or absolute)
- `baseDir`: (Optional) Base directory for workflow path (defaults to schedule file's directory)
- `timezone`: (Optional) UTC offset in hours: number or string (e.g. `+9`, `-5`, `0`). Omit = system local
- `silent`: (Optional) Run in silent mode, suppressing console output
- `profile`: (Optional) Profile name to use (for workflows with profiles)

**Path Resolution:**
By default, relative workflow paths are resolved from the schedule file's directory. This means if your schedule file and workflow are in the same folder, you can simply use `./workflow.yaml`. Use `baseDir` to specify a different base directory if needed.

**JSON (`schedules.json`):**
```json
{
  "schedules": [
    {
      "name": "Daily Build",
      "cron": "0 9 * * *",
      "workflow": "./build.yaml"
    },
    {
      "name": "Nightly Test",
      "cron": "0 2 * * *",
      "workflow": "./test.yaml",
      "silent": true
    },
    {
      "name": "Production Deploy",
      "cron": "0 18 * * 5",
      "workflow": "./deploy.yaml",
      "profile": "Production"
    }
  ]
}
```

Then add all schedules from the file:

```bash
tp schedule add schedules.yaml
# Or, with no path: select a file from the nearest tp/schedules/ directory
tp schedule add
```

You'll be prompted to confirm or override the alias for each schedule. After adding, each added schedule is shown in the same card format as `tp schedule list` (cron, human-readable “when” description, next run, enabled state).

**Cron Expression Format:**

5 fields (standard) or **6 fields with seconds** (node-cron extension):

```
# 6 fields (optional seconds)
# ┌────────────── second (0-59, optional)
# │ ┌──────────── minute (0-59)
# │ │ ┌────────── hour (0-23)
# │ │ │ ┌──────── day of month (1-31)
# │ │ │ │ ┌────── month (1-12)
# │ │ │ │ │ ┌──── day of week (0-7)
# │ │ │ │ │ │
# * * * * * *
```

**Common Examples (5 fields):**
- `0 9 * * *` - Daily at 9:00 AM
- `0 0 * * 1` - Weekly on Monday at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1-5` - Weekdays at 9:00 AM

**With seconds (6 fields):**
- `* * * * * *` - Every second
- `*/5 * * * * *` - Every 5 seconds
- `0 * * * * *` - Every minute (same as `* * * * *`)

### Managing Schedules

```bash
# List all schedules (card layout: cron, "when" description, next run, etc.)
tp schedule list

# Remove a schedule (after removal, the removed schedule is shown in the same card format)
tp schedule remove

# Remove all schedules
tp schedule remove-all

# Enable/disable a schedule (after toggle, ENABLED/DISABLED is shown clearly in bold/color and the schedule card is displayed)
tp schedule toggle
```

**Unified schedule UI:** List, add, toggle, and remove all use the same schedule card layout. Each card shows the cron expression, a human-readable description of when it runs (e.g. “Every minute”), timezone, workflow path, profile if set, last run, and next run. After `tp schedule toggle`, the new state is emphasized (ENABLED in green or DISABLED in gray) so it’s obvious at a glance.

### Running the Scheduler

Start the scheduler to run workflows at their scheduled times. You can run it in two modes:

**Foreground Mode:**
```bash
tp schedule start
```
- Runs in the foreground (attached to your terminal)
- Press `Ctrl+C` to stop the scheduler
- Useful for testing or temporary scheduling

**Daemon Mode (Background):**
```bash
tp schedule start -d
```
- Runs as a background daemon process
- Continues running even after closing the terminal
- Only one daemon instance can run at a time (duplicate execution is prevented)
- Use `tp schedule stop` to stop the daemon

**Checking Daemon Status:**
```bash
tp schedule status      # Live view (updates every second); Ctrl+C exits the view only, daemon keeps running
tp schedule status -n   # Show status once and exit (no live refresh)
```
- Shows daemon and schedule status in a unified card layout (same as `tp schedule list` and `tp schedule start`)
- Displays: daemon state (active/inactive), PID, start time and uptime, all schedules with Enabled/Cron/Timezone/Workflow/Profile/Last run/Next run
- Press `Ctrl+C` to exit the status view (daemon continues running if it was started with `tp schedule start -d`)

The scheduler will:
- Execute workflows at their scheduled times
- Log all executions to `~/.pipeliner/workflow-history/`
- Prevent duplicate daemon instances (only one can run at a time)

### Schedule Storage

Schedules are stored in `~/.pipeliner/schedules/schedules.json`. Each schedule includes:
- Unique ID
- Workflow path
- Cron expression
- Enabled/disabled status
- Last execution time

All scheduled workflow executions are logged to the same history directory as manual runs (`~/.pipeliner/workflow-history/`), so you can review them using `tp history`.

---

## 📚 Examples

### Project Examples

Check out the `examples/` directory for complete project examples:

- **`tp setup`** – Run `tp setup` in your project root to generate `tp/workflows/` and `tp/schedules/` with two example workflows (choose, when, profiles, prompt) and two example schedule files (including profile usage). All steps use `echo` so you can run them safely and then replace with real commands.
- **`monorepo-example/`** - Monorepo workflow with multiple projects
- **`simple-project/`** - Simple single-project workflow
- **`react-app/`** - React application build and deployment

### YAML Examples

Check out `examples/yaml-examples/` for YAML workflow examples:

- **`basic.yaml`** - Basic workflow with choices and conditions
- **`simple.yaml`** - Minimal workflow example
- **`parallel.yaml`** - Parallel execution example
- **`conditions.yaml`** - Various condition types
- **`file-checks.yaml`** - File existence checks
- **`prompt.yaml`** - User input prompts
- **`variables.yaml`** - Variable substitution examples
- **`profiles-example.yaml`** - Profiles for non-interactive runs (`tp run --profile <name>`)

### JSON Examples

Check out `examples/json-examples/` for JSON workflow examples (equivalent to YAML examples):

- **`basic.json`** - Basic workflow with choices and conditions
- **`simple.json`** - Minimal workflow example
- **`parallel.json`** - Parallel execution example
- **`conditions.json`** - Condition evaluation examples
- **`prompt.json`** - User input prompts
- **`variables.json`** - Variable substitution examples
- **`profiles-example.json`** - Profiles for non-interactive runs (`tp run --profile <name>`)

**Note:** Both YAML and JSON formats are fully supported. Choose the format that fits your preference - YAML for readability, JSON for programmatic generation.
- **`variables.yaml`** - Variable usage examples
- **`prompt.yaml`** - Text prompt examples
- **`var-value-example.yaml`** - Variable value comparison examples
- **`choice-as-example.yaml`** - Using `as` keyword in choices
- **`base-dir-example.yaml`** - baseDir configuration example
- **`timeout-retry-example.yaml`** - Timeout and retry features
- **`cicd.yaml`** - CI/CD pipeline example
- **`advanced.yaml`** - Advanced workflow patterns
- **`multi-choice.yaml`** - Multiple sequential choices
- **`react.yaml`** - React-specific workflow

## 🏗️ Architecture

- **CLI**: Node.js + TypeScript with Commander.js
- **Task Execution**: Node.js child processes with streaming output
- **UI**: Boxen and Chalk for beautiful terminal output
- **Prompts**: Inquirer.js for interactive prompts

## 🤝 Contributing

Contributions are welcome! Please leave an ISSUE.

## 📄 License

Copyright (c) 2026 racgoo

## 📧 Contact

For inquiries, please email lhsung98@naver.com!
