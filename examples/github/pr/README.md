# GitHub: Create PR

Workflow that loads a GitHub token from `env.example` (via `cat` + KV capture), prompts for repository, head branch, base branch, PR title, and body, then creates a pull request using the [GitHub CLI](https://cli.github.com/) (`gh pr create`).

**Note:** This example has not been verified; it may need changes for GitHub CLI or API updates. See [GitHub CLI manual](https://cli.github.com/manual/gh_pr_create) and [GitHub API docs](https://docs.github.com/en/rest).

## Requirements

- **GitHub CLI (`gh`)** – [Install](https://cli.github.com/) and ensure `gh --version` works.
- **GitHub token** – Personal access token (classic or fine-grained) with `repo` scope. Set it in `env.example` as `GITHUB_TOKEN`.
- The **head branch** must already exist and be pushed to the remote (this workflow does not create or push branches).

## Getting a GitHub token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** (classic or fine-grained).
2. Create a token with at least **repo** scope.
3. Copy the token and set it in `env.example`: `GITHUB_TOKEN=ghp_...`

## Setup: env file

The token is read from `env.example` in this directory. Edit `env.example` and set `GITHUB_TOKEN`. The workflow runs `cat env.example` and uses KV capture.

```bash
cd examples/github/pr
# Edit env.example and set:
# GITHUB_TOKEN=ghp_your_token_here
```

## Project structure

```
github/pr/
├── README.md       # This file
├── env.example     # Set GITHUB_TOKEN
└── workflow.yaml   # cat env.example → capture → prompts → gh pr create
```

## How to run

```bash
cd examples/github/pr
# Edit env.example with GITHUB_TOKEN
task-pipeliner run workflow.yaml
```

Flow: `cat env.example` → capture `GITHUB_TOKEN` → prompt for repo, head branch, base branch (default `main`), title, body → `gh pr create -R "{{repo}}" --head "{{head_branch}}" --base "{{base_branch}}" --title "{{pr_title}}" --body "{{pr_body}}"`.

The workflow uses `baseDir: ./`, so run it from `examples/github/pr`.

**Tip:** Create and push your branch first (e.g. `git checkout -b feature/xyz && git push -u origin feature/xyz`), then run this workflow to open the PR.
