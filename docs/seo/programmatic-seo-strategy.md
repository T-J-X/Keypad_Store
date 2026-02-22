# Programmatic SEO Strategy

Date: 2026-02-22
Project: Keypad Store (VCT)

## Goals

- Capture qualified long-tail demand around technical keypad selection, compatibility, and deployment.
- Expand non-brand organic entry points without creating thin or duplicate pages.
- Drive assisted conversion into `/shop`, `/configurator`, and product detail pages.

## URL Architecture (Subfolders Only)

All programmatic surfaces remain under first-party subfolders:

- `/shop/button-inserts/[discipline]`
- `/shop/keypads/[protocol-or-family]`
- `/guides/[integration-or-use-case]`
- `/guides/compare/[topic-a]-vs-[topic-b]`
- `/guides/alternatives/[competitor]`
- `/docs/[technical-topic]`

No subdomains are used for pSEO surfaces.

## Hub/Spoke Internal Linking Model

Primary hubs:

- `/shop` (commercial hub)
- `/guides` (educational hub)
- `/docs` (technical reference hub)

Spoke rules:

- Every spoke must link back to exactly one hub and at least 2 related spokes.
- Every hub must include curated links to top spokes by intent bucket.
- Product/commercial spokes must include a prominent bridge to `/configurator`.
- Editorial/technical spokes must include contextual links to relevant PDPs and category routes.

## Indexation Plan

Index:

- High-utility pages with unique, intent-specific value and complete content blocks.
- Pages with stable keyword demand and clear conversion path.

Noindex:

- Low-signal parameterized variants.
- Pages failing minimum uniqueness/content thresholds.
- Experimental pages without sufficient supporting data.

Operational rules:

- New template families launch with conservative index allowlist.
- Promote additional pages to index only after quality and engagement checks.

## Safeguards (Thin Content + Cannibalization)

Thin-content controls:

- Minimum content threshold per page template (intro + technical summary + compatibility matrix + FAQ + internal links).
- Required proprietary/supporting data points (not just token substitution).
- Automatic noindex if required fields are missing.

Cannibalization controls:

- One primary keyword target per URL.
- Shared keyword map with canonical intent owner.
- Consolidation rules when two URLs target equivalent intent.

## Uniqueness Model By Page Type

1. Discipline pages (`/shop/button-inserts/[discipline]`)
- Unique elements: discipline-specific icon categories, use environments, standards references, top SKU mapping.

2. Protocol/family pages (`/shop/keypads/[protocol-or-family]`)
- Unique elements: protocol compatibility notes, model matrix, integration constraints, deployment checklist.

3. Integration guides (`/guides/[integration-or-use-case]`)
- Unique elements: workflow steps, wiring/software setup notes, troubleshooting patterns, required accessories.

4. Comparison pages (`/guides/compare/[a]-vs-[b]`)
- Unique elements: criteria matrix, scenario recommendations, trade-off explanations, decision framework.

5. Competitor alternative pages (`/guides/alternatives/[competitor]`)
- Unique elements: vendor-specific baseline profile, scenario-fit recommendations, evidence-backed matrix, migration checklist.

6. Technical doc pages (`/docs/[technical-topic]`)
- Unique elements: definitions, implementation constraints, field examples, validation steps.

## Rollout Sequence

1. Launch discipline and protocol pages first (highest commercial intent).
2. Add integration guides for top product workflows.
3. Expand comparison pages for high-confusion keyword pairs.
4. Launch competitor-alternatives pages for high-intent vendor terms (`[brand] alternatives` + `[brand] vs [category]`).
5. Scale technical docs tied to sales/support friction points.

## Measurement

Primary:
- Indexed page count by template family
- Non-brand impressions/clicks by keyword cluster
- CTR by template type
- Assisted conversion rate to configurator and checkout flows

Secondary:
- Scroll depth and dwell on guide/doc templates
- Internal-link assisted sessions
- Query coverage growth for mapped long-tail clusters
- Conversion assist rate from alternatives pages into `/shop` and `/configurator`
