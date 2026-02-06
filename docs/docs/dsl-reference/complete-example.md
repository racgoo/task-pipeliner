# Complete Example

A complete workflow example demonstrating all features.

## Example Workflow

This example demonstrates all major features of task-pipeliner:

```yaml
name: Complete Workflow Example
baseDir: ./

steps:
  # 1. Simple command
  - run: 'echo "Starting workflow..."'

  # 2. User choice with variable storage
  - choose:
      message: "Select deployment environment:"
      options:
        - id: dev
          label: "Development"
        - id: staging
          label: "Staging"
        - id: prod
          label: "Production"
      as: env

  # 3. Conditional step based on variable value
  - when:
      var:
        env: prod
    prompt:
      message: "Enter production deployment reason:"
      as: deployReason

  # 4. Variable value comparison
  - when:
      var:
        env: dev
    run: 'echo "Deploying to development..."'

  - when:
      var:
        env: staging
    run: 'echo "Deploying to staging..."'

  # 5. Complex condition (all)
  - when:
      all:
        - var:
            env: prod
        - var: deployReason
        - file: ./dist
    run: 'echo "Production deployment approved"'

  # 6. Parallel execution
  - parallel:
      - run: 'npm run test:unit'
      - run: 'npm run test:integration'
      - run: 'npm run lint'

  # 7. Error handling with onError (fallback) and continue
  - run: 'pnpm lint'
    continue: true
    onError:
      run: 'pnpm lint:fix'

  # 8. File existence check
  - when:
      file: ./test-results
    run: 'echo "Tests completed"'

  # 9. Combined condition (any)
  - when:
      any:
        - var:
            env: staging
        - var:
            env: prod
    run: 'echo "Deploying to server..."'

  # 10. Negation
  - when:
      not:
        file: ./dist
    fail:
      message: "Build output not found"

  # 11. Variable substitution
  - run: 'echo "Deploying {{projectName}} version {{version}} to {{env}}"'
```

## Features Demonstrated

This example uses the following features:

1. **Basic command execution** (`run`)
2. **User choice** (`choose`) - Variable storage (`as`)
3. **Conditional prompt** (`when` + `prompt`)
4. **Variable value comparison** (`var` object)
5. **Complex condition** (`all`)
6. **Parallel execution** (`parallel`)
7. **File existence check** (`file`)
8. **OR condition** (`any`)
9. **Negation condition** (`not`)
10. **Variable substitution** (`{{variable}}`)

## Execution

To run this workflow:

```bash
tp run complete-example.yaml
```

## Next Steps

- **[Examples](/docs/examples)** - More examples
- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Complete syntax guide

