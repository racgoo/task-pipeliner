# Slack: Settings (workspace / auth info)

Load a Slack Bot token from `env` (cat + KV capture), then call the Slack Web API to show workspace and auth info (`auth.test`, `team.info`).

> **Note:** This example has not been verified; it may need changes for Slack’s current API/spec. See [Slack API docs](https://api.slack.com/).

## Requirements

- **Node.js 18+** – script uses built-in `fetch`.
- **Slack Bot User OAuth Token** – Create an app at [api.slack.com/apps](https://api.slack.com/apps), install to workspace, copy **Bot User OAuth Token** (`xoxb-...`). For `team.info` add scope `team:read`; `auth.test` works with no extra scopes.

## Setup: env file

```bash
cd examples/slack/settings
cp env.example env
# Edit env: set SLACK_TOKEN=xoxb-your-bot-token
```

## Project structure

```
slack/settings/
├── README.md        # This file
├── env.example     # SLACK_TOKEN
├── env             # Your token (do not commit)
├── workflow.yaml    # cat env → capture → get-settings.js
└── get-settings.js  # Calls Slack API auth.test + team.info
```

## How to run

```bash
cd examples/slack/settings
# Ensure env exists with SLACK_TOKEN=...
task-pipeliner run workflow.yaml
```

Output includes the authenticated app’s URL, team and user from `auth.test`, and team name/domain from `team.info` (if `team:read` is granted).
