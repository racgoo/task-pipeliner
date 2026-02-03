# Conditions

Describes how to use `when` clauses for conditional execution.

## Overview

Conditions control when steps execute. All conditions are evaluated as questions about the workspace state.

## Condition Types

### 1. File Existence (`file`)

Check if a file or directory exists.

#### Syntax

```yaml
when:
  file: <path>
```

#### Properties

- `file`: `string` - File or directory path (relative to current working directory)

#### Examples

```yaml
- when:
    file: ./dist
  run: echo "Build exists"

- when:
    not:
      file: ./node_modules
  run: npm install
```

---

### 2. Variable Value Comparison (`var` object)

Check if a variable equals a specific value.

#### Syntax

```yaml
when:
  var:
    <variable-name>: <expected-value>
```

#### Properties

- `var`: `object` - Object with variable name as key and expected value as value

#### Examples

```yaml
# Check if env variable equals 'prod'
- when:
    var:
      env: prod
  run: echo "Deploying to production"

# Multiple variable checks (all must match)
- when:
    var:
      env: staging
      version: "2.0.0"
  run: echo "Deploying v2.0.0 to staging"
```

---

### 3. Variable Existence (`var` string or `has`)

Check if a variable exists (regardless of value).

#### Syntax

```yaml
when:
  var: <variable-name>
# or
when:
  has: <variable-name>  # Alias for var
```

#### Examples

```yaml
# Check if variable exists
- when:
    var: version
  run: echo "Version: {{version}}"

# Use 'has' alias
- when:
    has: projectName
  run: echo "Project: {{projectName}}"
```

---

### 4. Combined Conditions

Combine multiple conditions using `all`, `any`, and `not`.

#### `all` - AND Logic

All conditions must be true.

```yaml
when:
  all:
    - <condition1>
    - <condition2>
    - <condition3>
```

#### `any` - OR Logic

Any condition can be true.

```yaml
when:
  any:
    - <condition1>
    - <condition2>
    - <condition3>
```

#### `not` - Negation

Negate a condition.

```yaml
when:
  not:
    <condition>
```

---

### 5. Nested Conditions

Nest conditions to create complex logic.

#### Examples

```yaml
# Complex nested condition
- when:
    all:
      - file: ./dist
      - any:
          - var:
              env: staging
          - var:
              env: production
      - not:
          var:
            version: "0.0.0"
  run: echo "Ready to deploy"
```

---

## Next Steps

- **[Variables](/docs/dsl-reference/variables)** - Using variables
- **[Complete Example](/docs/dsl-reference/complete-example)** - Example with all features

