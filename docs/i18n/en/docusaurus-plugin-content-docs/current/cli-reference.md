# CLI Commands Reference

Complete reference for all task-pipeliner CLI commands.

## Run Workflows

### `tp run [file]`

Run a workflow from a YAML or JSON file.

```bash
tp run workflow.yaml        # Run a workflow
tp run                      # Select and run a workflow from nearest tp directory
tp run workflow.yaml --profile Test   # Run with profile (skip choose/prompt for variables set in profile)
tp run workflow.yaml -p Test         # Short form for profile
tp run workflow.yaml -v version=1.0.0 -v env=prod   # Inject variables (key=value); overrides profile when same key
tp run workflow.yaml --profile Test -v mode=staging   # Profile + injection: injected values win for same key
tp run workflow.yaml --silent  # Run in silent mode (suppress all console output)
tp run workflow.yaml -s     # Short form for silent mode
```

**Options:**
- `-p, --profile <name>` - Run with a profile (non-interactive mode)
- `-v, --var <key=value>` - Inject variables from the CLI. Can be passed multiple times (e.g. `-v a=1 -v b=2`). When both a profile and `-v` set the same variable, **the injected value wins**.
- `-s, --silent` - Run in silent mode (suppress all console output)

**Behavior:**
- If no file is specified, searches for the nearest `tp` directory and shows an interactive menu
- Profiles allow non-interactive execution by pre-filling variables
- **Variable injection** (`-v` / `--var`): You can pass `key=value` pairs to set variables without prompts. Injected variables override profile variables when the same key is set in both. Use single `-v` per pair (e.g. `-v version=1.0.0 -v env=prod`).
- Silent mode suppresses all output (useful for CI/CD)

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
tp schedule add schedules.yaml
```

- Prompts for file path if not provided
- Validates cron expressions and workflow file existence
- Allows alias override for each schedule

### `tp schedule remove`

Remove a specific schedule.

```bash
tp schedule remove
# or
tp schedule rm
```

Shows an interactive menu to select which schedule to remove.

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

Shows an interactive menu to select which schedule to toggle.

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
| `tp run [file]` | Run a workflow |
| `tp run --profile <name>` | Run with profile (non-interactive) |
| `tp run -v key=value` | Inject variables; overrides profile for same key |
| `tp run --silent` | Run in silent mode |
| `tp open generator` | Open visual generator |
| `tp open docs` | Open documentation |
| `tp history` | View execution history |
| `tp schedule` | View all schedules |
| `tp schedule add <file>` | Add schedules from file |
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

