# Schedule Examples

This directory contains example schedule files for `tp schedule add`.

## Schedule File Format

Schedule files define multiple workflow schedules in YAML or JSON format.

### YAML Format

```yaml
schedules:
  - name: Daily Build          # Schedule alias (for identification)
    cron: "0 9 * * *"          # Cron expression
    workflow: ./build.yaml     # Path relative to schedule file

  - name: Nightly Test
    cron: "0 2 * * *"
    workflow: ./test.yaml
    silent: true               # Optional: run in silent mode

  - name: Production Deploy
    cron: "0 18 * * 5"         # Every Friday at 6 PM
    workflow: ./deploy.yaml
    profile: Production        # Optional: use specific profile

  - name: Hourly Check
    cron: "0 * * * *"
    workflow: simple.yaml
    baseDir: /path/to/workflows  # Optional: base directory for workflow path
```

**Path Resolution:**
- By default, relative workflow paths are resolved from the **schedule file's directory**
- Use `baseDir` to specify a different base directory
- Absolute paths are used as-is

### JSON Format

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
|------------|-----------|----------|-----------------------------------------------------------------------------|
| `name`     | `string`  | Yes      | Schedule alias for identification                                           |
| `cron`     | `string`  | Yes      | Cron expression (e.g., "0 9 * * *")                                        |
| `workflow` | `string`  | Yes      | Path to workflow file (relative to schedule file or baseDir, or absolute)   |
| `baseDir`  | `string`  | No       | Base directory for workflow path (defaults to schedule file's directory)    |
| `timezone` | `string` or number | No | UTC offset in hours (e.g. +9, -5, 0). Omit = system local |
| `silent`   | `boolean` | No       | Run in silent mode (suppress console output)                                |
| `profile`  | `string`  | No       | Profile name to use (for workflows with profiles)                           |

## Adding Schedules

```bash
tp schedule add examples/schedule-examples/daily-build.yaml
```

You'll be prompted to confirm or override the alias for each schedule.

## Examples

- **`daily-build.yaml`** - YAML format with 3 schedules
- **`daily-build.json`** - JSON format with 3 schedules (same content)

## Cron Expression Format

5 fields (standard) or **6 fields with seconds** (supported by node-cron):

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

Common examples (5 fields):
- `0 9 * * *` - Daily at 9:00 AM
- `0 0 * * 1` - Weekly on Monday at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1-5` - Weekdays at 9:00 AM

With seconds (6 fields):
- `* * * * * *` - Every second
- `*/5 * * * * *` - Every 5 seconds
- `0 * * * * *` - Every minute

## Managing Schedules

After adding schedules:

```bash
tp schedule list        # View all schedules
tp schedule remove      # Remove a specific schedule
tp schedule remove-all  # Remove all schedules
tp schedule toggle      # Enable/disable a schedule
```

## Running the Scheduler

### Foreground Mode

```bash
tp schedule start       # Start the scheduler in foreground mode
```

- Runs in the foreground (attached to your terminal)
- Press `Ctrl+C` to stop the scheduler
- Useful for testing or temporary scheduling

### Daemon Mode (Background)

```bash
tp schedule start -d   # Start the scheduler daemon in background
```

- Runs as a background daemon process
- Continues running even after closing the terminal
- Only one daemon instance can run at a time (duplicate execution is prevented)
- Use `tp schedule stop` to stop the daemon

### Checking Daemon Status

```bash
tp schedule status     # Check daemon status (real-time mode)
```

- Shows real-time daemon status with systemctl-style display
- Displays daemon state, PID, start time, uptime, and all schedules
- Updates every second automatically
- Press `Ctrl+C` to exit (daemon continues running)

### Stopping the Daemon

```bash
tp schedule stop       # Stop the scheduler daemon
```

- Stops the running daemon process gracefully
- Removes PID and start time files
