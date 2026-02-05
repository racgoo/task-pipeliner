# Task Pipeliner Generator

Visual builders for creating task-pipeliner **workflow** and **schedule** configurations.

🌐 **Live Site**: [https://task-pipeliner-generator.racgoo.com/](https://task-pipeliner-generator.racgoo.com/)

📚 **Documentation**: [https://task-pipeliner.racgoo.com/](https://task-pipeliner.racgoo.com/)

## Tabs

- **Workflow** – Create workflow YAML/JSON (steps, profiles, etc.) for `tp run`
- **Schedule** – Create schedule YAML/JSON for `tp schedule add` (cron, workflow path, silent, profile)

## Features

### Workflow

- 🎨 Visual workflow builder
- 📝 Support for all step types (run, choose, prompt, parallel, fail)
- 👤 Profiles (name + variables) for `tp run --profile <name>`
- 📄 Generate YAML or JSON output
- 💾 Download workflow files
- 🔄 Real-time preview

### Schedule

- 📅 Visual schedule builder (multiple schedules per file)
- ⏰ Cron presets and **calendar helper** (Daily / Weekly / Monthly / Every N min/sec)
- 📄 Generate schedule YAML or JSON
- 💾 Download schedule files for `tp schedule add <file>`
- 🔄 Real-time preview

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Usage

### Workflow

1. Open the app and select the **Workflow** tab
2. Configure workflow name, base directory, shell, profiles (optional)
3. Add steps using the buttons
4. Configure each step
5. Click **→ Code** to generate preview in the editor
6. Download as YAML or JSON

### Schedule

1. Select the **Schedule** tab
2. Add one or more schedules; for each: name, cron (use presets or **Build with calendar helper**), workflow path, optional baseDir/silent/profile
3. Click **→ Code** to generate preview
4. Download as YAML or JSON, then run `tp schedule add <file>`

## Workflow Step Types

- **Run**: Execute shell commands
- **Choose**: User selection from options
- **Prompt**: Text input from user
- **Parallel**: Execute multiple steps simultaneously
- **Fail**: Stop workflow with error message
