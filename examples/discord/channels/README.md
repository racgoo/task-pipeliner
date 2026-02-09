# Discord: List channels

Load a Discord Bot token and guild (server) ID from `env.example` (cat + KV capture), optionally prompt for the guild ID, then call the Discord API to list channels in that server.

> **Note:** This example has not been verified; it may need changes for Discord’s current API/spec. See [Discord API docs](https://discord.com/developers/docs/).

## Requirements

- **Node.js 18+** – script uses built-in `fetch`.
- **Discord Bot Token** – Create an app in the [Discord Developer Portal](https://discord.com/developers/applications), add a Bot, copy the token. The bot must be invited to the server whose channels you want to list.
- **Guild (server) ID** – Enable Developer Mode in Discord (User Settings → App Settings → Advanced → Developer Mode). Right‑click your server icon → **Copy Server ID**.

## Setup: env file

Edit `env.example` in this directory and set `DISCORD_TOKEN` and optionally `DISCORD_GUILD_ID`. The workflow runs `cat env.example` and uses KV capture.

```bash
cd examples/discord/channels
# Edit env.example:
# DISCORD_TOKEN=your-bot-token
# DISCORD_GUILD_ID=your-guild-id
```

## Project structure

```
discord/channels/
├── README.md         # This file
├── env.example       # DISCORD_TOKEN, DISCORD_GUILD_ID
├── workflow.yaml     # cat env.example → capture → optional prompt → list-channels.js
└── list-channels.js  # GET /guilds/{id}/channels, print list
```

## How to run

```bash
cd examples/discord/channels
# Edit env.example with DISCORD_TOKEN and (optionally) DISCORD_GUILD_ID
task-pipeliner run workflow.yaml
```

Flow: `cat env.example` → capture token and guild ID → prompt for guild ID (default from env.example) → `node list-channels.js` → prints channel ID, type, and name.

Output includes a simple table of channels (ID, type such as text/voice/category, name). The bot must be a member of the guild.
