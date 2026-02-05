# Workflow Scheduling

Schedule workflows to run automatically at specified times using cron expressions. Define schedules in a YAML or JSON file and add them with `tp schedule add`.

## Overview

- **Schedule file**: Define multiple schedules in one YAML or JSON file
- **Path resolution**: Workflow paths are relative to the schedule file's directory (or `baseDir`)
- **Timezone**: Optional `timezone` as UTC offset in hours (e.g. `+9`, `-5`, `0`). Omit = system local
- **Options**: Support `silent` mode and `profile` per schedule
- **Cron**: 5-field (minute granularity) or 6-field (second granularity) expressions

## Schedule File Format

### YAML Example

```yaml
schedules:
  - name: Daily Build
    cron: "0 9 * * *"
    workflow: ./build.yaml

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true

  - name: Production Deploy
    cron: "0 18 * * 5"
    workflow: ./deploy.yaml
    profile: Production

  - name: Hourly Check
    cron: "0 * * * *"
    workflow: simple.yaml
    baseDir: /path/to/workflows

  - name: Daily UTC
    cron: "0 9 * * *"
    workflow: ./daily.yaml
    timezone: UTC
```

### JSON Example

```json
{
  "schedules": [
    {
      "name": "Daily Build",
      "cron": "0 9 * * *",
      "workflow": "./build.yaml"
    },
    {
      "name": "Nightly Test",
      "cron": "0 2 * * *",
      "workflow": "./test.yaml",
      "silent": true
    },
    {
      "name": "Production Deploy",
      "cron": "0 18 * * 5",
      "workflow": "./deploy.yaml",
      "profile": "Production"
    }
  ]
}
```

## Field Reference

| Field      | Type      | Required | Description                                                                 |
| ---------- | --------- | -------- | -------------------------------------------------------------------------- |
| `name`     | `string`  | Yes      | Schedule alias for identification                                          |
| `cron`     | `string`  | Yes      | Cron expression (5 or 6 fields)                                            |
| `workflow` | `string`  | Yes      | Path to workflow file (relative to schedule file or `baseDir`, or absolute) |
| `baseDir`  | `string`  | No       | Base directory for workflow path (default: schedule file's directory)     |
| `timezone` | `string` or number | No | UTC offset in hours (e.g. `+9`, `-5`, `0`). Omit = system local |
| `silent`   | `boolean` | No       | Run in silent mode (suppress console output)                                |
| `profile`  | `string`  | No       | Profile name to use (for workflows with profiles)                           |

## Path Resolution

- **Relative paths** are resolved from the **schedule file's directory**. If your schedule file and workflow are in the same folder, use `./workflow.yaml`.
- Use **`baseDir`** to specify a different base directory for a schedule.
- **Absolute paths** are used as-is.

This way, `tp schedule add` works correctly regardless of where you run it from.

## Cron Expression Format

5 fields (standard) or **6 fields with seconds** (node-cron extension):

```
# 6 fields (optional second)
# ┌────────────── second (0-59, optional)
# │ ┌──────────── minute (0-59)
# │ │ ┌────────── hour (0-23)
# │ │ │ ┌──────── day of month (1-31)
# │ │ │ │ ┌────── month (1-12)
# │ │ │ │ │ ┌──── day of week (0-7)
# │ │ │ │ │ │
# * * * * * *
```

**Common examples (5 fields):**

- `0 9 * * *` - Daily at 9:00 AM
- `0 0 * * 1` - Weekly on Monday at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1-5` - Weekdays at 9:00 AM

**With seconds (6 fields):**

- `* * * * * *` - Every second
- `*/5 * * * * *` - Every 5 seconds
- `0 * * * * *` - Every minute (same as 5-field `* * * * *`)

## Adding Schedules

```bash
tp schedule add schedules.yaml
```

If you omit the file path, you'll be prompted to enter it. Each schedule's alias can be confirmed or overridden when adding.

## Managing Schedules

### List All Schedules

```bash
tp schedule list
# or
tp schedule ls
```

- Shows all schedules in a **unified card layout** (each card: name, active/inactive badge, Enabled, Cron with human-readable description, Timezone, Workflow path, Profile, Last run, Next run).
- The same card layout is used by `tp schedule status` and `tp schedule start`, so the UI is consistent everywhere.

### Remove a Schedule

```bash
tp schedule remove
# or
tp schedule rm
```

An interactive menu lets you select which schedule to remove.

### Remove All Schedules

```bash
tp schedule remove-all
```

A confirmation prompt is shown before removing all schedules.

### Enable or Disable a Schedule

```bash
tp schedule toggle
```

Select a schedule to toggle its enabled/disabled state.

## Running the Scheduler

Start the scheduler to run workflows at their scheduled times. You can run it in two modes:

### Foreground Mode

```bash
tp schedule start
```

- Runs in the foreground (attached to your terminal)
- Press `Ctrl+C` to stop the scheduler
- Useful for testing or temporary scheduling

### Daemon Mode (Background)

```bash
tp schedule start -d
```

- Runs as a background daemon process
- Continues running even after closing the terminal
- Only one daemon instance can run at a time (duplicate execution is prevented)
- Use `tp schedule stop` to stop the daemon

### Checking Daemon Status

```bash
tp schedule status      # Live view (updates every second); Ctrl+C exits the view only, daemon keeps running
tp schedule status -n   # Show status once and exit (no live refresh)
```

- Uses the **same card layout** as `tp schedule list` and `tp schedule start`: daemon state (active/inactive), PID, start time and uptime, then each schedule with Enabled, Cron (with human-readable description), Timezone, Workflow, Profile, Last run, Next run.
- Press `Ctrl+C` to exit the status view only; the daemon keeps running if it was started with `tp schedule start -d`.

### Stopping the Daemon

```bash
tp schedule stop
```

- Stops the running daemon process gracefully
- Removes PID and start time files

The scheduler will:

- Execute workflows at their scheduled times
- Apply `silent` and `profile` options per schedule
- Log executions to `~/.pipeliner/workflow-history/` (when not silent)
- Display real-time execution status (unless the schedule has `silent: true`)
- Prevent duplicate daemon instances (only one can run at a time)

## Storage

- **Schedules**: Stored in `~/.pipeliner/schedules/schedules.json`
- **Daemon PID**: Stored in `~/.pipeliner/daemon/scheduler.pid`
- **Daemon start time**: Stored in `~/.pipeliner/daemon/scheduler.started`

## Resetting Data (`tp clean`)

All schedule and daemon data lives under `~/.pipeliner`. To remove it:

```bash
tp clean
```

- Prompts for confirmation before deleting.
- If the scheduler daemon is running, it is stopped first, then the directory is removed.
- Removes: schedules, daemon state (PID, start time), and workflow execution history.

**When to use:** After upgrading to a new version, if you see compatibility issues (e.g. schedules or daemon not working correctly), run `tp clean` to reset local data and start fresh.

## Next Steps

- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Workflow syntax
- **[Profiles](/docs/dsl-reference/profiles)** - Using profiles with scheduled workflows
- **[History](/docs/history)** - Execution history
