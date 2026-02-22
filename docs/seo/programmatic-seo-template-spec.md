# Programmatic SEO Template Spec

Date: 2026-02-22

## Global Requirements

- URL pattern must be deterministic and slug-normalized.
- Metadata must include unique title, description, canonical, and index/noindex decision.
- Each template includes structured data where applicable.
- Each page includes hub link + related spokes + commerce CTA path.

## Template 1: Discipline Landing

Pattern:
- `/shop/button-inserts/[discipline]`

Intent:
- Users seeking inserts/icons by operational domain.

Required data:
- Discipline label, synonyms, icon category set, representative SKUs, compatibility notes.

Required sections:
1. Discipline overview (unique intro)
2. Featured insert sets / SKUs
3. Compatibility and usage context
4. Related disciplines
5. FAQ
6. CTA to `/configurator`

Metadata template:
- Title: `Button Inserts for [Discipline] | VCT`
- Description: `Browse [Discipline] button inserts and icon sets with compatibility guidance.`

## Template 2: Protocol/Family Landing

Pattern:
- `/shop/keypads/[protocol-or-family]`

Intent:
- Users comparing keypad options by protocol/family requirement.

Required data:
- Protocol/family name, supported models, constraints, integration notes.

Required sections:
1. Protocol/family summary
2. Model comparison matrix
3. Integration constraints
4. Recommended configurations
5. FAQ

Metadata template:
- Title: `[Protocol/Family] Keypads | VCT`
- Description: `Compare [Protocol/Family] keypad options, compatibility, and recommended models.`

## Template 3: Integration Guide

Pattern:
- `/guides/[integration-or-use-case]`

Intent:
- Users looking for implementation guidance.

Required data:
- Platform/system name, prerequisites, steps, troubleshooting points.

Required sections:
1. What this integration solves
2. Prerequisites
3. Step-by-step workflow
4. Common errors + fixes
5. Related products and inserts

Metadata template:
- Title: `[Integration] Guide | VCT`
- Description: `Step-by-step [Integration] setup for VCT keypads and insert workflows.`

## Template 4: Comparison Page

Pattern:
- `/guides/compare/[topic-a]-vs-[topic-b]`

Intent:
- Users deciding between alternatives.

Required data:
- Two compared entities, decision criteria, scenario fit recommendations.

Required sections:
1. Summary verdict
2. Side-by-side matrix
3. Scenario recommendations
4. FAQ
5. Conversion CTA

Metadata template:
- Title: `[A] vs [B] for Keypad Workflows | VCT`
- Description: `Compare [A] and [B] across compatibility, workflow fit, and deployment trade-offs.`

## Indexation Gating Rules

Index only if all are true:
- Unique intro paragraph (not templated only)
- At least one data-driven matrix/list section
- At least two contextual internal links
- Valid canonical and metadata fields

Noindex if any are true:
- Missing required data fields
- Duplicate keyword ownership conflict
- Fails uniqueness threshold review

## Structured Data

- Organization + WebSite schema at site level.
- Product schema on product-bearing pages.
- FAQPage schema only when FAQ content is complete and page-specific.
- BreadcrumbList schema on multi-level spokes.

## QA Checklist

- [ ] URL slug and canonical are aligned.
- [ ] Title/H1 intent alignment is unique.
- [ ] Index/noindex decision matches gating rules.
- [ ] Internal links connect to hub + related spokes.
- [ ] Structured data validates in Rich Results/Schema validator.
