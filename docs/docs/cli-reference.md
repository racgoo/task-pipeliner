# CLI Commands Reference

Complete reference for all task-pipeliner CLI commands.

## Project setup

### `tp setup`

Create the recommended `tp` directory structure and add example files (workflows and schedules) so you can get started quickly.

```bash
tp setup
```

**What it does:**
- Creates `tp/`, `tp/workflows/`, and `tp/schedules/` in the current directory (project root).
- Adds **two example workflows** in `tp/workflows/` (echo-based): one with choose and when, one with profiles, choose, prompt, and when.
- Adds **two example schedule files** in `tp/schedules/`: one with a single schedule, one with two schedules using profile (Dev/Prod).
- Does **not overwrite** existing files; if a directory or file already exists, it is left as-is.

**When to use:** Run from your project root when starting a new project or when you want the recommended layout. After `tp setup`, use `tp run` (no file) to select from `tp/workflows/` and `tp schedule add` (no path) to select from `tp/schedules/`. See [Getting Started](/docs/getting-started#project-setup-with-tp-setup-recommended-for-new-projects) for details.

## Run Workflows

### `tp run [file]`

Run a workflow from a YAML or JSON file.

```bash
tp run workflow.yaml        # Run a workflow
tp run                      # Select and run a workflow from nearest tp/workflows directory
tp run workflow.yaml --profile Test   # Run with profile (skip choose/prompt for variables set in profile)
tp run workflow.yaml -p Test         # Short form for profile
tp run workflow.yaml --silent  # Run in silent mode (suppress all console output)
tp run workflow.yaml -s     # Short form for silent mode
```

**Options:**
- `-p, --profile <name>` - Run with a profile (non-interactive mode)
- `-s, --silent` - Run in silent mode (suppress all console output)

**Behavior:**
- If no file is specified, searches for the nearest `tp` directory and lists workflows from **`tp/workflows/`**, then shows an interactive menu to select one.
- Profiles allow non-interactive execution by pre-filling variables.
- Silent mode suppresses all output (useful for CI/CD).

## Open Resources

### `tp open <target>`

Open generator or documentation website in your browser.

```bash
tp open generator  # Open visual workflow generator
tp open docs       # Open documentation site
```

**Targets:**
- `generator` - Opens the visual workflow generator (https://task-pipeliner-generator.racgoo.com/)
- `docs` - Opens the documentation site (https://task-pipeliner.racgoo.com/)

## History Management

### `tp history`

View and manage workflow execution history.

```bash
tp history         # Interactive menu to view/remove histories
tp history show    # Select and view a specific history
tp history remove   # Remove a specific history
tp history remove-all # Remove all histories
```

**Subcommands:**
- `show` - View a specific history file with detailed execution information
- `remove` - Delete a specific history file (interactive selection)
- `remove-all` - Delete all history files (with confirmation)

**Storage:** History files are stored in `~/.pipeliner/workflow-history/` with timestamped filenames.

## Workflow Scheduling

### `tp schedule`

View all schedules (same as `tp schedule list`).

```bash
tp schedule        # View all schedules
```

### `tp schedule list`

List all schedules with daemon status.

```bash
tp schedule list
# or
tp schedule ls
```

Shows all schedules in a unified card layout with status information.

### `tp schedule add [scheduleFile]`

Add schedules from a schedule file (YAML or JSON).

```bash
tp schedule add schedules.yaml   # With path
tp schedule add                  # No path: select from nearest tp/schedules/ directory
```

- If no file path is provided, task-pipeliner finds the nearest `tp` directory and lets you **select a schedule file from `tp/schedules/`**.
- Validates cron expressions and workflow file existence.
- Allows alias override for each schedule.
- **After adding**, each added schedule is shown in the **same card format as `tp schedule list`** (cron, human “when” description, next run, enabled state).

### `tp schedule remove`

Remove a specific schedule.

```bash
tp schedule remove
# or
tp schedule rm
```

Shows an interactive menu to select which schedule to remove. **After removal**, the removed schedule is displayed in the same card format as list.

### `tp schedule remove-all`

Remove all schedules.

```bash
tp schedule remove-all
```

Shows a confirmation prompt before removing all schedules.

### `tp schedule toggle`

Enable or disable a schedule.

```bash
tp schedule toggle
```

Shows an interactive menu to select which schedule to toggle. **After toggling**, the new state (**ENABLED** or **DISABLED**) is shown clearly (bold, colored), and the schedule card is displayed. This makes it obvious at a glance whether the schedule is now enabled or disabled.

### `tp schedule start`

Start the scheduler.

```bash
tp schedule start        # Start in foreground mode
tp schedule start -d     # Start in daemon mode (background)
```

**Options:**
- `-d, --daemon` - Run in background daemon mode

**Modes:**
- **Foreground mode**: Runs attached to terminal, press `Ctrl+C` to stop
- **Daemon mode**: Runs in background, continues after closing terminal

### `tp schedule stop`

Stop the scheduler daemon.

```bash
tp schedule stop
```

- Stops the running daemon process gracefully
- Removes PID and start time files

### `tp schedule status`

Check daemon and schedule status.

```bash
tp schedule status      # Live view (updates every second); Ctrl+C exits the view only, daemon keeps running
tp schedule status -n   # Show status once and exit (no live refresh)
```

**Options:**
- `-n, --no-follow` - Show status once and exit (no live refresh)

**Display:**
- Shows daemon state (active/inactive), PID, start time, uptime
- Lists all schedules with their status, cron, timezone, workflow, profile, last run, and next run
- Uses the same card layout as `tp schedule list` for consistency

## Data Management

### `tp clean`

Remove all data in `~/.pipeliner` (schedules, daemon state, workflow history).

```bash
tp clean
```

**What it removes:**
- All schedules (`~/.pipeliner/schedules/`)
- Daemon state (PID, start time) (`~/.pipeliner/daemon/`)
- Workflow execution history (`~/.pipeliner/workflow-history/`)

**Behavior:**
- Prompts for confirmation before deleting
- If the scheduler daemon is running, it is stopped first
- Then removes the entire `~/.pipeliner` directory

**When to use:**
- After upgrading to a new version, if you see compatibility issues (e.g. schedules or daemon not working correctly)
- To reset local data and start fresh

## Quick Reference

| Command | Description |
|---------|-------------|
| `tp setup` | Create tp/, tp/workflows, tp/schedules and example files |
| `tp run [file]` | Run a workflow (no file = select from tp/workflows/) |
| `tp run --profile <name>` | Run with profile (non-interactive) |
| `tp run --silent` | Run in silent mode |
| `tp open generator` | Open visual generator |
| `tp open docs` | Open documentation |
| `tp history` | View execution history |
| `tp schedule` | View all schedules |
| `tp schedule add [file]` | Add schedules (no file = select from tp/schedules/) |
| `tp schedule start -d` | Start daemon in background |
| `tp schedule stop` | Stop daemon |
| `tp schedule status` | Check daemon status |
| `tp clean` | Remove all local data |

## Storage Locations

All data is stored under `~/.pipeliner/`:

- **Schedules**: `~/.pipeliner/schedules/schedules.json`
- **Daemon PID**: `~/.pipeliner/daemon/scheduler.pid`
- **Daemon start time**: `~/.pipeliner/daemon/scheduler.started`
- **History**: `~/.pipeliner/workflow-history/`

## See Also

- **[Getting Started](/docs/getting-started)** - Installation and first workflow
- **[Workflow Scheduling](/docs/schedule)** - Detailed scheduling guide
- **[Execution History](/docs/history)** - History management details
- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Workflow syntax

