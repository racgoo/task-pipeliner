# Simple Project Example

A minimal example project demonstrating task-pipeliner basics.

## Project Structure

```
simple-project/
├── src/
│   └── index.js       # Source code
├── tests/
│   └── index.test.js  # Test file
├── package.json        # Project configuration
├── workflow.yaml       # Workflow definition
└── README.md          # This file
```

## How to Run

From the project root directory:

```bash
task-pipeliner run examples/simple-project/workflow.yaml
```

Or from this directory:

```bash
cd examples/simple-project
task-pipeliner run workflow.yaml
```

## What This Workflow Does

1. **Clean**: Remove old build files
2. **Lint**: Check code quality
3. **Test**: Run tests
4. **Build**: Build the project
5. **Verify**: Check build output exists
6. **Deploy**: Ask for confirmation and deploy

## Features Demonstrated

- ✅ Default working directory (workflow file's directory - `baseDir` is optional)
- ✅ Sequential step execution
- ✅ File existence checks
- ✅ User choices
- ✅ Conditional steps

