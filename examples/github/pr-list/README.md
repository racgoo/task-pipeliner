# GitHub: List PRs

Workflow that loads a GitHub token from `env.example` (via `cat` + KV capture), prompts for repository and PR state (open/closed/all), then lists pull requests using the [GitHub CLI](https://cli.github.com/) (`gh pr list`).

**Note:** This example has not been verified; it may need changes for GitHub CLI or API updates.

## Requirements

- **GitHub CLI (`gh`)** – [Install](https://cli.github.com/) and ensure `gh --version` works.
- **GitHub token** – Personal access token with `repo` scope. Set it in `env.example` as `GITHUB_TOKEN`.

## Setup

Edit `env.example` and set `GITHUB_TOKEN`. Run from this directory:

```bash
cd examples/github/pr-list
# Edit env.example with GITHUB_TOKEN
task-pipeliner run workflow.yaml
```

Flow: `cat env.example` → capture token → prompt repo, state (default `open`) → `gh pr list -R "{{repo}}" --state "{{pr_state}}"`.
