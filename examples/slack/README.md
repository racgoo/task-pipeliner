# Slack examples

Examples that integrate with [Slack](https://slack.com) from task-pipeliner workflows. Each feature lives in its own subdirectory.

> **Note:** These examples have not been verified against the current Slack API. You may need to adjust workflows and scripts depending on Slack’s API version and spec (webhooks, scopes, endpoints). Use the [Slack API documentation](https://api.slack.com/) as the source of truth.

**Note:** These examples depend on Slack’s APIs and product behavior. They may require updates when Slack changes versions or specs. They have not been verified to work in all environments; use them as a reference and adjust as needed.

## Contents

| Directory   | Description |
|------------|-------------|
| **[message/](message/)** | Send a message to Slack (webhook in `env`, prompt for text; script or curl). |
| **[profile/](profile/)** | Fetch a user profile (Bot token in `env`, optional user ID prompt; `users.info` / `auth.test`). |
| **[settings/](settings/)** | Workspace/auth info (Bot token in `env`; `auth.test` + `team.info`). |

## Quick start

- **message:** [message/README.md](message/README.md) – `env` with `SLACK_WEBHOOK_URL`, prompt, then script or curl.
- **profile:** [profile/README.md](profile/README.md) – `env` with `SLACK_TOKEN` (Bot), optional user ID prompt, then Node script (Node 18+).
- **settings:** [settings/README.md](settings/README.md) – `env` with `SLACK_TOKEN` (Bot), then Node script (Node 18+).

Run from the feature directory, e.g.:

```bash
cd examples/slack/message
cp env.example env
# Edit env, then:
task-pipeliner run workflow-script.yaml
# or
task-pipeliner run workflow-curl.yaml
```

For **profile** and **settings**, use a Bot User OAuth Token (`xoxb-...`) from [api.slack.com/apps](https://api.slack.com/apps) in `env` as `SLACK_TOKEN`.
