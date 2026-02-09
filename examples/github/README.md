# GitHub examples

Examples that integrate with [GitHub](https://github.com) from task-pipeliner workflows. Each feature lives in its own subdirectory.

**Note:** These examples depend on the GitHub CLI (`gh`) and GitHub’s APIs. They may require updates when GitHub changes CLI or API behavior. They have not been verified to work in all environments; use them as a reference and adjust as needed.

## Contents

| Directory   | Description |
|------------|-------------|
| **[issue/](issue/)** | Create a GitHub issue: token in `env.example`, prompt for repo, title, body, then `gh issue create`. |
| **[pr/](pr/)** | Create a pull request: token in `env.example`, prompt for repo, head/base branch, title, body, then `gh pr create`. |
| **[pr-list/](pr-list/)** | List pull requests: token in `env.example`, prompt for repo and state (open/closed/all), then `gh pr list`. |

## Quick start

- **issue:** [issue/README.md](issue/README.md) – set `GITHUB_TOKEN` in `env.example`, prompt for repo, issue title, body → `gh issue create`.
- **pr:** [pr/README.md](pr/README.md) – set `GITHUB_TOKEN`, prompt for repo, head/base branch, PR title, body → `gh pr create`.
- **pr-list:** [pr-list/README.md](pr-list/README.md) – set `GITHUB_TOKEN`, prompt for repo, state → `gh pr list`.

Run from the feature directory, e.g.:

```bash
cd examples/github/issue
# Edit env.example with GITHUB_TOKEN (Personal access token with repo scope)
task-pipeliner run workflow.yaml

cd examples/github/pr
task-pipeliner run workflow.yaml

cd examples/github/pr-list
task-pipeliner run workflow.yaml
```

Requires [GitHub CLI](https://cli.github.com/) (`gh`) installed.
