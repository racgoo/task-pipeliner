# Examples

This directory contains example workflows and projects demonstrating task-pipeliner.

## Quick Start Examples

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

### 4. tp Directory Example
Demonstrates using the `tp` directory feature for better workflow organization.

```bash
# From the example directory
cd examples/tp-directory-example
tp run  # Interactive selection from tp/ directory
```

**Location**: `examples/tp-directory-example/`

This example shows how to:
- Organize workflows in a `tp/` directory
- Use `tp run` without specifying a file
- Benefit from interactive, searchable workflow selection

## YAML Examples

Simple YAML workflow files (no project structure) are in the `yaml-examples/` directory:
- **`basic.yaml`** - Basic workflow with choices and conditions
- **`parallel.yaml`** - Parallel execution (only `run`/`parallel`/`fail` allowed inside)
- **`prompt.yaml`** - User input prompts
- **`variables.yaml`** - Variable substitution
- **`conditions.yaml`** - Condition evaluation
- **`shell-example.yaml`** - Shell configuration (global and step-level)
- And more...

See [yaml-examples/README.md](yaml-examples/README.md) for details.

## JSON Examples

JSON format workflow examples (equivalent to YAML examples) are in the `json-examples/` directory.

See [json-examples/README.md](json-examples/README.md) for details.

**Note:** task-pipeliner supports both YAML (`.yaml`, `.yml`) and JSON (`.json`) formats. The parser automatically detects the format based on file extension.

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

# Using tp directory (interactive selection)
cd examples/tp-directory-example
tp run  # Shows interactive menu with all workflows in tp/ directory
```

## Project Examples vs YAML Examples

- **Project Examples** (monorepo-example, simple-project, react-app):
  - Include actual project files
  - Use `baseDir` to run commands in project directory
  - Demonstrate real-world usage
  - Can be executed immediately

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

