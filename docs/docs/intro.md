# Introduction to task-pipeliner

**Version:** 0.3.6

**task-pipeliner** is a modern workflow orchestration tool that lets you define, coordinate, and execute complex workflows using simple YAML or JSON files. Instead of complex build scripts or CI/CD configurations, you can orchestrate your entire workflow lifecycle using a simple and readable YAML or JSON syntax. *This project is still in beta; the interface may change slightly.*

## Why task-pipeliner?

### Problems with Existing Tools

- **Complex scripts**: Bash, Makefiles, etc. are difficult to maintain and have poor readability
- **Limited conditional logic**: Difficult to express complex conditional logic
- **Monotonous output**: Hard to understand execution status
- **Environment-specific branching**: Need to manage different scripts for each environment

### Advantages of task-pipeliner

- **Workflow orchestration**: Define, coordinate, and execute complex workflows with ease
- **Declarative syntax**: Define workflows clearly using YAML or JSON
- **Powerful conditional logic**: Branch based on file existence, variable values, and user input
- **Beautiful output**: Real-time terminal output with colors and formatting
- **Interactive execution**: Request user input and choices during execution
- **Profiles**: Run non-interactively with pre-set variables (`tp run --profile <name>`); skip choose/prompt when variables are set in the profile
- **Parallel processing**: Execute multiple tasks simultaneously to save time
- **Execution history**: Track and review past execution records
- **Workflow scheduling**: Run workflows on a schedule (cron) via schedule files (YAML/JSON)

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

- 💻 **[CLI Commands Reference](/docs/cli-reference)** - Complete reference for all CLI commands
  - **`tp setup`** - Create `tp/`, `tp/workflows/`, `tp/schedules/` and add example files (recommended for new projects)
  - `tp run` - Run workflows (no file = select from `tp/workflows/`)
  - `tp open generator/docs` - Open resources
  - `tp history` - Manage execution history
  - `tp schedule` - Schedule workflows with cron (`tp schedule add` with no path = select from `tp/schedules/`); list, add, toggle, and remove use a unified card UI
  - `tp clean` - Remove all local data

**README-Language-Map** [KR [한국어 버전]](https://github.com/racgoo/task-pipeliner/blob/main/README.ko.md) / [EN [English Version]](https://github.com/racgoo/task-pipeliner)

## Next Steps

- **[Getting Started](/docs/getting-started)** - From installation to your first workflow
- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Complete syntax guide
- **[Execution History](/docs/history)** - Manage past execution records
- **[Workflow Scheduling](/docs/schedule)** - Schedule workflows with cron
- **[Examples](/docs/examples)** - Real-world use cases and examples

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

## Community

- **GitHub**: [Project Repository](https://github.com/racgoo/task-pipeliner)
- **Issue Reports**: Please use GitHub Issues for bugs or feature suggestions
- **Contributions**: Pull Requests are welcome!

