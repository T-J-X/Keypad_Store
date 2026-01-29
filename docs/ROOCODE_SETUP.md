# VS Code + Roo Code Setup (Project Standard)

This project uses **VS Code + Roo Code for everything** (multi-file edits + terminal runs + checklists).
We keep **two workspaces**:
- **DEV (stable)**: `main` branch
- **LAB (experimental)**: `lab/*` branches (can diverge heavily, e.g. configurator UI)

---

## 1) Install Roo Code (VS Code Extension)

1. Open VS Code
2. Extensions panel (Cmd+Shift+X)
3. Search **“Roo Code”** and install it
4. Reload VS Code if prompted

Docs: Installing Roo Code (Marketplace / OpenVSX / VSIX).

---

## 2) Connect a Model Provider

Open Roo Code → click the **gear** icon → **Providers**.

### Option A (recommended for you): OpenAI – ChatGPT Plus/Pro
Roo Code supports connecting your subscription:
1. Provider: **OpenAI – ChatGPT Plus/Pro**
2. Click **Sign in**
3. Finish browser sign-in
4. Pick a model in the dropdown
5. Save

### Option B: OpenAI API key
1. Provider: **OpenAI**
2. Paste API key
3. Pick model
4. Save

### Option C: OpenRouter (easy model switching)
1. Provider: **OpenRouter**
2. Paste API key
3. Pick model
4. Save

Tip: Create **API Configuration Profiles** in Roo Code so you can switch “Fast” vs “Deep” models per task.

---

## 3) Safety & Privacy: Add `.rooignore`

Create a `.rooignore` at the repo root to block sensitive / noisy paths. Roo Code respects `.rooignore` similarly to `.gitignore`.

Recommended minimum:
- `.env` files
- `node_modules/`
- build outputs (`dist/`, `.next/`, etc.)
- `.git/`

---

## 4) Recommended VS Code Extensions (baseline)

- Roo Code
- ESLint
- Prettier
- Docker
- EditorConfig
(Optional) GitLens, Postgres, Prisma (if used), Tailwind CSS IntelliSense

---

## 5) Recommended VS Code Settings (team-friendly)

In `.vscode/settings.json` (workspace settings):

- Format on save
- ESLint fixes on save
- Use Prettier as default formatter
- Typescript: use workspace TS

Example snippet:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

---

## 6) How we use Roo Code (non-negotiable rules)

### Rule A — Review-first for large changes
Before Roo writes lots of files, ask it to:
- list files it will change
- explain changes
- show a diff/plan

### Rule B — One task = one branch or one commit
- Start a task on a branch (or commit checkpoint).
- Run checks.
- Commit.
- Only then proceed.

### Rule C — Never auto-approve destructive commands
Do **not** auto-approve:
- `rm -rf`, `docker compose down -v`, database resets, mass delete migrations, etc.

---

## 7) Starter “Task Prompt” Template (paste into Roo Code)

> You are working inside this repository. Follow the plan in `docs/PLAN.md`.
> Task: <PHASE X / TASK Y>
> Goal: <1–2 lines>
> Only create/edit these files: <paths>
> Provide: full file contents, and the exact terminal commands to run.
> Do not create any other files. If you think more files are needed, STOP and ask.

---

## 8) Optional: Import/Export Roo Code Settings
If you use multiple machines, use Roo Code’s settings import/export so your profiles and preferences stay consistent.
