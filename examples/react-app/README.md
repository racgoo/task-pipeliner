# React App Example

A React application example demonstrating task-pipeliner with a real project structure.

## Project Structure

```
react-app/
├── src/
│   └── App.js         # React component
├── public/
│   └── index.html     # HTML template
├── package.json        # Project configuration
├── workflow.yaml       # Workflow definition
└── README.md          # This file
```

## How to Run

From the project root directory:

```bash
task-pipeliner run examples/react-app/workflow.yaml
```

Or from this directory:

```bash
cd examples/react-app
task-pipeliner run workflow.yaml
```

## What This Workflow Does

1. **Install**: Install dependencies
2. **Test**: Run tests
3. **Build Type**: Choose development or production build
4. **Build**: Build the React app
5. **Verify**: Check build output
6. **Deploy**: Enter deployment URL and deploy
7. **Start Server**: Optionally start dev server

## Features Demonstrated

- ✅ Default working directory (workflow file's directory - `baseDir` is optional)
- ✅ Conditional builds
- ✅ User prompts with defaults
- ✅ File existence checks
- ✅ Variable substitution

