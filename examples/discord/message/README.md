# Discord: Send message

Workflows that load the Discord webhook URL from `env.example` (via `cat` + KV capture), prompt for a message, and send it to Discord. Two variants:

- **Script** – uses a Node.js helper (`send-discord.js`); requires Node.js 18+.
- **curl only** – uses only `run` with `curl`; no Node.js.

> **Note:** This example has not been verified; it may need changes for Discord’s current API/spec. See [Discord API docs](https://discord.com/developers/docs/).

## Requirements

- **Discord Webhook URL** – Create one in your server (see below). Set it in `env.example` as `DISCORD_WEBHOOK_URL`.
- **Script variant only:** **Node.js 18+** – for `send-discord.js` (built-in `fetch`).

## Getting a Discord Webhook URL

1. In Discord: open your **Server** → **Channel Settings** (gear) → **Integrations** → **Webhooks**.
2. Click **New Webhook**, name it, choose the channel, then **Copy Webhook URL** (e.g. `https://discord.com/api/webhooks/123.../abc...`).

## Setup: env file

The webhook URL is read from `env.example` in this directory. Edit `env.example` and set `DISCORD_WEBHOOK_URL`. The workflow runs `cat env.example` and uses KV capture.

```bash
cd examples/discord/message
# Edit env.example and set:
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

## Project Structure

```
discord/message/
├── README.md              # This file
├── env.example            # Template; set DISCORD_WEBHOOK_URL
├── workflow-script.yaml   # Script variant: Node.js send-discord.js
├── workflow-curl.yaml     # curl variant: run step with curl only
└── send-discord.js        # Used only by workflow-script.yaml (Node 18+)
```

## Two ways to run

### 1. Script (Node.js required)

```bash
cd examples/discord/message
# Edit env.example with DISCORD_WEBHOOK_URL
task-pipeliner run workflow-script.yaml
```

Flow: `cat env.example` → capture `DISCORD_WEBHOOK_URL` → prompt for message → `node send-discord.js "{{DISCORD_WEBHOOK_URL}}" "{{discord_message}}"`.

### 2. curl only (no Node.js)

```bash
cd examples/discord/message
# Edit env.example with DISCORD_WEBHOOK_URL
task-pipeliner run workflow-curl.yaml
```

Flow: `cat env.example` → capture `DISCORD_WEBHOOK_URL` → prompt for message → `curl -X POST ... "{{DISCORD_WEBHOOK_URL}}"`.

**Note:** In the curl variant, if the prompted message contains double quotes (`"`), the JSON may break. Prefer the script variant for arbitrary text.

Both workflows use `baseDir: ./`, so run them from `examples/discord/message`.
