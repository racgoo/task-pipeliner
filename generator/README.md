# Task Pipeliner Workflow Generator

Visual workflow builder for creating task-pipeliner workflow configurations.

🌐 **Live Site**: [https://task-pipeliner-generator.racgoo.com/](https://task-pipeliner-generator.racgoo.com/)

📚 **Documentation**: [https://task-pipeliner.racgoo.com/](https://task-pipeliner.racgoo.com/)

## Features

- 🎨 Visual workflow builder
- 📝 Support for all step types (run, choose, prompt, parallel, fail)
- 📄 Generate YAML or JSON output
- 💾 Download workflow files
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

1. Open the application in your browser
2. Configure workflow name and base directory (optional)
3. Add steps using the buttons
4. Configure each step
5. Generate preview to see the output
6. Download as YAML or JSON

## Step Types

- **Run**: Execute shell commands
- **Choose**: User selection from options
- **Prompt**: Text input from user
- **Parallel**: Execute multiple steps simultaneously
- **Fail**: Stop workflow with error message
