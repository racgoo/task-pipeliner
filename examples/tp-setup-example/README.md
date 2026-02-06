# tp setup Example (Generated Layout)

This folder shows **exactly the structure and file contents** that `tp setup` creates when you run it from your project root. You can use it as a reference or copy from it; or run `tp setup` in your own project to generate the same layout with these example files.

## What `tp setup` Does

When you run `tp setup` from your project root:

1. **Creates directories**
   - `tp/`
   - `tp/workflows/` – workflow files (YAML/JSON)
   - `tp/schedules/` – schedule files (YAML/JSON)

2. **Adds two example workflows** in `tp/workflows/` (only if the files do not already exist):
   - **`example-hello.yaml`** – Uses `choose`, `when`, and `run` with `echo`. Demonstrates interactive choice stored as a variable and conditional steps.
   - **`example-build.yaml`** – Uses **profiles** (Dev, Prod), **choose**, **prompt**, and **when**. Run with `tp run tp/workflows/example-build.yaml --profile Dev` to skip prompts. All steps use `echo` so you can run safely and then replace with real commands.

3. **Adds two example schedule files** in `tp/schedules/` (only if they do not already exist):
   - **`example-daily.yaml`** – One schedule (Daily Hello at 09:00), workflow path `../workflows/example-hello.yaml`.
   - **`example-hourly.yaml`** – Two schedules: Hourly Build (Dev) with `profile: Dev`, and Nightly Build (Prod) with `profile: Prod`. Both reference `../workflows/example-build.yaml`. Using a profile in schedules is recommended for cron so choose/prompt are skipped and profile variables are used.

4. **Does not overwrite** existing files. If `tp/` or any of the example files already exist, they are left as-is.

## Directory Structure (Same as This Example)

```
tp-setup-example/   (or your project root after tp setup)
├── tp/
│   ├── workflows/
│   │   ├── example-hello.yaml    # choose + when + echo
│   │   └── example-build.yaml    # profiles + choose + prompt + when + echo
│   └── schedules/
│       ├── example-daily.yaml    # one schedule, no profile
│       └── example-hourly.yaml  # two schedules with profile: Dev / Prod
└── README.md
```

## How the New tp Structure Is Used

- **`tp run`** (no file path): Finds the nearest `tp` directory, then lists workflows from **`tp/workflows/`** and lets you select one interactively.
- **`tp schedule add`** (no file path): Finds the nearest `tp` directory, then lets you select a schedule file from **`tp/schedules/`** to add.

So workflows live in `tp/workflows/`, and schedule definitions live in `tp/schedules/`. Schedule files reference workflows with relative paths (e.g. `../workflows/example-hello.yaml`).

## Try It From This Example

```bash
# From repo root
cd examples/tp-setup-example
tp run
# → Interactive menu with example-hello.yaml and example-build.yaml

tp run tp/workflows/example-build.yaml --profile Dev
# → Runs without prompts, uses Dev profile variables

# Add schedules (with path or select from tp/schedules)
tp schedule add tp/schedules/example-daily.yaml
tp schedule list
# → After add, each added schedule is shown in the same card format as list
#   (cron, human "when" description, next run, enabled state)

tp schedule toggle
# → After toggle, ENABLED/DISABLED is shown clearly (bold, colored) and the schedule card is displayed

tp schedule remove
# → After remove, the removed schedule is shown in the same card format
```

## Schedule UI (Unified Card Layout)

After **add**, **toggle**, or **remove**, the affected schedule(s) are displayed in the **same card layout** as `tp schedule list`:

- Cron expression and human-readable “when” description (e.g. “Every minute”, “At 09:00”)
- Next run time, last run, timezone, workflow path, profile (if set)
- **Toggle:** The new state is emphasized: **ENABLED** (green) or **DISABLED** (gray) so it’s obvious at a glance

This keeps the UI consistent across list, add, toggle, remove, status, and start.
