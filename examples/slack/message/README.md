# Slack: Send message

Workflows that load the Slack webhook URL from an `env` file (via `cat` + KV capture), prompt for a message, and send it to Slack. Two variants:

- **Script** – uses a Node.js helper (`send-slack.js`); requires Node.js 18+.
- **curl only** – uses only `run` with `curl`; no Node.js.

> **Note:** This example has not been verified; it may need changes for Slack’s current API/spec. See [Slack API docs](https://api.slack.com/).

## Requirements

- **Slack Incoming Webhook URL** – Create one in your workspace (see below). Stored in `env`.
- **Script variant only:** **Node.js 18+** – for `send-slack.js` (built-in `fetch`).

## Getting a Slack Webhook URL

1. In Slack: **Apps** → **Incoming Webhooks** (or [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)).
2. **Add to Slack** and choose the channel.
3. Copy the **Webhook URL** (e.g. `https://hooks.slack.com/services/T.../B.../xxx`).

## Setup: env file

The webhook URL is read from an `env` file in this directory. The workflow runs `cat env` and uses KV capture to get `SLACK_WEBHOOK_URL`.

```bash
cd examples/slack/message
cp env.example env
# Edit env and set your URL:
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Project Structure

```
slack/message/
├── README.md              # This file
├── env.example           # Template; copy to env and set SLACK_WEBHOOK_URL
├── env                   # Your secrets (create from env.example; do not commit)
├── workflow-script.yaml   # Script variant: Node.js send-slack.js
├── workflow-curl.yaml     # curl variant: run step with curl only
└── send-slack.js         # Used only by workflow-script.yaml (Node 18+)
```

## Two ways to run

### 1. Script (Node.js required)

```bash
cd examples/slack/message
# Ensure env exists with SLACK_WEBHOOK_URL=...
task-pipeliner run workflow-script.yaml
```

Flow: `cat env` → capture `SLACK_WEBHOOK_URL` → prompt for message → `node send-slack.js "{{SLACK_WEBHOOK_URL}}" "{{slack_message}}"`.

### 2. curl only (no Node.js)

```bash
cd examples/slack/message
# Ensure env exists with SLACK_WEBHOOK_URL=...
task-pipeliner run workflow-curl.yaml
```

Flow: `cat env` → capture `SLACK_WEBHOOK_URL` → prompt for message → `curl -X POST ... "{{SLACK_WEBHOOK_URL}}"`.

**Note:** In the curl variant, if the prompted message contains double quotes (`"`), the JSON may break. Prefer the script variant for arbitrary text.

Both workflows use `baseDir: ./`, so run them from `examples/slack/message`.
