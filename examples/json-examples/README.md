# JSON Examples

This directory contains JSON format workflow examples. All examples are equivalent to their YAML counterparts in the `yaml-examples/` directory.

## Running JSON Examples

```bash
# From project root
task-pipeliner run examples/json-examples/basic.json

# Or from examples directory
cd examples/json-examples
task-pipeliner run basic.json
```

## Available Examples

### Basic Examples

- **basic.json** - Basic workflow with choose, when conditions, and prompts
- **simple.json** - Minimal workflow example with basic features

### Feature Examples

- **parallel.json** - Parallel execution example
- **conditions.json** - All condition types (var, file, all, any, not)
- **prompt.json** - User input prompts with defaults
- **variables.json** - Variable usage and substitution examples
- **var-value-example.json** - Variable value comparison examples
- **choice-as-example.json** - Using 'as' keyword in choose steps
- **file-checks.json** - File existence check examples
- **timeout-retry-example.json** - Timeout and retry features
- **multi-choice.json** - Multiple sequential choice steps
- **searchable-choice-example.json** - Real-time search in choice prompts
  - Demonstrates search functionality when you have many options
  - Type to filter options instantly
  - Arrow key navigation
  - Useful for long lists (countries, languages, frameworks, etc.)

### Advanced Examples

- **advanced.json** - Advanced workflow patterns with complex logic
- **cicd.json** - CI/CD pipeline example
- **react.json** - React-specific build and deployment workflow
- **base-dir-example.json** - baseDir configuration example

## YAML vs JSON

Both formats are fully supported and functionally equivalent. Choose the format that fits your preference:

- **YAML**: More human-readable, better for documentation
- **JSON**: More structured, easier to generate programmatically

## Format Support

task-pipeliner supports both YAML (`.yaml`, `.yml`) and JSON (`.json`) formats. The parser automatically detects the format based on file extension.

