# Getting Started

This guide is a step-by-step tutorial for first-time users of task-pipeliner.

## Installation

### Homebrew (macOS/Linux)

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

Verify installation:
```bash
task-pipeliner --version
# or
tp --version
```

**Updating:**
```bash
# Update Homebrew's package registry first
brew update

# Then upgrade task-pipeliner
brew upgrade task-pipeliner
```

If you see compatibility issues after an upgrade (e.g. schedules or daemon not working), run `tp clean` to reset `~/.pipeliner` data (schedules, daemon state, history). See [Workflow Scheduling](/docs/schedule#resetting-data-tp-clean) for details.

### Scoop (Windows)

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

Verify installation:
```bash
task-pipeliner --version
# or
tp --version
```

**Updating:** Refresh the bucket so Scoop sees the latest manifest, then update the app:
```bash
scoop update
scoop update task-pipeliner
```

If you see compatibility issues after an upgrade, run `tp clean` to reset `~/.pipeliner` data. See [Workflow Scheduling](/docs/schedule#resetting-data-tp-clean) for details.

### Global Installation (npm)

Install globally using npm to use `task-pipeliner` or `tp` commands directly:

```bash
npm install -g task-pipeliner
```

Or if using `pnpm`:

```bash
pnpm add -g task-pipeliner
```

After global installation, you can run:
```bash
task-pipeliner run workflow.yaml
# or use the short alias
tp run workflow.yaml
```

Verify installation:
```bash
task-pipeliner --version
# or
tp --version
```

### Project Installation (Development Mode)

Install as a devDependency to use with `npx`:

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

## Your First Workflow

Create a `workflow.yaml` or `workflow.json` file in your project root:

**YAML Format (`workflow.yaml`):**

```yaml
name: My First Workflow

steps:
  - run: 'echo "Hello, World!"'
  
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
    run: 'npm run build'
  
  - when:
      var:
        action: test
    run: 'npm test'
```

**JSON Format (`workflow.json`):**

```json
{
  "name": "My First Workflow",
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

**Project setup with `tp setup` (recommended for new projects):**

Run **`tp setup`** from your project root to create the recommended directory structure and example files in one step:

- **Directories:** `tp/`, `tp/workflows/`, `tp/schedules/`
- **Two example workflows** in `tp/workflows/` (echo-based): one with **choose** and **when**, one with **profiles**, **choose**, **prompt**, and **when**
- **Two example schedule files** in `tp/schedules/`: one with a single schedule, one with two schedules using **profile** (Dev/Prod)

Existing files are not overwritten. After running `tp setup`, use `tp run` to select from `tp/workflows/` and `tp schedule add` (no path) to select from `tp/schedules/`.

```bash
# From your project root
tp setup
tp run              # Select from tp/workflows/
tp schedule add     # Select from tp/schedules/
```

**Using the `tp` directory (recommended structure):**

The recommended layout uses two subdirectories under `tp`:

- **`tp/workflows/`** – Place all workflow files (`.yaml`, `.yml`, `.json`) here. When you run **`tp run`** without a file, task-pipeliner finds the nearest `tp` directory and lets you **select a workflow from `tp/workflows/`**.
- **`tp/schedules/`** – Place schedule files here. When you run **`tp schedule add`** without a file path, you can **select a schedule file from the nearest `tp/schedules/`** directory.

```bash
# Option 1: Use tp setup (creates tp/workflows and tp/schedules + examples)
tp setup

# Option 2: Create the structure manually
mkdir -p tp/workflows tp/schedules
mv workflow.yaml tp/workflows/

# Run without a file – interactive selection from tp/workflows
tp run
```

When you run `tp run` without a file:
1. The nearest `tp` directory is found (current directory or any parent).
2. All workflow files in **`tp/workflows/`** are listed.
3. An interactive, searchable menu is shown: type to filter, use arrow keys (↑↓) to move, Enter to select and run.

The menu displays both the filename and the workflow `name` from the YAML/JSON for easy identification.

**Silent Mode:**
The `--silent` (or `-s`) flag suppresses all console output during workflow execution. This is useful for CI/CD pipelines where you only need exit codes, or automated scripts that don't need verbose output.

## Understanding Workflow Structure

### Basic Structure

All workflow files follow this structure:

```yaml
name: Workflow Name                    # Optional: Display name for the workflow
baseDir: ./                            # Optional: Base directory for command execution

steps:                                 # Required: Array of steps to execute
  - run: 'echo "Step 1"'
  - run: 'echo "Step 2"'
```

### Steps

Each step can be one of the following:

- **`run`**: Execute shell commands
- **`choose`**: Display a selection menu to users
- **`prompt`**: Request text input from users
- **`parallel`**: Execute multiple steps in parallel
- **`fail`**: Intentionally fail the workflow

### Conditions

Use `when` clauses to specify execution conditions for steps:

```yaml
- when:
    file: ./dist
  run: 'echo "Build exists"'
```

## Practical Examples

### Example 1: Conditional Installation

```yaml
name: Conditional Install

steps:
  - when:
      not:
        file: ./node_modules
    run: 'npm install'
```

This workflow only runs `npm install` when the `node_modules` directory doesn't exist.

### Example 2: User Input

```yaml
name: User Input Example

steps:
  - prompt:
      message: "Enter version number:"
      as: version
      default: "1.0.0"
  
  - run: 'echo "Building version {{version}}"'
```

Store the user's input as a variable and use it in commands.

### Example 3: Parallel Execution

```yaml
name: Parallel Execution

steps:
  - parallel:
      - run: 'npm run test:unit'
      - run: 'npm run test:integration'
      - run: 'npm run lint'
```

Run multiple tests simultaneously to save time.

## Additional Commands

### Opening Resources

You can quickly open the visual generator or documentation in your browser:

```bash
tp open generator  # Open visual workflow generator
tp open docs       # Open documentation site
```

### Cleaning Data

If you encounter compatibility issues after upgrading (e.g. schedules or daemon not working), you can reset all local data:

```bash
tp clean
```

This command:
- Prompts for confirmation before deleting
- Stops the scheduler daemon if it's running
- Removes all data in `~/.pipeliner` (schedules, daemon state, workflow history)

**When to use:** After upgrading to a new version, if you see compatibility issues, run `tp clean` to reset local data and start fresh.

## Next Steps

- **[CLI Commands Reference](/docs/cli-reference)** - Complete reference for all CLI commands
- **[Workflow Structure](/docs/dsl-reference/workflow-structure)** - Understanding workflow file structure
- **[Step Types](/docs/dsl-reference/step-types)** - All available step types
- **[Conditions](/docs/dsl-reference/conditions)** - Conditional execution
- **[Variables](/docs/dsl-reference/variables)** - Using variables
- **[Execution History](/docs/history)** - Managing past execution records
- **[Examples](/docs/examples)** - More examples

