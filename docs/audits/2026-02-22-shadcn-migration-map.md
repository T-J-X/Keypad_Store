# 2026-02-22 shadcn Migration Map

Source index: `/Users/terry/keypad-store/llm.txt`.

Rule: no UI primitive replacement is allowed unless it appears in this map.

| Current local component/file | Target shadcn component | shadcn doc link | Dependency/package impact | Migration notes |
| --- | --- | --- | --- | --- |
| `/Users/terry/keypad-store/apps/frontend/components/ui/Button.tsx` | `Button` | https://ui.shadcn.com/docs/components/button | Keep `class-variance-authority`, `clsx`, `tailwind-merge`; no new Radix package required | Preserve existing `variant` API (`premium`, `secondaryDark`, etc.) by extending generated shadcn variant map. |
| `/Users/terry/keypad-store/apps/frontend/components/ui/AccessibleModal.tsx` | `Dialog` | https://ui.shadcn.com/docs/components/dialog | Add/update `@radix-ui/react-dialog` | Replace custom focus trap/backdrop logic with shadcn Dialog primitives while preserving `initialFocusRef` behavior where needed. |
| `/Users/terry/keypad-store/apps/frontend/components/ui/SearchModal.tsx` | `Dialog` + `Command` | https://ui.shadcn.com/docs/components/dialog + https://ui.shadcn.com/docs/components/command | Add/update `@radix-ui/react-dialog` and `cmdk` | Move search UX into command palette-style modal; keep keyboard support and server action search flow. |
| `/Users/terry/keypad-store/apps/frontend/components/ui/MobileMenu.tsx` | `Sheet` | https://ui.shadcn.com/docs/components/sheet | Add/update `@radix-ui/react-dialog` (Sheet dependency) | Replace custom drawer portal/backdrop with Sheet; preserve cart badge, auth links, and inline mobile search section. |
| `/Users/terry/keypad-store/apps/frontend/components/ui/Toast.tsx` and `/Users/terry/keypad-store/apps/frontend/components/GlobalToastViewport.tsx` | `Toast` | https://ui.shadcn.com/docs/components/toast | Add `sonner` (or shadcn toast stack) and aligned styles | Consolidate ad-hoc toast portals to one provider/viewport model; retain existing CTA toast behavior from UI store. |
| `/Users/terry/keypad-store/apps/frontend/components/faq/Accordion.tsx` | `Accordion` | https://ui.shadcn.com/docs/components/accordion | Add/update `@radix-ui/react-accordion` | Migrate open/close state and aria wiring to shadcn accordion item/trigger/content primitives. |
| `/Users/terry/keypad-store/apps/frontend/components/navbar/NavPill.tsx` | `Navigation Menu` (+ `Button` styling primitives) | https://ui.shadcn.com/docs/components/navigation-menu + https://ui.shadcn.com/docs/components/button | Add/update `@radix-ui/react-navigation-menu` | Keep existing pill hover-expand UX; map structural nav/dropdown behavior to NavigationMenu items where appropriate. |
| `/Users/terry/keypad-store/apps/frontend/components/ui/SparkDivider.tsx` | `Separator` | https://ui.shadcn.com/docs/components/separator | Add/update `@radix-ui/react-separator` | Keep custom glow styling as wrapper classes around shadcn separator primitive for consistency. |
| `/Users/terry/keypad-store/apps/frontend/components/CookieBanner.tsx` | `Alert` + `Button` | https://ui.shadcn.com/docs/components/alert + https://ui.shadcn.com/docs/components/button | No mandatory new package beyond button/alert dependencies | Keep consent actions and policy link; migrate container semantics/styling to shadcn alert patterns. |

## Phase 4 Notes

- `components.json` was missing and has been added at `/Users/terry/keypad-store/apps/frontend/components.json`.
- Codex MCP config for shadcn was added to `/Users/terry/.codex/config.toml`.
