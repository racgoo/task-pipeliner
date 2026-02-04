# Workflow Scheduling

Schedule workflows to run automatically at specified times using cron expressions. Define schedules in a YAML or JSON file and add them with `tp schedule add`.

## Overview

- **Schedule file**: Define multiple schedules in one YAML or JSON file
- **Path resolution**: Workflow paths are relative to the schedule file's directory (or `baseDir`)
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
| `silent`   | `boolean` | No       | Run in silent mode (suppress console output)                              |
| `profile`  | `string`  | No       | Profile name to use (for workflows with profiles)                         |

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
* * * * * *
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

Start the scheduler daemon so that workflows run at their scheduled times:

```bash
tp schedule start
```

The scheduler will:

- Run as a daemon process (stays running in the background)
- Execute workflows at their scheduled times
- Apply `silent` and `profile` options per schedule
- Log executions to `~/.pipeliner/workflow-history/` (when not silent)
- Display real-time execution status (unless the schedule has `silent: true`)

## Storage

Schedules are stored in `~/.pipeliner/schedules/schedules.json`.

## Next Steps

- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Workflow syntax
- **[Profiles](/docs/dsl-reference/profiles)** - Using profiles with scheduled workflows
- **[History](/docs/history)** - Execution history
