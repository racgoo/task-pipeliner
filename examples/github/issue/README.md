# GitHub: Create issue

Workflow that loads a GitHub token from `env.example` (via `cat` + KV capture), prompts for repository, issue title, and body, then creates an issue using the [GitHub CLI](https://cli.github.com/) (`gh issue create`).

**Note:** This example has not been verified; it may need changes for GitHub CLI or API updates. See [GitHub CLI manual](https://cli.github.com/manual/) and [GitHub API docs](https://docs.github.com/en/rest).

## Requirements

- **GitHub CLI (`gh`)** – [Install](https://cli.github.com/) and ensure `gh --version` works.
- **GitHub token** – Personal access token (classic or fine-grained) with `repo` scope. Set it in `env.example` as `GITHUB_TOKEN`.

## Getting a GitHub token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** (classic or fine-grained).
2. Create a token with at least **repo** scope (for private repos use “Full control of private repositories” or equivalent).
3. Copy the token and set it in `env.example`: `GITHUB_TOKEN=ghp_...`

## Setup: env file

The token is read from `env.example` in this directory. Edit `env.example` and set `GITHUB_TOKEN`. The workflow runs `cat env.example` and uses KV capture.

```bash
cd examples/github/issue
# Edit env.example and set:
# GITHUB_TOKEN=ghp_your_token_here
```

## Project structure

```
github/issue/
├── README.md       # This file
├── env.example     # Set GITHUB_TOKEN
└── workflow.yaml   # cat env.example → capture → prompts → gh issue create
```

## How to run

```bash
cd examples/github/issue
# Edit env.example with GITHUB_TOKEN
task-pipeliner run workflow.yaml
```

Flow: `cat env.example` → capture `GITHUB_TOKEN` → prompt for repo (e.g. `owner/repo`), title, body → `GH_TOKEN=... gh issue create -R "{{repo}}" --title "{{issue_title}}" --body "{{issue_body}}"`.

The workflow uses `baseDir: ./`, so run it from `examples/github/issue`.
