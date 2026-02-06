# DEV + LAB Workspaces (Real-time Clone)

Goal: keep DEV stable while LAB experiments can change fast (especially configurator UI/UX).

## Recommended workflow: git worktrees

Once you have the repo cloned:

### DEV (main)
- Folder: `project-dev`
- Branch: `main`
- Infra: `infra/docker-compose.dev.yml` + `infra/.env.dev`

### LAB (experimental)
- Folder: `project-lab`
- Branch: `lab/<topic>` (e.g. `lab/configurator-redesign`)

Commands:
```bash
# in your main repo folder
git checkout -b main

# create a lab worktree next to it
git worktree add ../project-lab -b lab/configurator-redesign
```

Open in VS Code:
- Open DEV in one window
- Open LAB in a second window

## Running both stacks
DEV:
```bash
cd infra
cp .env.dev.example .env.dev
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

LAB:
```bash
cd infra
```

Ports do not collide because LAB uses port offsets (5433/6380/9100/8026/8089).

## Merging
Only merge LAB → main after:
- regression gate passes on LAB
- and you re-run the regression gate on DEV after merging
