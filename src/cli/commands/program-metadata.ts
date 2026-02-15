import type { Command } from 'commander';

const PROGRAM_NAME = 'task-pipeliner';

const PROGRAM_DESCRIPTION =
  'A powerful task pipeline runner with condition-based workflow execution.\n\n' +
  'Define workflows in YAML or JSON files with conditional execution, parallel tasks,\n' +
  'interactive prompts, variable substitution, and cron-based scheduling.\n\n' +
  'Features:\n' +
  '  • Condition-based execution (file checks, variable comparisons)\n' +
  '  • Parallel task execution\n' +
  '  • Interactive prompts and choices\n' +
  '  • Variable substitution with {{variables}}\n' +
  '  • Profiles: run the same workflow with different variable sets (--profile)\n' +
  '  • Override or inject variables: -v key=value (repeatable, applied after --profile)\n' +
  '  • Schedule: run workflows on a cron schedule (tp schedule add/list/start/status)\n' +
  '  • Beautiful terminal output\n' +
  '  • Supports both YAML (.yaml, .yml) and JSON (.json) formats\n\n' +
  'Quick Start:\n' +
  '  0. (Optional) tp setup — create tp/, tp/workflows, tp/schedules and add 2 example workflows + 2 example schedules (echo-based dummies)\n\n' +
  '  1. Create a workflow.yaml or workflow.json file:\n' +
  '     steps:\n' +
  '       - run: \'echo "Hello, World!"\'\n' +
  '       - choose:\n' +
  '           message: "Select action:"\n' +
  '           options:\n' +
  '             - id: build\n' +
  '               label: "Build"\n' +
  '           as: action\n' +
  '       - when:\n' +
  '           var:\n' +
  '             action: build\n' +
  "         run: 'npm run build'\n\n" +
  '  2. Run it:\n' +
  '     tp run workflow.yaml\n' +
  '     tp run workflow.json\n\n' +
  '  3. View execution history:\n' +
  '     tp history           # Interactive menu to view/remove histories\n' +
  '     tp history show      # View a specific history\n' +
  '     tp history remove    # Remove a specific history\n' +
  '     tp history remove-all # Remove all histories\n\n' +
  '  4. Schedule workflows (cron):\n' +
  '     tp schedule add schedule.yaml   # Add schedules from a file (or tp/schedules/*.yaml after tp setup)\n' +
  '     tp schedule list                # List schedules\n' +
  '     tp schedule start -d            # Start daemon in background\n' +
  '     tp schedule status              # View daemon and schedule status\n\n' +
  '  5. Other commands:\n' +
  '     tp setup           # Create tp/workflows, tp/schedules with example files\n' +
  '     tp open docs       # Open documentation in browser\n' +
  '     tp open generator  # Open visual workflow generator\n' +
  '     tp clean           # Remove ~/.pipeliner data (schedules, daemon, history)\n\n' +
  '  Note: After upgrading to a new version, if you see compatibility issues (e.g. schedules or daemon), run "tp clean" to reset ~/.pipeliner data.\n\n';

const HELP_AFTER_TEXT =
  '\nExamples:\n' +
  '  $ tp setup\n' +
  '  $ tp run workflow.yaml\n' +
  '  $ tp run workflow.yaml --profile Production\n' +
  '  $ tp run workflow.yaml -v version=1.0.0\n' +
  '  $ tp run workflow.yaml --profile Prod -v version=2.0.0\n' +
  '  $ tp schedule add schedule.yaml\n' +
  '  $ tp schedule list\n' +
  '  $ tp schedule start -d\n' +
  '  $ tp schedule status\n' +
  '  $ tp open docs\n' +
  '  $ tp open generator\n' +
  '  $ tp history\n' +
  '  $ tp history show\n' +
  '  $ tp clean\n\n' +
  'After upgrading: if schedules or daemon misbehave, run "tp clean" to reset ~/.pipeliner.\n\n' +
  'Resources:\n' +
  '  📚 Documentation: https://task-pipeliner.racgoo.com/\n' +
  '  🎨 Visual Generator: https://task-pipeliner-generator.racgoo.com/\n\n' +
  'See README.md for complete DSL reference.';

export function applyProgramMetadata(program: Command, version: string): Command {
  return program
    .name(PROGRAM_NAME)
    .description(PROGRAM_DESCRIPTION)
    .version(version)
    .addHelpText('after', HELP_AFTER_TEXT);
}
