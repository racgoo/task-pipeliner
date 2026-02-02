# task-pipeliner

> A powerful, condition-based task pipeline runner with beautiful CLI output

**Version:** 0.2.12

![fox2](https://github.com/user-attachments/assets/fdf8d786-6a91-4d2d-9dc1-72be6f3ccd98)

[![npm version](https://img.shields.io/npm/v/task-pipeliner)](https://www.npmjs.com/package/task-pipeliner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**task-pipeliner** is a modern workflow automation tool that lets you define complex task pipelines using simple YAML or JSON files. With conditional execution, parallel tasks, interactive prompts, and beautiful terminal output, it's perfect for build scripts, deployment workflows, and CI/CD pipelines.

**README-Language-Map** [KR [한국어 버전]](https://github.com/racgoo/task-pipeliner/blob/main/README.ko.md) / [EN [English Version]](https://github.com/racgoo/task-pipeliner)

## ✨ Features

-  **Condition-based execution** - Run steps based on file existence, user choices, environment variables, and more

- **Parallel execution** - Run multiple tasks simultaneously

- **Interactive prompts** - Ask users for input and choices during execution

- **YAML & JSON support** - Declarative pipelining in YAML & JSON formats

- **Variable substitution** - Use `{{variables}}` throughout your workflows

- **Execution history** - Track and review past workflow executions with detailed step-by-step records

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

**Run Workflows:**
```bash
tp run workflow.yaml        # Run a workflow
tp run                      # Select and run a workflow from nearest tp directory
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

For better organization, you can create a `tp` directory in your project and place all workflow files there. When you run `tp run` without specifying a file, task-pipeliner will automatically search for the nearest `tp` directory (starting from the current directory and traversing up) and let you select a workflow interactively.

```bash
# Create a tp directory and add workflow files
mkdir tp
mv workflow.yaml tp/

# Run without specifying a file - interactive selection
tp run
```

This will:
1. Find the nearest `tp` directory (current directory or any parent directory)
2. List all workflow files (`.yaml`, `.yml`, `.json`) in that directory
3. Show an interactive, searchable menu where you can:
   - Type to filter workflows in real-time
   - Use arrow keys (↑↓) to navigate
   - Press Enter to select and run

The interactive menu displays both the filename and the workflow's `name` (from the YAML/JSON content) for easy identification.

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
  retry?: <number>    # Optional: Number of retries on failure (default: 0)
  continue?: <bool>   # Optional: Continue to next step after this step completes (regardless of success/failure)
  onError?:            # Optional: Error handling behavior
    run: <command>     # Fallback command when main run command fails (side effect)
    timeout?: <number> # Optional: Timeout for this fallback command
    retry?: <number>   # Optional: Retry count for this fallback command
    onError?: ...      # Optional: Nested fallback (recursive onError chain)
```

**Properties:**
- `run` (required): `string` - Shell command to execute
- `when` (optional): `Condition` - Condition to check before execution
- `timeout` (optional): `number` - Maximum execution time in seconds. Command will be killed if it exceeds this time.
- `retry` (optional): `number` - Number of retry attempts if command fails (default: 0, meaning no retry)
- `continue` (optional): `boolean` - Controls whether to proceed to the next step after this step completes, regardless of success or failure.
  - `continue: true` - Always proceed to the next step (even if this step fails)
  - `continue: false` - Always stop the workflow after this step (even if this step succeeds)
  - `continue` not set (default) - Proceed on success, stop on failure
 - `onError.run` (optional): `string` - Fallback command executed when the main `run` command (after its retries) fails. **onError only performs side effects (e.g., cleanup, rollback) and does not affect the step's success/failure status.** If the main `run` fails, this step is considered failed regardless of onError execution.
 - `onError.timeout` (optional): `number` - Timeout for this fallback command.
 - `onError.retry` (optional): `number` - Retry count for this fallback command.

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
- `parallel` (required): `array` of `Step` objects - Steps to execute in parallel (same format as `steps`, each step starts with `-`)
- `when` (optional): `Condition` - Execute parallel block only if condition is met

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

# parallel can contain any step type (run, choose, prompt, etc.)
- parallel:
    - run: npm run test
    - choose:
        message: "Run lint?"
        options:
          - id: yes
            label: "Yes"
          - id: no
            label: "No"
        as: runLint
    - prompt:
        message: "Enter version:"
        as: version
```

**Behavior:**
- All steps in the `parallel` array start executing at the same time
- Workflow waits for all parallel steps to complete before continuing
- If any step fails, the workflow stops
- Each parallel branch has its own isolated workspace state (cloned)

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

Variables can be used in commands using the `{{variable}}` syntax.

**Syntax:**
```yaml
run: echo "{{variableName}}"
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

## 📚 Examples

### Project Examples

Check out the `examples/` directory for complete project examples:

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

### JSON Examples

Check out `examples/json-examples/` for JSON workflow examples (equivalent to YAML examples):

- **`basic.json`** - Basic workflow with choices and conditions
- **`simple.json`** - Minimal workflow example
- **`parallel.json`** - Parallel execution example
- **`conditions.json`** - Condition evaluation examples
- **`prompt.json`** - User input prompts
- **`variables.json`** - Variable substitution examples

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
