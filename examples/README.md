# Examples

This directory contains example workflows and projects demonstrating task-pipeliner.

## Quick Start Examples

### 0. tp setup (Recommended for New Projects)

Run **`tp setup`** from your project root to create the recommended directory structure and example files in one step:

- **Directories:** `tp/`, `tp/workflows/`, `tp/schedules/`
- **Two example workflows** in `tp/workflows/` (echo-based): one with **choose** and **when**, one with **profiles**, **choose**, **prompt**, and **when**
- **Two example schedule files** in `tp/schedules/`: one with a single schedule, one with two schedules using **profile** (Dev/Prod)

Existing files are not overwritten. See **`examples/tp-setup-example/`** for the exact structure and file contents that `tp setup` generates.

```bash
# From your project root
tp setup
tp run                    # Select from tp/workflows/
tp schedule add           # Select from tp/schedules/
```

**Location (reference):** `examples/tp-setup-example/` – browse the same layout and files that `tp setup` creates.

### 1. Simple Project
A minimal example with basic workflow features.

```bash
task-pipeliner run examples/simple-project/workflow.yaml
```

**Location**: `examples/simple-project/`

### 2. React App
A React application workflow with build and deployment.

```bash
task-pipeliner run examples/react-app/workflow.yaml
```

**Location**: `examples/react-app/`

### 3. Monorepo Example
A complete monorepo workflow with multiple projects.

```bash
task-pipeliner run examples/monorepo-example/workflow.yaml
```

**Location**: `examples/monorepo-example/`

### 4. tp Directory Example (Recommended Structure)

Uses the **recommended `tp` layout**: workflows in **`tp/workflows/`** and schedule files in **`tp/schedules/`**. Same idea as what `tp setup` creates.

```bash
cd examples/tp-directory-example
tp run                    # Interactive selection from tp/workflows/
tp schedule add           # Select a schedule file from tp/schedules/ (or pass path)
tp schedule list          # Card layout: cron, "when" description, next run, etc.
tp schedule toggle        # After toggle: ENABLED/DISABLED shown clearly; schedule card displayed
tp schedule remove        # After remove: removed schedule shown in same card format
```

**Location**: `examples/tp-directory-example/`

This example shows how to:
- Organize workflows in **`tp/workflows/`** and schedules in **`tp/schedules/`**
- Use **`tp run`** without a file (select from `tp/workflows/`)
- Use **`tp schedule add`** without a path (select from `tp/schedules/`)
- Use the unified schedule UI (list, add, toggle, remove all show the same card layout; toggle emphasizes ENABLED/DISABLED)

### 5. tp setup Example (Exact Layout from `tp setup`)

Contains the **exact structure and file contents** that **`tp setup`** generates: `tp/workflows/` with `example-hello.yaml` and `example-build.yaml`, and `tp/schedules/` with `example-daily.yaml` and `example-hourly.yaml`. Use as reference or copy; or run `tp setup` in your project to create the same layout.

**Location**: `examples/tp-setup-example/`

## YAML Examples

Simple YAML workflow files (no project structure) are in the `yaml-examples/` directory:
- **`basic.yaml`** - Basic workflow with choices and conditions
- **`parallel.yaml`** - Parallel execution (only `run`/`parallel`/`fail` allowed inside)
- **`prompt.yaml`** - User input prompts
- **`variables.yaml`** - Variable substitution
- **`conditions.yaml`** - Condition evaluation
- **`shell-example.yaml`** - Shell configuration (global and step-level)
- **`capture-example.yaml`** - Stdout capture: extract values from command output into variables (full, regex, JSON/YAML, KV, before/after/between, line strategies; use in later steps with `{{variable}}`)
- **`env-example.yaml`** - Load .env / command output into variables (runnable with echo or real file). Capture keys and use `{{variable}}` in later steps.
- And more...

See [yaml-examples/README.md](yaml-examples/README.md) for details.

## JSON Examples

JSON format workflow examples (equivalent to YAML examples) are in the `json-examples/` directory.

See [json-examples/README.md](json-examples/README.md) for details.

