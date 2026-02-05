# Introduction to task-pipeliner

**task-pipeliner** is a modern workflow automation tool that lets you define complex task pipelines using simple YAML or JSON files. Instead of complex build scripts or CI/CD configurations, you can write workflows using a simple and readable YAML or JSON syntax.

## Why task-pipeliner?

### Problems with Existing Tools

- **Complex scripts**: Bash, Makefiles, etc. are difficult to maintain and have poor readability
- **Limited conditional logic**: Difficult to express complex conditional logic
- **Monotonous output**: Hard to understand execution status
- **Environment-specific branching**: Need to manage different scripts for each environment

### Advantages of task-pipeliner

- **Declarative syntax**: Define workflows clearly using YAML or JSON
- **Powerful conditional logic**: Branch based on file existence, variable values, and user input
- **Beautiful output**: Real-time terminal output with colors and formatting
- **Interactive execution**: Request user input and choices during execution
- **Profiles**: Run non-interactively with pre-set variables (`tp run --profile <name>`); skip choose/prompt when variables are set in the profile
- **Parallel processing**: Execute multiple tasks simultaneously to save time
- **Execution history**: Track and review past execution records

## Quick Start

### Installation

#### Global Installation

Install globally to use `task-pipeliner` or `tp` commands directly:

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

### Your First Workflow

Create a `workflow.yaml` or `workflow.json` file:

**YAML Format (`workflow.yaml`):**

```yaml
name: My First Workflow

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

# Run with a profile (skip choose/prompt for variables set in the profile)
tp run workflow.yaml --profile Test
# or use the short form
tp run workflow.yaml -p Test

# Run in silent mode (suppress all console output)
tp run workflow.yaml --silent
# or use the short form
tp run workflow.yaml -s
```

## Core Concepts

### Workflow

A workflow is a task pipeline composed of multiple steps. Each step executes sequentially, and execution can be controlled by conditions.

### Steps

- **`run`**: Execute shell commands
- **`choose`**: Display a selection menu to users
- **`prompt`**: Request text input from users
- **`parallel`**: Execute multiple steps in parallel
- **`fail`**: Intentionally fail the workflow

### Conditions

Use `when` clauses to specify execution conditions for steps:

- **File existence**: `file: ./dist`
- **Variable value comparison**: `var: { env: 'prod' }`
- **Variable existence**: `var: 'version'` or `has: 'version'`
- **Choice check**: `choice: 'optionId'`
- **Logical operations**: `all`, `any`, `not`

### Variables

Store user input or selected values as variables and use them in commands with the `{{variable}}` syntax.

### Profiles

Define named sets of variables in your workflow and run with `tp run --profile <name>`. Choose and prompt steps for those variables are skipped, so you can run the same workflow non-interactively (e.g. in CI).

### Execution History

All workflow executions are automatically recorded and saved to `~/.pipeliner/workflow-history/`. You can review past executions and debug issues.

## Tools

- 🎨 **[Visual Generator](https://task-pipeliner-generator.racgoo.com/)** - Create workflows visually in your browser and download as YAML/JSON
- 💻 **CLI Commands**: 
  - `tp open generator` - Open generator
  - `tp open docs` - Open documentation
  - `tp history` - Manage execution history
  - `tp schedule add/list/start/status` - Schedule workflows with cron; `tp schedule status -n` shows status once and exits
  - `tp clean` - Remove all `~/.pipeliner` data (schedules, daemon, history); recommended after upgrading if you see compatibility issues

## Next Steps

- **[Getting Started](/docs/getting-started)** - From installation to your first workflow
- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Complete syntax guide
- **[Execution History](/docs/history)** - Manage past execution records
- **[Examples](/docs/examples)** - Real-world use cases and examples

## Community

- **GitHub**: [Project Repository](https://github.com/racgoo/task-pipeliner)
- **Issue Reports**: Please use GitHub Issues for bugs or feature suggestions
- **Contributions**: Pull Requests are welcome!

