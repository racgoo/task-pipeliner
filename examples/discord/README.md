# Discord examples

Examples that integrate with [Discord](https://discord.com) from task-pipeliner workflows. Each feature lives in its own subdirectory.

> **Note:** These examples have not been verified against the current Discord API. You may need to adjust workflows and scripts depending on Discord’s API version and spec (webhooks, endpoints). Use the [Discord API documentation](https://discord.com/developers/docs/) as the source of truth.

## Contents

| Directory   | Description |
|------------|-------------|
| **[message/](message/)** | Send a message to Discord (webhook URL in `env.example`, prompt for text; script or curl). |
| **[channels/](channels/)** | List channels in a server (Bot token + guild ID in `env.example`, optional prompt; Node script). |

## Quick start

- **message:** [message/README.md](message/README.md) – set `DISCORD_WEBHOOK_URL` in `env.example`, prompt for message, then script or curl.
- **channels:** [channels/README.md](channels/README.md) – set `DISCORD_TOKEN` and `DISCORD_GUILD_ID` in `env.example`, optional guild ID prompt, then Node script (Node 18+) to list channels.

Run from the feature directory:

```bash
cd examples/discord/message
# Edit env.example with DISCORD_WEBHOOK_URL
task-pipeliner run workflow-script.yaml
# or
task-pipeliner run workflow-curl.yaml

cd examples/discord/channels
# Edit env.example with DISCORD_TOKEN, DISCORD_GUILD_ID
task-pipeliner run workflow.yaml
```
