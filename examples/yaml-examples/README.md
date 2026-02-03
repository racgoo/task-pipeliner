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

- **`multi-choice.yaml`** - Multiple choice steps
  - Sequential choices
  - Choice-based workflows

- **`searchable-choice-example.yaml`** - Real-time search in choice prompts
  - Demonstrates search functionality when you have many options
  - Type to filter options instantly
  - Arrow key navigation
  - Useful for long lists (countries, languages, frameworks, etc.)

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

## Note

These examples run commands in the current working directory. For examples with actual project files, see the project examples in the parent directory:
- `monorepo-example/`
- `simple-project/`
- `react-app/`
- `tp-directory-example/` - Demonstrates using the `tp` directory feature

