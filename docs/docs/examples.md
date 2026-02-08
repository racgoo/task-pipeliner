# Examples

Check out task-pipeliner usage examples.

## Project Examples

Check out the `examples/` directory for complete project examples:

### tp setup and tp directory structure {#tp-setup}

- **`tp setup`** – Run from your project root to create `tp/`, `tp/workflows/`, and `tp/schedules/` and add two example workflows (choose, when, profiles, prompt) and two example schedule files (including profile usage). All steps use `echo` so you can run safely and then replace with real commands. See [Getting Started](/docs/getting-started#project-setup-with-tp-setup-recommended-for-new-projects) and [CLI Reference](/docs/cli-reference#tp-setup).
- **`tp-setup-example/`** – The exact structure and file contents that `tp setup` generates; use as reference or copy.
- **`tp-directory-example/`** – Uses the recommended layout: **`tp/workflows/`** for workflow files and **`tp/schedules/`** for schedule files. Run `tp run` (no file) to select from `tp/workflows/`; run `tp schedule add` (no path) to select from `tp/schedules/`.

### Monorepo Example {#monorepo-example}

- **`monorepo-example/`** - Monorepo workflow with multiple projects

### Simple Project Example {#simple-project}

- **`simple-project/`** - Simple single-project workflow

### React App Example

- **`react-app/`** - React application build and deployment

## YAML Examples

Check out `examples/yaml-examples/` for YAML workflow examples:

- **`basic.yaml`** - Basic workflow with choices and conditions
- **`simple.yaml`** - Minimal workflow example
- **`parallel.yaml`** - Parallel execution example
- **`conditions.yaml`** - Various condition types
- **`file-checks.yaml`** - File existence checks
- **`prompt.yaml`** - User input prompts
- **`variables.yaml`** - Variable substitution examples
- **`var-value-example.yaml`** - Variable value comparison examples
- **`choice-as-example.yaml`** - Using `as` keyword in choices
- **`base-dir-example.yaml`** - baseDir configuration example
- **`timeout-retry-example.yaml`** - Timeout, retry, and onError error handling features
- **`pm2-like-example.yaml`** - PM2-like process manager using infinite retry to keep services running
- **`capture-example.yaml`** - Stdout capture examples
  - Extract values from command output using various capture strategies
  - Full, Regex, JSON/YAML, KV, Before/After/Between, and Line capture
  - Use captured values in subsequent steps

### CI/CD Pipeline {#cicd-pipeline}

- **`cicd.yaml`** - CI/CD pipeline example

- **`advanced.yaml`** - Advanced workflow patterns
- **`multi-choice.yaml`** - Multiple sequential choices
- **`react.yaml`** - React-specific workflow

## JSON Examples

Check out `examples/json-examples/` for JSON workflow examples (equivalent to YAML examples):

- **`basic.json`** - Basic workflow with choices and conditions
- **`simple.json`** - Minimal workflow example
- **`parallel.json`** - Parallel execution example
- **`conditions.json`** - Condition evaluation examples
- **`prompt.json`** - User input prompts
- **`variables.json`** - Variable substitution examples
- **`capture-example.json`** - Stdout capture examples (equivalent to YAML version)

**Note:** Both YAML and JSON formats are fully supported. Choose the format that fits your preference - YAML for readability, JSON for programmatic generation.

## Schedule Examples

Check out `examples/schedule-examples/` for schedule file examples. Use them with `tp schedule add <file>`, or run **`tp schedule add`** with no path to select a file from the nearest **`tp/schedules/`** directory (e.g. after `tp setup`).

- **`daily-build.yaml`** - YAML schedule file (multiple schedules, silent, profile, baseDir)
- **`daily-build.json`** - JSON schedule file (same content)
- **`README.md`** - Schedule file format and cron expression reference

**Schedule UI:** After **add**, **toggle**, or **remove**, the affected schedule(s) are shown in the **same card format as `tp schedule list`** (cron, human “when” description, next run, enabled state). After **toggle**, **ENABLED** or **DISABLED** is emphasized (bold, colored). See [Workflow Scheduling](/docs/schedule#unified-schedule-ui-list-add-toggle-remove) for details.

### Schedule File Example

```yaml
schedules:
  - name: Daily Build
    cron: "0 9 * * *"
    workflow: ./build.yaml

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true

  - name: Production Deploy
    cron: "0 18 * * 5"
    workflow: ./deploy.yaml
    profile: Production
```

Then run: `tp schedule add schedules.yaml` (or `tp schedule add` to select from `tp/schedules/`).

Use `tp schedule list` and `tp schedule status` (or `tp schedule status -n` to show once and exit) to view schedules in a unified card layout. After upgrading, if you see compatibility issues, run `tp clean` to reset `~/.pipeliner` data. See **[Workflow Scheduling](/docs/schedule)** for full documentation, including [Resetting Data (`tp clean`)](/docs/schedule#resetting-data-tp-clean).

## Quick Examples

### Basic Workflow

```yaml
name: Basic Workflow

steps:
  - run: 'echo "Hello, World!"'
```

### Conditional Execution

```yaml
name: Conditional Execution

steps:
  - when:
      file: ./package.json
    run: 'npm install'
  
  - when:
      not:
        file: ./dist
    run: 'npm run build'
```

### User Choice

```yaml
name: User Choice

steps:
  - choose:
      message: "Select environment:"
      options:
        - id: dev
          label: "Development"
        - id: staging
          label: "Staging"
        - id: prod
          label: "Production"
      as: env
  
  - when:
      var:
        env: prod
    run: 'echo "Deploying to production"'
```

### Variable Usage

```yaml
name: Variable Usage

steps:
  - prompt:
      message: "Enter version number:"
      as: version
      default: "1.0.0"
  
  - run: 'echo "Building version {{version}}"'
  
  - run: 'npm version {{version}}'
```

### Parallel Execution

```yaml
name: Parallel Execution

steps:
  - parallel:
      - run: 'npm run test:unit'
      - run: 'npm run test:integration'
      - run: 'npm run lint'
```

### Error Handling with onError

```yaml
name: Error Handling

steps:
  - run: 'pnpm lint'
    onError:
      run: 'pnpm lint:fix'
      continue: true
```

### Stdout Capture

```yaml
name: Capture Example

steps:
  # Extract values from command output
  - run: 'echo "channel=production user=admin"'
    captures:
      - regex: "channel=(\\S+)"
        as: channel
      - regex: "user=(\\S+)"
        as: user

  # Extract from JSON
  - run: 'echo "{\"version\":\"1.0.0\"}"'
    captures:
      - json: "$.version"
        as: version

  # Extract from .env style file
  - run: 'cat .env'
    captures:
      - kv: DATABASE_URL
        as: db_url

  # Use captured values
  - run: 'echo "Deploying {{version}} to {{channel}}"'
  - run: 'echo "DB: {{db_url}}"'
```

## Next Steps

- **[Getting Started](/docs/getting-started)** - From installation to your first workflow
- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Complete syntax guide
- **[Workflow Scheduling](/docs/schedule)** - Schedule workflows with cron