**Note:** task-pipeliner supports both YAML (`.yaml`, `.yml`) and JSON (`.json`) formats. The parser automatically detects the format based on file extension.

## Schedule Examples

Schedule file examples for `tp schedule add` are in the `schedule-examples/` directory:
- **`daily-build.yaml`** - YAML format with 3 schedules
- **`daily-build.json`** - JSON format with 3 schedules

See [schedule-examples/README.md](schedule-examples/README.md) for schedule file format and usage.

**Schedule UI (unified card layout):** After **add**, **toggle**, or **remove**, the affected schedule(s) are shown in the **same card format as `tp schedule list`** (cron, human “when” description, next run, enabled state). After **toggle**, **ENABLED** or **DISABLED** is emphasized (bold, colored). You can run **`tp schedule add`** without a path to select a file from the nearest **`tp/schedules/`** directory (e.g. after `tp setup`).

**Quick Start:**
```bash
# Add schedules (with path or, from a project with tp/schedules/, no path to select interactively)
tp schedule add examples/schedule-examples/daily-build.yaml
tp schedule add    # From a directory with tp/schedules/ – select file from tp/schedules/

# List schedules (card layout: cron, "when" description, next run, etc.)
tp schedule list

# Toggle / remove (after action, schedule shown in same card format; toggle shows ENABLED/DISABLED clearly)
tp schedule toggle
tp schedule remove

# Start scheduler in daemon mode (background)
tp schedule start -d

# Check daemon status (live; use -n to show once and exit)
tp schedule status
tp schedule status -n

# Stop daemon
tp schedule stop

# Reset all ~/.pipeliner data (schedules, daemon, history) — use after upgrade if you see compatibility issues
tp clean
```

## Running Examples

All examples can be run from the project root:

```bash
# From project root
task-pipeliner run examples/<example-name>/workflow.yaml
task-pipeliner run examples/json-examples/basic.json

# Or from example directory
cd examples/<example-name>
task-pipeliner run workflow.yaml
cd examples/json-examples
task-pipeliner run basic.json

# Run in silent mode (suppress all console output)
tp run examples/<example-name>/workflow.yaml --silent
# or use the short form
tp run examples/<example-name>/workflow.yaml -s

# Using tp directory (interactive selection from tp/workflows/)
cd examples/tp-directory-example
tp run  # Shows interactive menu with all workflows in tp/workflows/

# Add schedules from tp/schedules/ (no path = select from nearest tp/schedules/)
cd examples/tp-directory-example
tp schedule add   # Select a file from tp/schedules/
```

## Project Examples vs YAML Examples

- **Project Examples** (monorepo-example, simple-project, react-app, tp-directory-example, tp-setup-example):
  - **tp-directory-example** and **tp-setup-example** use the recommended **`tp/workflows/`** and **`tp/schedules/`** structure. Run **`tp run`** (no file) to select from `tp/workflows/`; run **`tp schedule add`** (no path) to select from `tp/schedules/`. **tp-setup-example** mirrors the exact layout and files that **`tp setup`** creates.
  - Other project examples include actual project files; commands run in workflow file's directory by default (same as schedule files).
  - `baseDir` is optional - use it to override the default directory.
  - Demonstrate real-world usage and can be executed immediately.

- **YAML Examples** (basic.yaml, simple.yaml, etc.):
  - Just workflow definitions
  - Commands run in current directory
  - Good for learning workflow syntax
  - Quick to test
  - **Parallel restriction:** Inside `parallel` blocks only `run`, nested `parallel`, and `fail` steps are allowed; `choose` and `prompt` cannot be used inside `parallel`.

## Execution History

All workflow executions are automatically recorded. You can view past executions using:

```bash
# View execution history (interactive menu)
tp history

# View specific history
tp history show

# Remove specific history
tp history remove

# Remove all histories
tp history remove-all
```

History files are stored in `~/.pipeliner/workflow-history/` with timestamped filenames. Each history contains:
- Execution timestamp
- Step-by-step results (success/failure)
- Command output (stdout/stderr)
- Execution duration for each step

For more details, see the [History Management documentation](https://task-pipeliner.racgoo.com/docs/history).

