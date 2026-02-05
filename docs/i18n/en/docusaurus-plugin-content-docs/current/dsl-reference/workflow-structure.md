# Workflow Structure

Describes the basic structure of workflow files.

## Workflow File Formats

task-pipeliner supports both YAML and JSON formats. Choose the format that suits your preference:

- **YAML**: Better readability, easier for humans to read and write
- **JSON**: Easier for programmatic generation

## Basic Structure

A workflow file is a YAML or JSON document with the following structure:

**YAML Format:**

```yaml
name: Workflow Name                    # Optional: Display name for the workflow
baseDir: ./                            # Optional: Base directory for command execution
                                      #   - Relative path: resolved from workflow file location
                                      #   - Absolute path: used as-is
                                      #   - If omitted: uses current working directory
profiles:                              # Optional: Pre-set variables for tp run --profile <name>
  - name: Test                         #   - name: profile name
    var:                               #   - var: key-value map (skips choose/prompt when variable is set)
      mode: "dev"
      label: "test-label"

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
                                       //   - Relative path: resolved from workflow file location
                                       //   - Absolute path: used as-is
                                       //   - If omitted: uses current working directory
  "profiles": [                        // Optional: Pre-set variables for tp run --profile <name>
    { "name": "Test", "var": { "mode": "dev", "label": "test-label" } }
  ],
  "steps": [                           // Required: Array of steps to execute
    { /* some-step-1 */ },
    { /* some-step-2 */ }
  ]
}
```

## Field Descriptions

### `name` (Optional)

- **Type**: `string`
- **Description**: Display name for the workflow
- **Example**: 
  ```yaml
  name: "Build and Deploy"
  ```

### `baseDir` (Optional)

- **Type**: `string` (relative or absolute path)
- **Description**: Base directory for all command executions
- **Resolution**:
  - **Relative path** (e.g., `./`, `../frontend`): Resolved relative to the workflow file's directory
  - **Absolute path** (e.g., `/home/user/project`): Used as-is
  - **If omitted**: Workflow file's directory is used (same as schedule files)
- **Example**:
  ```yaml
  baseDir: ./frontend        # Relative to workflow file
  baseDir: /app/frontend     # Absolute path
  # If omitted, commands run in the workflow file's directory
  ```

### `profiles` (Optional)

- **Type**: `array` of `{ name: string, var: object }`
- **Description**: Named sets of variables for non-interactive runs. Use with `tp run --profile <name>`.
- **Behavior**: When a profile is used, any **choose** or **prompt** step that stores into a variable already set in the profile is skipped; the profile value is used for `{{variable}}` substitution and conditions.
- **Example**:
  ```yaml
  profiles:
    - name: Test
      var:
        mode: "dev"
        label: "test-label"
  ```
  ```bash
  tp run workflow.yaml --profile Test
  ```

See the [Profiles](/docs/dsl-reference/profiles) documentation for full details and examples.

### `steps` (Required)

- **Type**: `array` of `Step` objects
- **Description**: List of steps to execute sequentially
- **Execution**: Steps run in order, one after another (unless parallel)
- **Minimum**: At least 1 step is required
- **Example**:
  ```yaml
  steps:
    - run: echo "Step 1"
    - run: echo "Step 2"
  ```

## Step Types

Each step in the `steps` array can be one of the following types:

1. **`run`** - Execute shell commands
2. **`choose`** - User selection menu
3. **`prompt`** - User text input
4. **`parallel`** - Parallel execution
5. **`fail`** - Workflow failure

See the [Step Types](/docs/dsl-reference/step-types) documentation for detailed descriptions of each step type.

## Conditional Execution

All steps can be executed conditionally using `when` clauses:

```yaml
steps:
  - when:
      file: ./package.json
    run: npm install
```

See the [Conditions](/docs/dsl-reference/conditions) documentation for detailed information about conditions.

## Error Handling (`run` failures and `onError`)

By default, if a `run` step fails (non-zero exit code) after all retries are exhausted, the workflow stops and the step is marked as failed.

You can override this behavior per step using the `onError` option on `run` steps:

```yaml
steps:
  - run: pnpm lint
    retry: 2
    continue: true       # Continue to next step regardless of success/failure
    onError:
      run: pnpm lint:fix   # Fallback command when lint fails (side effect only)
      retry: 1             # Retry for the fallback command
```

Key points:

- `onError` is evaluated only after the main `run` command (with its own `retry`) fails.
- `onError` only performs side effects (cleanup, rollback, logging) and does not affect the step's success/failure status.
- `onError` itself can contain another `onError`, forming a **recursive chain**:

  ```yaml
  - run: step1
    onError:
      run: step2
      onError:
        run: step3
  ```

  The step's success/failure is always determined by the main `run` command, not by any `onError` commands.

- The `continue` flag (at the `run` step level) controls workflow execution after this step:
  - `continue: true` - Always proceed to the next step (regardless of success/failure)
  - `continue: false` - Always stop the workflow (regardless of success/failure)
  - `continue` not set (default) - Proceed on success, stop on failure

See the [`run` step in Step Types](/docs/dsl-reference/step-types#1-run---execute-command) for full syntax and examples.

## Variable Substitution

Variables can be used in steps:

```yaml
steps:
  - prompt:
      message: "Enter version:"
      as: version
  - run: echo "Building {{version}}"
```

See the [Variables](/docs/dsl-reference/variables) documentation for detailed information about variables.

## Next Steps

- **[Step Types](/docs/dsl-reference/step-types)** - All available step types
- **[Conditions](/docs/dsl-reference/conditions)** - Conditional execution
- **[Variables](/docs/dsl-reference/variables)** - Using variables
- **[Profiles](/docs/dsl-reference/profiles)** - Non-interactive runs with pre-set variables
- **[Complete Example](/docs/dsl-reference/complete-example)** - Example with all features

