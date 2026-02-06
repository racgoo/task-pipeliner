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
    timezone: 0                   # UTC offset in hours. 0 = UTC, +9 = UTC+9, -5 = UTC-5
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

## Timezone

The **cron expression is interpreted in the given timezone**. Use the local time you want (hour/minute) in that timezone.

- **Korea (UTC+9), run at 11:33 AM every day:**
  ```yaml
  cron: '33 11 * * *'
  timezone: '9'
  ```
- **UTC+8, run at 12:33:** use `timezone: '8'` and `cron: '33 12 * * *'` (that is 13:33 in Korea).
- Omit `timezone` to use the server's local time.

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
# With file path
tp schedule add schedules.yaml

# Without path: select a schedule file from the nearest tp/schedules/ directory (e.g. after tp setup)
tp schedule add
```

If you omit the file path, task-pipeliner looks for the nearest `tp` directory and lets you **select a schedule file from `tp/schedules/`**. Each schedule's alias can be confirmed or overridden when adding. **After adding**, each added schedule is shown in the **same card format as `tp schedule list`**: cron expression, human-readable “when” description (e.g. “At 09:00”), next run, enabled state, workflow path, and profile if set.

## Managing Schedules

### Unified schedule UI (list, add, toggle, remove)

List, add, toggle, and remove all use the **same schedule card layout**. Each card shows:

- Cron expression and a **human-readable “when” description** (e.g. “Every minute”, “At 09:00”)
- Next run time, last run, timezone, workflow path, profile (if set)
- Enabled/disabled state

**After `tp schedule add`:** Each added schedule is displayed in this card format.  
**After `tp schedule toggle`:** The new state is **emphasized** (**ENABLED** in green or **DISABLED** in gray) so it’s obvious at a glance; the schedule card is then shown.  
**After `tp schedule remove`:** The removed schedule is shown in the same card format so you can see what was removed (cron, when it ran, etc.).

The same layout is used by `tp schedule status` and `tp schedule start`, so the UI is consistent everywhere.

### List All Schedules

```bash
tp schedule list
# or
tp schedule ls
```

Shows all schedules in the unified card layout (each card: name, active/inactive badge, Enabled, Cron with human-readable description, Timezone, Workflow path, Profile, Last run, Next run).

### Remove a Schedule

```bash
tp schedule remove
# or
tp schedule rm
```

An interactive menu lets you select which schedule to remove. **After removal**, the removed schedule is displayed in the same card format as list.

### Remove All Schedules

```bash
tp schedule remove-all
```

A confirmation prompt is shown before removing all schedules.

### Enable or Disable a Schedule

```bash
tp schedule toggle
```

Select a schedule to toggle its enabled/disabled state. **After toggling**, the new state (**ENABLED** or **DISABLED**) is shown clearly in bold and color, and the schedule card is displayed.

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

> 💡 **See also:** [CLI Commands Reference](/docs/cli-reference) for complete command documentation.

## Next Steps

- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Workflow syntax
- **[Profiles](/docs/dsl-reference/profiles)** - Using profiles with scheduled workflows
- **[History](/docs/history)** - Execution history
