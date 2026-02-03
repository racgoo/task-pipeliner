# Variables

Describes variable usage and substitution methods.

## Overview

Variables allow you to store user input or selected values and reuse them throughout your workflow.

## Creating Variables

Variables are created in the following steps:

### `prompt` Step

```yaml
- prompt:
    message: "Enter version number:"
    as: version
```

A variable is created with the name specified in the `as` field.

### `choose` Step

```yaml
- choose:
    message: "Select environment:"
    options:
      - id: dev
        label: "Development"
      - id: prod
        label: "Production"
    as: env
```

If the `as` field is provided, a variable is created with that name. If omitted, the selected option's `id` is used as the variable name.

## Variable Substitution

Variables can be used in commands using the `{{variableName}}` syntax.

### Syntax

```yaml
run: echo "{{variableName}}"
```

### Examples

```yaml
# Use prompt variable
- prompt:
    message: "Enter project name:"
    as: projectName
- run: echo "Building {{projectName}}..."

# Use choice variable
- choose:
    message: "Select environment:"
    options:
      - id: dev
        label: "Development"
    as: env
- run: echo "Deploying to {{env}}"

# Multiple variables
- run: echo "Building {{projectName}} version {{version}} for {{env}}"
```

## Variable Behavior

- Variables are replaced with their string values
- If variable doesn't exist, it's replaced with empty string
- Variables are resolved at execution time
- Variable names are case-sensitive

## Variable Usage Examples

### Basic Usage

```yaml
name: Variable Example

steps:
  - prompt:
      message: "Enter version number:"
      as: version
      default: "1.0.0"
  
  - run: echo "Building version {{version}}"
  
  - run: npm version {{version}}
```

### Conditional Variable Usage

```yaml
name: Conditional Variable

steps:
  - choose:
      message: "Select environment:"
      options:
        - id: dev
          label: "Development"
        - id: prod
          label: "Production"
      as: env
  
  - when:
      var:
        env: prod
    prompt:
      message: "Enter production deployment reason:"
      as: deployReason
  
  - run: echo "Deploying to {{env}}"
```

## Variables and Conditions

Variables can also be used in conditions:

```yaml
- prompt:
    message: "Enter version number:"
    as: version

# Check variable existence
- when:
    var: version
  run: echo "Version: {{version}}"

# Compare variable value
- when:
    var:
      version: "1.0.0"
  run: echo "Deploying stable version"
```

## Next Steps

- **[Complete Example](/docs/dsl-reference/complete-example)** - Example with all features

