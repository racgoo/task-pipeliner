# Profiles

Profiles let you run workflows **non-interactively** by pre-defining variable values. When you use `tp run --profile <name>`, any **choose** or **prompt** step that stores into a variable already set in the profile is skipped, and the profile value is used for `{{variable}}` substitution and conditions.

## Defining Profiles

Add a `profiles` array at the top level of your workflow (same level as `name`, `baseDir`, `shell`, `steps`).

**YAML:**

```yaml
name: My Workflow

profiles:
  - name: Test
    var:
      mode: "dev"
      label: "test-label"
  - name: Prod
    var:
      mode: "prod"
      label: "prod-label"

steps:
  - choose:
      message: "Select mode"
      options:
        - id: dev
          label: Development
        - id: prod
          label: Production
      as: mode
  - prompt:
      message: "Enter label"
      as: label
      default: "default-label"
  - run: 'echo "{{ mode }} / {{ label }}"'
```

**JSON:**

```json
{
  "name": "My Workflow",
  "profiles": [
    { "name": "Test", "var": { "mode": "dev", "label": "test-label" } },
    { "name": "Prod", "var": { "mode": "prod", "label": "prod-label" } }
  ],
  "steps": [
    {
      "choose": {
        "message": "Select mode",
        "options": [
          { "id": "dev", "label": "Development" },
          { "id": "prod", "label": "Production" }
        ],
        "as": "mode"
      }
    },
    {
      "prompt": {
        "message": "Enter label",
        "as": "label",
        "default": "default-label"
      }
    },
    {
      "run": "echo \"{{ mode }} / {{ label }}\""
    }
  ]
}
```

## Running with a Profile

Use the `--profile` or `-p` option with the profile name:

```bash
tp run workflow.yaml --profile Test
# or
tp run workflow.yaml -p Prod
```

- With `--profile Test`, the **choose** step (storing to `mode`) and the **prompt** step (storing to `label`) are skipped, and the values from the Test profile (`mode: "dev"`, `label: "test-label"`) are used.
- Commands and conditions see these values as if the user had selected or entered them.

## Profile Field Reference

| Field   | Type     | Required | Description                                  |
|---------|----------|----------|----------------------------------------------|
| `name`  | `string` | Yes      | Profile name (must be non-empty, unique).     |
| `var`   | object   | Yes      | Key-value map; keys are variable names, values are strings (numbers/booleans in YAML/JSON are coerced to strings). |

## Behavior Details

- **Choose steps**: Skipped only when the step has an `as` field and that variable is set in the profile **and** the profile value equals one of the option `id`s. Otherwise, the choice prompt is shown.
- **Prompt steps**: Skipped when the variable named in `as` is already set in the profile. Otherwise, the text prompt is shown.
- **Variable substitution**: All `{{variable}}` in run commands use profile values when the variable is set in the profile.
- **Conditions**: `when` clauses (e.g. `var: { mode: "prod" }`) use profile values, so steps can be skipped or run based on the selected profile.

## Example: CI-friendly Run

Use a profile in CI or scripts so no user input is required:

```yaml
profiles:
  - name: ci
    var:
      env: prod
      version: "1.0.0"

steps:
  - choose:
      message: "Environment"
      options:
        - id: dev
          label: Development
        - id: prod
          label: Production
      as: env
  - run: echo "Deploying {{env}} at {{version}}"
```

```bash
tp run workflow.yaml --profile ci
```

No prompts are shown; the workflow runs with `env=prod` and `version=1.0.0`.

## Next Steps

- [Workflow Structure](/docs/dsl-reference/workflow-structure) - Top-level fields including `profiles`
- [Variables](/docs/dsl-reference/variables) - Variable substitution and YAML syntax
- [Step Types](/docs/dsl-reference/step-types) - `choose` and `prompt` steps
