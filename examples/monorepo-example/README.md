# Monorepo Example

This is a complete example demonstrating task-pipeliner with a real project structure.

## Project Structure

```
monorepo-example/
├── frontend/          # Frontend application
│   └── package.json
├── backend/           # Backend application
│   └── package.json
├── shared/            # Shared utilities
│   └── utils.js
├── workflow.yaml      # Workflow definition
└── README.md          # This file
```

## How to Run

From the project root directory:

```bash
task-pipeliner run examples/monorepo-example/workflow.yaml
```

Or from this directory:

```bash
cd examples/monorepo-example
task-pipeliner run workflow.yaml
```

## What This Workflow Does

1. **Environment Selection**: Choose dev, staging, or production
2. **Parallel Build**: Build frontend and backend simultaneously
3. **Build Verification**: Check that build outputs exist
4. **Testing**: Run tests (only for staging/production)
5. **Version Input**: Enter version number
6. **Deployment**: Deploy to selected environment
7. **Service Start**: Start frontend and backend services

## Features Demonstrated

- ✅ Default working directory (workflow file's directory - `baseDir` is optional)
- ✅ Parallel execution
- ✅ Conditional steps (`when` clauses)
- ✅ File existence checks
- ✅ User choices and prompts
- ✅ Variable substitution (`{{version}}`)

