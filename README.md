# task-pipeliner

> A powerful workflow orchestration tool with condition-based execution and beautiful CLI output

**Version:** 0.3.6

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

**Schedule status (live view)** — `tp schedule status` shows the daemon and all schedules in a scrollable, auto-updating view. Cron times include timezone (UTC or local). Use ↑/↓ or PgUp/PgDn to scroll when there are many schedules.

<p align="center"><img src="https://github.com/user-attachments/assets/348325d3-d184-4c1e-bc78-040da13e7e7d" width="720" alt="tp schedule status live view" /></p>


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

Verify installation:
```bash
task-pipeliner --version
# or
tp --version
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

Verify installation:
```bash
task-pipeliner --version
# or
tp --version
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


## 🤝 Contributing

Contributions are welcome! Please leave an ISSUE.

## 📄 License

Copyright (c) 2026 racgoo

## 📧 Contact

For inquiries, please email lhsung98@naver.com!
