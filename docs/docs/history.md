# Execution History Management

task-pipeliner automatically records workflow execution history, allowing you to review past executions, debug issues, and track performance.

## Automatic History Storage

All workflow executions are automatically saved to `~/.pipeliner/workflow-history/`.

### Storage Location

- **Path**: `~/.pipeliner/workflow-history/`
- **Filename Format**: `workflow-YYYY-MM-DD_HH-mm-ss-<hash>.json`
  - Example: `workflow-2026-01-26_21-51-17-abc1.json`
- **Sorting**: Sorted by timestamp in descending order (newest first)

### History File Structure

Each history file has the following structure:

```json
{
  "initialTimestamp": 1706281877000,
  "records": [
    {
      "step": {
        "run": "npm install"
      },
      "context": {
        "workspace": {},
        "stepIndex": 0
      },
      "output": {
        "success": true,
        "stdout": ["...", "..."],
        "stderr": []
      },
      "duration": 1234,
      "status": "success"
    }
  ]
}
```

**Field Descriptions:**

- **`initialTimestamp`**: Workflow execution start time (Unix timestamp, milliseconds)
- **`records`**: Array of execution records for each step
  - **`step`**: Step definition that was executed
  - **`context`**: Execution context (workspace state, step index, etc.)
  - **`output`**: Command output
    - **`success`**: Success status (boolean)
    - **`stdout`**: Standard output (string array)
    - **`stderr`**: Standard error (string array)
  - **`duration`**: Execution time (milliseconds)
  - **`status`**: `"success"` or `"failure"`

## Viewing History

### Interactive Menu

```bash
tp history
```

This command displays an interactive menu:

```
? Select an action:
  ❯ Show - View and select a history to view
    Remove - Delete a specific history file
    Remove All - Delete all history files
```

### View Specific History

```bash
tp history show
```

This command:
1. Lists all available history files
2. Provides a menu to select one
3. Displays detailed execution information

**Example Output:**

```
┌─────────────────────────────────────────┐
│  Workflow Execution History             │
│                                         │
│  File: workflow-2026-01-26_21-51-17...  │
│  Started: 2026-01-26 21:51:17           │
│  Total Duration: 5.23s                  │
│  Total Steps: 3                         │
│  ✓ Successful: 2                        │
│  ✗ Failed: 1                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✓ Step 1/3 - Run                       │
│  Duration: 1.23s | Status: Success      │
│                                         │
│  Command: npm install                   │
└─────────────────────────────────────────┘
```

## Removing History

### Remove Specific History

```bash
tp history remove
```

This command:
1. Lists all history files
2. Provides a menu to select which one to delete
3. Deletes the selected history file

### Remove All Histories

```bash
tp history remove-all
```

This command removes all history files. A confirmation prompt is displayed:

```
? Are you sure you want to remove all histories?
  ❯ Yes, remove all
    No, cancel
```

To skip confirmation, use the `-y` flag:

```bash
tp history remove-all -y
```

## Use Cases

### Debugging

Review past execution records to understand why a workflow failed:

```bash
# Check recent execution history
tp history show

# Check stderr of failed steps
# Review Stderr section in history output
```

### Performance Analysis

Check execution time for each step to identify bottlenecks:

```bash
tp history show
# Check Duration field for each step's execution time
```

### Auditing

Maintain records of all workflow executions for auditing purposes.

## Direct File Access

If needed, you can read history files directly:

```bash
# Check history directory
ls ~/.pipeliner/workflow-history/

# Read a specific history file
cat ~/.pipeliner/workflow-history/workflow-2026-01-26_21-51-17-abc1.json
```

## Next Steps

- **[DSL Reference](/docs/dsl-reference/workflow-structure)** - Learn more about workflow syntax
- **[Examples](/docs/examples)** - See real-world use cases

