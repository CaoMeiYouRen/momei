---
source_branch: master
last_sync: 2026-04-21
translation_tier: summary-sync
---

# Documentation Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/documentation.md) shall prevail.
:::

## 1. Overview

These standards define how Momei documentation is written, organized, translated, and maintained so that both human contributors and AI agents can rely on the same documentation contract.

## 2. Directory Structure

All documentation must live under `docs/` and follow these buckets:

- `docs/guide/`: Quick Start, deployment, development, and AI collaboration guides.
- `docs/standards/`: Development, testing, security, planning, and documentation standards.
- `docs/design/`: High-level architecture, UI, API, database, and module design docs.
- `docs/plan/`: Roadmap, TODO, backlog, and archives.
- `docs/i18n/<locale>/`: Physical storage for translated docs.

Additional rules:

- Public site URLs must remain `/<locale>/...`; the physical `i18n/` segment must never leak into public routes.
- After the migration, legacy `docs/<locale>/` directories must stay removed and must not be recreated; create or update translated pages only under `docs/i18n/<locale>/`.

## 3. Writing Rules

- Each document must have exactly one H1.
- Heading levels must remain sequential.
- Internal document links must use relative paths.
- Prefer tables, lists, and Mermaid for non-trivial structures and workflows.

## 4. Translation Rules

- Every translated page must include `source_branch` and `last_sync`.
- Translated pages now follow three freshness tiers: `must-sync`, `summary-sync`, and `source-only`.
- Every translated page must keep a translation notice that points back to the Chinese source of truth.
- Translated docs should mirror the structure and filenames of the Chinese source under `docs/i18n/<locale>/`.
- If a straggler translated page is still found under `docs/<locale>/`, move it to `docs/i18n/<locale>/` and delete the legacy copy in the same change. Do not recreate legacy locale directories.

### 4.1 Freshness Tiers

| Tier | Window | What it allows |
| :--- | :--- | :--- |
| `must-sync` | 30 days | Public-entry docs that must stay operationally aligned with the Chinese source |
| `summary-sync` | 45 days | Maintained summaries that may be shorter than the Chinese source but must reflect the latest rules |
| `source-only` | No day-based SLA | Locale URL kept as a source entry that explicitly sends readers back to the Chinese source |

Current scope highlights:

- `en-US` keeps home, quick start, deploy, and translation governance in `must-sync`.
- `en-US` keeps roadmap, development guide, and core high-frequency standards in `summary-sync`.
- `zh-TW` / `ko-KR` keep public entry pages in `summary-sync` and move deeper guides / standards / design pages to `source-only`.
- `ja-JP` keeps its current public release set in `summary-sync`.

`source-only` pages must declare `translation_tier: source-only` and `source_origin` in frontmatter and should no longer occupy locale navigation as if they were fully maintained translations.

## 5. Source of Truth Convergence

The canonical authority order remains:

1. `AGENTS.md`
2. `docs/standards/*.md`
3. `docs/design/*.md`
4. Platform adaptation files such as `CLAUDE.md`

Translation pages should therefore point back to Chinese originals instead of redefining project rules locally.

## 6. Site Maintenance

- New pages must update VitePress nav/sidebar configuration when relevant.
- Directory migrations must maintain both URL compatibility and correct edit links to the real source file.
- When a page is downgraded to `source-only`, update navigation scope and the page body in the same change. Do not hide the tier change in the script only.
- Do not edit `CHANGELOG.md` unless explicitly requested.
