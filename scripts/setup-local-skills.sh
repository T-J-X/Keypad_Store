#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

SKILLS_DIR="${ROOT_DIR}/.agents/skills"

echo "Refreshing local skill mirror in ${SKILLS_DIR}"
mkdir -p "${SKILLS_DIR}"
find "${SKILLS_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

install_skill() {
  local label="$1"
  shift
  echo "Installing ${label}"
  npx skills add "$@" --yes
}

install_skill "vercel-labs/agent-skills (--all)" \
  "https://github.com/vercel-labs/agent-skills" \
  --all

install_skill "nextlevelbuilder/ui-ux-pro-max-skill (ui-ux-pro-max)" \
  "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill" \
  --skill ui-ux-pro-max \
  --full-depth

install_skill "coreyhaines31/marketingskills (seo-audit, programmatic-seo)" \
  "https://github.com/coreyhaines31/marketingskills" \
  --skill seo-audit \
  --skill programmatic-seo

install_skill "supabase/agent-skills (supabase-postgres-best-practices)" \
  "https://github.com/supabase/agent-skills" \
  --skill supabase-postgres-best-practices

install_skill "google-labs-code/stitch-skills (react:components, design-md)" \
  "https://github.com/google-labs-code/stitch-skills" \
  --skill "react:components" \
  --skill design-md

install_skill "secondsky/claude-skills (tailwind-v4-shadcn)" \
  "https://github.com/secondsky/claude-skills" \
  --skill tailwind-v4-shadcn

echo "Local skill mirror refresh complete."
