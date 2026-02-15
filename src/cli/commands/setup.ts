import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { uiMessage, uiTone } from '@ui/primitives';
import type { Command } from 'commander';

/**
 * Example workflow and schedule contents for tp setup
 */
export const SETUP_WORKFLOW_EXAMPLES: { filename: string; content: string }[] = [
  {
    filename: 'example-hello.yaml',
    content: `name: Hello World (with choose)

# Interactive choice: stored as variable and used in later steps
steps:
  - run: 'echo "Hello from task-pipeliner"'
  - choose:
      message: "Select action:"
      options:
        - id: greet
          label: "Greet"
        - id: info
          label: "Show info"
      as: action
  - run: 'echo "You chose: {{ action }}"'
  - when:
      var:
        action: greet
    run: 'echo "Hi there! Edit tp/workflows and run: tp run tp/workflows/example-hello.yaml"'
  - when:
      var:
        action: info
    run: 'echo "Tip: Use --profile. See example-build.yaml for profiles."'
`,
  },
  {
    filename: 'example-build.yaml',
    content: `name: Example Build (with profiles and choose)

# Profiles: run without prompts via "tp run tp/workflows/example-build.yaml --profile Dev"
# With profile, choose/prompt are skipped and these variables are used.
profiles:
  - name: Dev
    var:
      mode: dev
      label: "dev-build"
  - name: Prod
    var:
      mode: prod
      label: "prod-build"

steps:
  - run: 'echo "Build workflow started..."'
  - choose:
      message: "Select mode (or run with --profile Dev/Prod to skip):"
      options:
        - id: dev
          label: "Development"
        - id: prod
          label: "Production"
      as: mode
  - run: 'echo "Mode: {{ mode }}"'
  - prompt:
      message: "Enter build label"
      as: label
      default: "default"
  - run: 'echo "Label: {{ label }}"'
  - when:
      var:
        mode: dev
    run: 'echo "Dev-only step (e.g. npm run build:dev)"'
  - when:
      var:
        mode: prod
    run: 'echo "Prod-only step (e.g. npm run build)"'
  - run: 'echo "Done. Replace run steps with real commands."'
`,
  },
];

export const SETUP_SCHEDULE_EXAMPLES: { filename: string; content: string }[] = [
  {
    filename: 'example-daily.yaml',
    content: `schedules:
  # Runs at 09:00 daily; interactive choose is skipped in scheduled runs (no TTY)
  - name: Daily Hello
    cron: "0 9 * * *"
    workflow: ../workflows/example-hello.yaml
`,
  },
  {
    filename: 'example-hourly.yaml',
    content: `schedules:
  # With profile: choose/prompt are skipped and profile vars used (good for cron)
  - name: Hourly Build (Dev)
    cron: "0 * * * *"
    workflow: ../workflows/example-build.yaml
    profile: Dev
  - name: Nightly Build (Prod)
    cron: "0 2 * * *"
    workflow: ../workflows/example-build.yaml
    profile: Prod
`,
  },
];

export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description(
      'Create tp directory with workflows and schedules folders and add 2 example files in each (echo-based dummies). Run from project root for easy initial setup.'
    )
    .action(async () => {
      const cwd = process.cwd();
      const tpDir = join(cwd, 'tp');
      const workflowsDir = join(tpDir, 'workflows');
      const schedulesDir = join(tpDir, 'schedules');

      if (existsSync(tpDir)) {
        console.log(uiTone.muted(`\n  tp directory already exists at ${tpDir}`));
      } else {
        await mkdir(tpDir, { recursive: true });
        console.log(uiMessage.successLine(`Created ${tpDir}`));
      }

      const ensureDir = async (dir: string, label: string) => {
        if (existsSync(dir)) {
          console.log(uiTone.muted(`  ${label} already exists`));
        } else {
          await mkdir(dir, { recursive: true });
          console.log(uiTone.success(`✓ Created ${label}`));
        }
      };

      await ensureDir(workflowsDir, 'tp/workflows');
      await ensureDir(schedulesDir, 'tp/schedules');

      const created: string[] = [];

      for (const { filename, content } of SETUP_WORKFLOW_EXAMPLES) {
        const filePath = join(workflowsDir, filename);
        if (existsSync(filePath)) {
          console.log(uiTone.muted(`  Skipped (exists): tp/workflows/${filename}`));
        } else {
          await writeFile(filePath, content, 'utf-8');
          created.push(`tp/workflows/${filename}`);
        }
      }

      for (const { filename, content } of SETUP_SCHEDULE_EXAMPLES) {
        const filePath = join(schedulesDir, filename);
        if (existsSync(filePath)) {
          console.log(uiTone.muted(`  Skipped (exists): tp/schedules/${filename}`));
        } else {
          await writeFile(filePath, content, 'utf-8');
          created.push(`tp/schedules/${filename}`);
        }
      }

      if (created.length > 0) {
        console.log(uiMessage.successLine(`Added ${created.length} example file(s):`));
        created.forEach((p) => console.log(uiTone.subtle(`   ${p}`)));
      }

      console.log(
        uiTone.subtle(
          '\n  Next: tp run tp/workflows/example-hello.yaml  |  tp schedule add tp/schedules/example-daily.yaml  |  tp schedule list'
        )
      );
      console.log();
    });
}
