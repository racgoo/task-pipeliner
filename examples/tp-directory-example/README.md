# tp Directory Example (Recommended Structure)

This example uses the **recommended `tp` directory structure**: workflows in **`tp/workflows/`** and schedule files in **`tp/schedules/`**. This is the same layout that **`tp setup`** creates when you run it from your project root (see [tp-setup-example](../tp-setup-example/README.md) for the exact files `tp setup` generates).

## Recommended Structure: `tp/workflows/` and `tp/schedules/`

- **`tp/workflows/`** – Put all workflow files (`.yaml`, `.yml`, `.json`) here. When you run **`tp run`** without a file path, task-pipeliner finds the nearest `tp` directory and lets you **select a workflow from `tp/workflows/`**.
- **`tp/schedules/`** – Put all schedule files here. When you run **`tp schedule add`** without a file path, you can **select a schedule file from the nearest `tp/schedules/`** directory.

Schedule files reference workflows with relative paths (e.g. `../workflows/build.yaml` from inside `tp/schedules/`).

## Project Structure

```
tp-directory-example/
├── tp/
│   ├── workflows/
│   │   ├── build.yaml      # Build workflow
│   │   ├── test.yaml       # Test workflow
│   │   ├── deploy.yaml     # Deploy workflow (choose + when)
│   │   └── ci.yaml         # CI workflow (parallel)
│   └── schedules/
│       ├── example-daily.yaml   # Daily Build, Daily Test (cron)
│       └── example-ci.yaml     # Nightly CI, Friday Deploy
└── README.md
```

## Usage

### Run workflows (interactive selection from `tp/workflows/`)

```bash
# From example directory
cd examples/tp-directory-example
tp run
```

This shows an interactive menu with all workflows in **`tp/workflows/`**:
- `build.yaml - Build Project`
- `test.yaml - Run Tests`
- `deploy.yaml - Deploy Application`
- `ci.yaml - CI Pipeline`

You can type to filter, use arrow keys (↑↓) to move, and Enter to select and run.

### Run with explicit path

```bash
tp run tp/workflows/build.yaml
tp run tp/workflows/ci.yaml
```

### Add schedules (from `tp/schedules/` or by path)

```bash
# With path
tp schedule add tp/schedules/example-daily.yaml

# Without path: select from nearest tp/schedules/ directory
tp schedule add
```

After adding, **each added schedule is shown in the same card format as `tp schedule list`** (cron, human-readable “when” description, next run, enabled state).

### Schedule UI: list, toggle, remove

- **`tp schedule list`** – Each schedule is shown as a card (cron, “when” description, next run, etc.).
- **`tp schedule toggle`** – After toggling, **ENABLED** or **DISABLED** is shown clearly (bold, colored) and the schedule card is displayed.
- **`tp schedule remove`** – After removal, the **removed schedule is shown in the same card format** as list.

The same card layout is used by `tp schedule status` and `tp schedule start`, so the UI is consistent everywhere.

### Run from a subdirectory

```bash
cd examples/tp-directory-example/some-subdir
tp run
```

Task-pipeliner finds the `tp` directory in a parent and lists workflows from `tp/workflows/`.

## Quick setup in your own project

To get this structure without copying files by hand, run from your project root:

```bash
tp setup
```

This creates `tp/`, `tp/workflows/`, and `tp/schedules/` and adds two example workflows and two example schedule files (echo-based, with choose, when, profiles, prompt). It does not overwrite existing files. See [tp-setup-example](../tp-setup-example/README.md) for the exact contents.

## Workflow files

Each workflow in `tp/workflows/` should have a **`name`** field so the selection menu shows both filename and name (e.g. `build.yaml - Build Project`).
