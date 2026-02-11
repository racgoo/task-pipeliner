# Shell Configuration

You can control which shell runs your `run` commands by setting `shell` at the **workflow** level or per **step**. This is useful for using a specific shell (e.g. bash login shell), running on Windows with PowerShell, or mixing shells in one workflow.

## Where to set `shell`

- **Workflow level** (top of the file): applies to all `run` steps that do not define their own `shell`.
- **Step level** (on a `run` step): overrides the workflow `shell` for that step only.

**Priority:** Step-level `shell` > Workflow-level `shell` > Default (user's current shell).

## Format

`shell` is an array of strings: **`[program, ...args]`**.

- **First element**: the shell program (e.g. `bash`, `cmd.exe`, `powershell`).
- **Rest**: arguments passed to that program. The command you write in `run` is passed as the final argument (e.g. via `-c`, `/c`, `-Command`).

**YAML:**

```yaml
name: My Workflow

# Global: use for all run steps
shell: [bash, -lc]

steps:
  - run: 'echo "uses bash -lc"'
  - run: 'echo "uses PowerShell for this step only"'
    shell: [powershell, -Command]
```

**JSON:**

```json
{
  "name": "My Workflow",
  "shell": ["bash", "-lc"],
  "steps": [
    { "run": "echo \"uses bash -lc\"" },
    { "run": "echo \"PowerShell here\"", "shell": ["powershell", "-Command"] }
  ]
}
```

## Default when omitted

If you do not set `shell`:

- **Linux/macOS**: Uses the `$SHELL` environment variable (e.g. `/bin/zsh`, `/bin/bash`). Commands run in the same shell as where you executed `tp run`.
- **Windows**: Uses `cmd.exe` with `/c` if `SHELL` is not set; otherwise uses the program given by `SHELL`. So your `run` commands use the same environment as your terminal.

## Examples by platform

### Linux / macOS

```yaml
# Bash (login shell, loads .bash_profile etc.)
shell: [bash, -lc]

# Bash (non-login)
shell: [bash, -c]

# Zsh
shell: [zsh, -c]

# POSIX sh
shell: [sh, -c]

# Explicit path
shell: [/usr/bin/bash, -c]
```

### Windows

```yaml
# Command Prompt (cmd.exe)
shell: [cmd, /c]

# Windows PowerShell
shell: [powershell, -Command]

# PowerShell Core (pwsh)
shell: [pwsh, -Command]

# Git Bash on Windows
shell: [bash, -c]
```

### Cross-platform workflows

You can use a single workflow and set `shell` per step if you need different shells on different steps. For a workflow that runs on both Unix and Windows, you might use step-level `shell` so each step explicitly chooses `bash` or `cmd`/`powershell` as needed.

## Step-level override

A `run` step can override the workflow `shell`:

```yaml
shell: [bash, -lc]

steps:
  - run: 'npm run build'           # uses bash -lc
  - run: 'Write-Host "Done"'      # uses PowerShell for this step only
    shell: [powershell, -Command]
```

## Reference

| Level   | Field   | Type            | Description                                      |
|---------|---------|-----------------|--------------------------------------------------|
| Workflow| `shell` | `array` of `string` | Global shell for all `run` steps. Format: `[program, ...args]`. |
| Step    | `shell` | `array` of `string` | Shell for this `run` step only. Overrides workflow `shell`.     |

## See also

- [Workflow structure](/docs/dsl-reference/workflow-structure) - Top-level fields including `shell`
- [Step types – run](/docs/dsl-reference/step-types#1-run---execute-command) - `run` step syntax and options
- **Examples**: `shell-example.yaml`, `shell-windows-example.yaml` in the [YAML examples](/docs/examples#yaml-examples) (and equivalent JSON in `json-examples/`)
