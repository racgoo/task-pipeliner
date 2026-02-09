# Stdout capture (`captures`)

The `captures` option is used with **`run`** steps to extract values from command stdout and store them as variables. You can then use those variables in later steps with `{{variableName}}` or in conditions.

## Overview

- **Where**: Only on `run` steps, as an optional `captures` array.
- **Input**: The stdout of the command (as lines, joined for some strategies).
- **Output**: Each capture defines a strategy and an `as` variable name. On success, the extracted string is stored; on failure (no match or parse error), that variable is not set and the workflow continues.
- **Multiple captures**: You can list several captures in one step; each is applied in order. Later steps can use any variable that was successfully set.

## When stdout is captured

When a `run` step has at least one `captures` entry, stdout is **buffered** (not streamed line-by-line) so it can be parsed after the command finishes. The buffered output is then shown in the same box style as normal execution.

## Capture strategies

### Full capture

Store the entire stdout as a single string (no filtering).

| Field | Required | Description |
|-------|----------|-------------|
| `as`  | Yes      | Variable name to store the full stdout |

```yaml
- run: 'cat config.txt'
  captures:
    - as: config_content
```

### Regex capture

Extract the **first capture group** from a regex match against the full stdout (single string). The regex must have at least one capturing group `(...)`; the first group’s value is stored.

| Field   | Required | Description |
|---------|----------|-------------|
| `regex` | Yes      | JavaScript-style regex; first capture group is used |
| `as`    | Yes      | Variable name for the extracted value |

```yaml
- run: 'echo "channel=production user=admin"'
  captures:
    - regex: "channel=(\\S+)"
      as: channel
    - regex: "user=(\\S+)"
      as: user
```

### JSON capture

Parse stdout as JSON and extract a value using a **JSONPath** expression. If the path returns multiple values, the first is used. Non-string values are JSON-stringified.

| Field  | Required | Description |
|--------|----------|-------------|
| `json` | Yes      | JSONPath expression (e.g. `$.version`, `$.meta.channel`) |
| `as`   | Yes      | Variable name for the extracted value |

```yaml
- run: 'echo "{\"meta\":{\"version\":\"1.0.0\"}}"'
  captures:
    - json: "$.meta.version"
      as: version
```

### YAML capture

Parse stdout as YAML and extract a value using a **JSONPath** expression (same as JSON). Both `yaml` and `yml` keys are supported.

| Field  | Required | Description |
|--------|----------|-------------|
| `yaml` or `yml` | Yes | JSONPath expression on the parsed YAML |
| `as`   | Yes      | Variable name for the extracted value |

```yaml
- run: |
    echo "meta:"
    echo "  version: 1.0.0"
  captures:
    - yaml: "$.meta.version"
      as: version
```

### KV (key-value) capture

Extract the value for a given key from `.env`-style lines: `KEY=value` or `KEY = value`. Comments and empty lines are skipped. The key must match exactly (no prefix match). Values may be quoted; quotes are stripped.

| Field | Required | Description |
|-------|----------|-------------|
| `kv`  | Yes      | Exact key name (e.g. `DATABASE_URL`) |
| `as`  | Yes      | Variable name for the value |

```yaml
- run: 'cat .env'
  captures:
    - kv: DATABASE_URL
      as: db_url
    - kv: API_KEY
      as: api_key
```

### After / Before / Between capture

Extract text **after** a marker, **before** a marker, or **between** two markers. The search is on the full stdout string. Extracted text is trimmed.

| Field    | Required | Description |
|----------|----------|-------------|
| `after`  | For “after” or “between” | Start extracting after this string |
| `before` | For “before” or “between” | Stop extracting before this string (or use end of output for “after” only) |
| `as`     | Yes      | Variable name for the extracted text |

```yaml
# After marker
- run: 'echo "prefix value suffix"'
  captures:
    - after: "prefix "
      as: after_value

# Before marker
- run: 'echo "content before end"'
  captures:
    - before: " end"
      as: before_value

# Between markers
- run: 'echo "start:middle content:end"'
  captures:
    - after: "start:"
      before: ":end"
      as: between_value
```

### Line capture

Extract a range of lines from stdout. Line numbers are **1-based** and **inclusive** (e.g. `from: 2, to: 4` means lines 2, 3, and 4). Lines are joined with newlines.

| Field    | Required | Description |
|----------|----------|-------------|
| `line.from` | Yes  | First line (1-based) |
| `line.to`   | Yes  | Last line (1-based, inclusive) |
| `as`        | Yes  | Variable name for the extracted block |

```yaml
- run: |
    echo "line 1"
    echo "line 2"
    echo "line 3"
    echo "line 4"
  captures:
    - line:
        from: 2
        to: 3
      as: line_block
```

## Behavior summary

- **Success**: The extracted string is stored under the variable name in `as`. Use it in later steps as `{{variableName}}`.
- **Failure**: If a capture doesn’t match or parsing fails, that variable is **not** set. Other captures in the same step are still applied. The workflow does not fail.
- **Multiple captures**: Each item in `captures` is independent. You can mix strategies in one step (e.g. one regex and one JSON path).

## Example: Loading .env and using variables

**Runnable (no file):** Echo .env-style lines, capture a key, then use the variable in the next step. Run as-is from the repo root or from `examples/yaml-examples/`:

```yaml
name: Env Example
steps:
  - run: |
      echo "TOP_SECRET=1234567890"
      echo "TOP_SECRET2=1234567890"
    captures:
      - kv: TOP_SECRET
        as: TOP_SECRET_VARIABLE
  - run: "echo {{TOP_SECRET_VARIABLE}}"
```

**With a real .env file:** Use `run: "cat ../../.env"` (or `cat .env`) instead of the echo step. Ensure the file exists (e.g. create a `.env` with `TOP_SECRET=1234567890` at your project root or adjust the path). The same `captures` and `echo {{TOP_SECRET_VARIABLE}}` step then use the value from the file.

## Pseudo: CLI output (e.g. AWS)

Commands like `aws ec2 describe-instances ...` output JSON. You can capture a field and use it in later steps:

```yaml
- run: "aws ec2 describe-instances ..."
  captures:
    - json: "$.Reservations[0].Instances[0].InstanceId"
      as: instance_id
- run: "echo Deploying to {{instance_id}}"
```

Replace the `run` command with your actual CLI call; the pattern (capture with `json` and use `{{variable}}`) stays the same.

## See also

- **[Step Types – run](/docs/dsl-reference/step-types#1-run---execute-command)** – Full `run` syntax including `captures`
- **[Variables](/docs/dsl-reference/variables)** – Variable substitution and how variables are created (prompt, choose, captures)
