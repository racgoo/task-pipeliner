# tp Directory Example

This example demonstrates how to use the `tp` directory feature for better workflow organization.

## What is the `tp` Directory?

The `tp` directory is a special directory where you can store all your workflow files. When you run `tp run` without specifying a file, task-pipeliner will automatically:

1. Search for the nearest `tp` directory (starting from current directory and traversing up)
2. List all workflow files (`.yaml`, `.yml`, `.json`) in that directory
3. Show an interactive, searchable menu to select and run a workflow

## Project Structure

```
tp-directory-example/
├── tp/
│   ├── build.yaml          # Build workflow
│   ├── test.yaml           # Test workflow
│   ├── deploy.yaml         # Deploy workflow
│   └── ci.yaml             # CI workflow
└── README.md
```

## Usage

### Method 1: Run from project root

```bash
# From project root
cd examples/tp-directory-example
tp run
```

This will show an interactive menu with all workflows in the `tp/` directory:
- `build.yaml - Build Project`
- `test.yaml - Run Tests`
- `deploy.yaml - Deploy Application`
- `ci.yaml - CI Pipeline`

You can:
- Type to filter workflows in real-time
- Use arrow keys (↑↓) to navigate
- Press Enter to select and run

### Method 2: Run from subdirectory

```bash
# From any subdirectory
cd examples/tp-directory-example/src
tp run
```

Even from a subdirectory, task-pipeliner will find the `tp` directory in the parent and show the same menu.

### Method 3: Still works with explicit file path

```bash
# Explicit file path still works
tp run tp/build.yaml
```

## Benefits

- **Better organization**: All workflows in one place
- **Quick access**: No need to remember exact file paths
- **Interactive selection**: See workflow names and descriptions
- **Search functionality**: Filter workflows by typing
- **Works from anywhere**: Automatically finds the nearest `tp` directory

## Workflow Files

Each workflow file in the `tp/` directory should have a `name` field for better identification:

```yaml
name: Build Project  # This name appears in the selection menu

steps:
  - run: npm run build
```

The selection menu displays: `build.yaml - Build Project`

