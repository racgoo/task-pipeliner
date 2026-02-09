# Slack: Profile

Load a Slack Bot token from `env` (cat + KV capture), optionally prompt for a User ID, then fetch that user’s profile (or the current app user) via the Slack Web API.

> **Note:** This example has not been verified; it may need changes for Slack’s current API/spec. See [Slack API docs](https://api.slack.com/).

## Requirements

- **Node.js 18+** – script uses built-in `fetch`.
- **Slack Bot User OAuth Token** – Create an app at [api.slack.com/apps](https://api.slack.com/apps), add Bot Token Scopes (e.g. `users:read`), install to workspace, copy **Bot User OAuth Token** (`xoxb-...`).

## Setup: env file

```bash
cd examples/slack/profile
cp env.example env
# Edit env: set SLACK_TOKEN=xoxb-your-bot-token
```

## Project structure

```
slack/profile/
├── README.md        # This file
├── env.example     # SLACK_TOKEN
├── env             # Your token (do not commit)
├── workflow.yaml    # cat env → capture → prompt user_id → get-profile.js
└── get-profile.js   # Calls Slack API users.info / auth.test
```

## How to run

```bash
cd examples/slack/profile
# Ensure env exists with SLACK_TOKEN=...
task-pipeliner run workflow.yaml
```

When prompted for User ID, enter a Slack user ID (e.g. `U01234`) or leave empty to show the current (authenticated) user from `auth.test`.
