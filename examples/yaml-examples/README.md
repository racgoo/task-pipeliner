# YAML Workflow Examples

This directory contains simple YAML workflow examples for learning task-pipeliner syntax.

These are workflow definitions only - no project files included.

## Examples

### Basic Examples

- **`basic.yaml`** - Basic workflow with choices and conditions
  - User choices
  - Conditional steps (`when` clauses)
  - File existence checks
  - Variable usage

- **`simple.yaml`** - Minimal workflow example
  - Simplest possible workflow
  - Good starting point for beginners

### Feature Examples

- **`prompt.yaml`** - User input examples
  - Text prompts
  - Default values
  - Variable storage

- **`variables.yaml`** - Variable substitution examples
  - Using `{{variable}}` syntax
  - Variables from prompts and choices
  - **⚠️ YAML Syntax:** When using `{{variable}}` with quotes and colons, wrap command in single quotes: `'echo "mode: {{var}}"'`

- **`parallel.yaml`** - Parallel execution examples
  - Running multiple steps simultaneously
  - Parallel build examples
  - **Note:** Only `run`, nested `parallel`, and `fail` steps are allowed inside `parallel`. `choose` and `prompt` (user input) cannot be used inside `parallel`.

- **`conditions.yaml`** - Condition evaluation examples
  - `when` clauses
  - File checks
  - Variable value comparison
  - Variable existence checks
  - Complex conditions (`all`, `any`, `not`)

- **`var-value-example.yaml`** - Variable value comparison examples
  - Using `var: { name: 'value' }` syntax
  - Comparing choice and prompt values
  - Multiple variable checks

- **`file-checks.yaml`** - File existence checks
  - Checking if files/directories exist
  - Conditional execution based on file presence

- **`timeout-retry-example.yaml`** - Timeout and retry features
  - Command timeout to prevent long-running commands
  - Automatic retry on failure with exponential backoff
  - Combining timeout and retry
  - Infinite retry with `retry: Infinity` (retry until success)

- **`pm2-like-example.yaml`** - PM2-like process manager using infinite retry
  - Auto-restart crashed servers and processes
  - Keep services running indefinitely
  - Database connection retry until successful
  - Graceful shutdown handling
  - Perfect for production services that need to stay alive

- **`multi-choice.yaml`** - Multiple choice steps
  - Sequential choices
  - Choice-based workflows

- **`searchable-choice-example.yaml`** - Real-time search in choice prompts
  - Demonstrates search functionality when you have many options
  - Type to filter options instantly
  - Arrow key navigation
  - Useful for long lists (countries, languages, frameworks, etc.)

- **`shell-example.yaml`** - Shell configuration examples
  - Global shell configuration for all steps
  - Step-level shell override
  - Login shell usage
  - Default: uses your current shell (`$SHELL`)

- **`shell-windows-example.yaml`** - Windows shell configuration examples
  - Windows Command Prompt (cmd.exe)
  - PowerShell and PowerShell Core (pwsh)
  - Git Bash on Windows
  - WSL (Windows Subsystem for Linux)
  - Cross-platform shell tips

- **`profiles-example.yaml`** - Profile-based non-interactive runs
  - Pre-defined variable sets for `tp run --profile <name>`
  - Skips choose/prompt when variable is set in the profile

- **`var-injection-example.yaml`** - CLI variable injection (`-v` / `--var`) and profile override
  - Inject variables from the command line: `-v key=value` or `--var key=value`
  - When both a profile and `-v` set the same variable, **the injected value wins** (CLI overrides profile)
  - Example: `tp run var-injection-example.yaml --profile Test` → mode=dev, label=test-label  
  - Override: `tp run var-injection-example.yaml --profile Test -v mode=staging -v label=from-cli` → mode=staging, label=from-cli (profile’s env=test unchanged)

### Advanced Examples

- **`advanced.yaml`** - Advanced workflow patterns
  - Complex condition logic
  - Nested parallel execution (only `run` / `parallel` / `fail` inside parallel)
  - Multiple sequential choices

- **`cicd.yaml`** - CI/CD workflow example
  - Build pipeline
  - Test execution
  - Deployment workflow

- **`react.yaml`** - React-specific workflow
  - React build and deployment
  - Environment-specific builds

- **`base-dir-example.yaml`** - baseDir configuration example
  - Setting working directory
  - Relative and absolute paths

- **`capture-example.yaml`** - Stdout capture examples
  - Full capture: Store entire stdout as string
  - Regex capture: Extract first capture group from regex match
  - JSON/YAML capture: Extract values using JSONPath expressions
  - KV capture: Extract values from key-value pairs (env style)
  - Before/After/Between capture: Extract text between markers
  - Line capture: Extract lines by range (1-based, inclusive)
  - Using captured values in subsequent steps

- **`env-example.yaml`** - Load env-style output into variables (runnable with echo; or use real `cat env`). Capture `TOP_SECRET` (or similar) and use `{{TOP_SECRET_VARIABLE}}` in the next step.

## Running Examples

From project root:

```bash
task-pipeliner run examples/yaml-examples/<example-name>.yaml
```

Or from this directory:

```bash
cd examples/yaml-examples
task-pipeliner run <example-name>.yaml
```

**Try the capture example** (extract values from command output into variables):

```bash
task-pipeliner run examples/yaml-examples/capture-example.yaml
# or: cd examples/yaml-examples && task-pipeliner run capture-example.yaml
```

**Try the env example** (load env-style content into variables, no file needed):

```bash
task-pipeliner run examples/yaml-examples/env-example.yaml
```

**Try variable injection** (`-v` overrides profile when both set the same variable):

```bash
# Profile only: mode=dev, label=test-label, env=test
task-pipeliner run examples/yaml-examples/var-injection-example.yaml --profile Test

# Profile + injection: injected values win for mode and label
task-pipeliner run examples/yaml-examples/var-injection-example.yaml --profile Test -v mode=staging -v label=from-cli
```

## Note

These examples run commands in the current working directory. For examples with actual project files, see the project examples in the parent directory:
- `monorepo-example/`
- `simple-project/`
- `react-app/`
- `tp-directory-example/` - Demonstrates using the `tp` directory feature

