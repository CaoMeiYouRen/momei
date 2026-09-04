---
source_branch: master
last_sync: 2026-09-04
translation_tier: summary-sync
source_origin: docs/standards/documentation.md
---

# Documentation Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/documentation.md) shall prevail.
:::

## 1. Overview

These standards define how Momei documentation is written, organized, translated, and maintained so that both human contributors and AI agents can rely on the same documentation contract.

## 2. Directory Structure

All documentation must live under `docs/` and follow these buckets:

- `docs/design/`: Technical architecture, UI/UX, API design, and deep module analysis.
  - `docs/design/modules/`: Stable high-level entry docs for core modules (auth, posts, comments).
  - `docs/design/governance/`: Governance topics, migration plans, execution matrices, and phase reviews.
- `docs/guide/`: User manual, Quick Start, deployment, development, and AI collaboration guides.
- `docs/plan/`: Roadmap, backlog, TODO, and planning-side summaries and migration notes.
- `docs/reports/regression/`: Regression record management, the active regression window, and module/date archives.
- `docs/standards/`: Development, testing, security, planning, and documentation standards.
- `docs/i18n/<locale>/`: Physical storage for translated docs (e.g. `docs/i18n/en-US/`).

Additional rules:

- Public site URLs must remain `/<locale>/...`; the physical `i18n/` segment must never leak into public routes.
- After the migration, legacy `docs/<locale>/` directories must stay removed and must not be recreated; create or update translated pages only under `docs/i18n/<locale>/`, otherwise VitePress will generate duplicate routes.

## 3. Writing Standards

### 3.1 Headings & Hierarchy

- Each document must have exactly one H1.
- Use `##`, `###` sequentially; skipping levels is forbidden.
- Use numeric numbering (`1.`, `2.`) for major sections and unordered lists for sub-items.

### 3.2 Style & Tone

- Professional, concise technical language; prefer lists and tables.
- Keep terminology consistent across the site (e.g. Slug, i18n, Nitro, Auth).

### 3.3 Links & References

- Use relative paths for internal links and `#` anchors for sections.
- Use full HTTPS links for external references.

### 3.4 Enhanced Content

- Code blocks must declare a language.
- Prefer Mermaid for complex logic/architecture diagrams; bitmap screenshots are forbidden for architecture.
- Use VitePress containers (`::: info`, `::: tip`, `::: warning`, `::: danger`).

### 3.5 No Historical Narrative

Standard files **only describe the current rule** — never present rules through historical narrative anchors. The goal: as the standard evolves over time, the document does not accumulate anchors like "since YYYY-MM", "widened from X", "as of YYYY-MM", "soft ceiling raised from X to Y", etc.

Concrete constraints:

1. **No time anchors**: Forbidden in `docs/standards/**/*.md`, `docs/guide/**/*.md`, `docs/design/modules/**/*.md`, and the planning documents (`docs/plan/*.md` and `docs/plan/archive/*.md` excluding `todo.md` / `todo-archive.md` / `backlog.md` / `roadmap.md` and the shard archives `todo-archive-phases-*.md` / `roadmap-phases-*.md` / `archive/index.md`):
    - English: `as of <date>`, `widened from X`, `since YYYY-MM`, `<legacy YYYY> previously X`, `soft ceiling raised from X to Y`, `prior tier was X, now Y`, `we previously required X, now Z`, `new signal (effective <N-MM-DD>)`.
    - Chinese equivalents: `"自 YYYY-MM 起"`, `"由 X 放宽到 Y"`, `"由 X 调整为 Y"`, `"自 N 年 M 月由 X 放宽"`, `"前版本 Y 现改为 Z"`, `"新策略（<N-MM-DD> 落地）"`.
    - Translations: i18n mirrors must also drop the time anchor expression; summary-sync only renders the current rule.
2. **Single-point governance for history**: Why the rule changed, what changed, and downstream impact **must** be captured in a single-point doc at `docs/design/governance/[YYYY-MM-DD]-*.md`, then linked back from the standard via a single inline link. A standards file carrying historical anchors with no matching governance doc is **non-compliant**.
3. **Execution rhythm**: Edit the governance doc **first** (commit message points to the affected standards section), then ship the standards edit in a follow-up commit that single-point-links the doc. Never leave a standards change with no matching governance entry, and vice versa.
4. **Same-PR closure**: Spec edit + governance doc must land in the same PR or in adjacent commits — no "spec now, governance doc later" deferral.
5. **Review Gate hook**: This clause is wired into `code-quality-auditor`'s reference checklist (see `.github/skills/code-quality-auditor/references/review-checklist.md`); audits touching `docs/standards/**/*.md`, `docs/guide/**/*.md`, `docs/design/modules/**/*.md` must scan for time anchors and reject violations.

#### 3.5.1 Planning-doc Exception (Why planning files are carve-out)

The four planning files at the repo root (`todo.md` / `todo-archive.md` / `backlog.md` / `roadmap.md`) and the shard archives under `docs/plan/archive/` (`todo-archive-phases-*.md`, `roadmap-phases-*.md`, `archive/index.md`) inherently **carry historical record and status-transition narrative** by design — e.g. "completed on `<date>`", "phase X has been collected and audited", "slice Y was promoted to phase Z". Forbidding time anchors in those files would defeat their purpose. They are explicitly carved out from §3.5 Item 1. **Translation mirrors of these files must use the same semantic scope** (i.e. only `docs/i18n/<locale>/plan/roadmap.md` deserves a translation; `todo.md` / `backlog.md` / `todo-archive.md` stay Chinese, see §4.3).

Effective-date / change history: when a standards file does need a historical change, the rationale lives in the matching `docs/design/governance/` date-named governance doc. Active example: [`docs/design/governance/2026-08-29-docs-source-of-truth-freshness-redesign.md`](../../../design/governance/2026-08-29-docs-source-of-truth-freshness-redesign.md) (translation freshness judgement refactor).

## 4. Internationalization

The project follows a "multilingual divide and conquer" strategy: prioritize syncing core documents, and keep fast-moving module docs in Chinese unless stable.

### 4.1 Core Principles

1. **Tiered translation**: Not every document needs translation; prioritize docs that matter to external users and new bloggers.
2. **Tiered freshness**: Translated pages follow `must-sync`, `summary-sync`, and `source-only` tiers; not all pages share one time window.
3. **Source parity**: Translated docs live under `docs/i18n/<locale>/` and must mirror the directory structure and filenames of `docs/`; VitePress rewrites keep repository paths decoupled from public URLs.
4. **Freshness declaration**: Every translated page must declare a "translation version notice" pointing back to the Chinese original (Source of Truth).
5. **Human + AI collaboration**: LLMs may produce the first translation draft, but terminology must be reviewed by a human or the `documentation-specialist` agent.

### 4.2 Supported Translation Locales

| Locale | Status | Directory | Notes |
| :-- | :-- | :-- | :-- |
| `en-US` | Supported | `docs/i18n/en-US/` | Default external collaboration language. Home and core public guides stay `must-sync`; development / standards entries are mostly `summary-sync`. |
| `zh-TW` | Supported | `docs/i18n/zh-TW/` | Traditional Chinese reading experience; progressive "public entry summary sync + deep pages fall back to Chinese source". |
| `ko-KR` | Supported | `docs/i18n/ko-KR/` | Public entry summary sync first; deep pages default back to the Chinese source. |
| `ja-JP` | Supported | `docs/i18n/ja-JP/` | README, home, quick start, deploy, translation governance, and roadmap summaries synced, with mail/SEO/sitemap and regression verification completed. |

The Chinese originals (`docs/`) remain the single source of truth; `ja-JP` and `ko-KR` use progressive sync and do not promise full module translation by default.

### 4.3 Scope Assessment

| Directory / File | Translation requirement | Strategy |
| :-- | :-- | :-- |
| `README.md` (root) | **Full, mandatory** | At least generate `README.en-US.md`; other approved locales may add `README.<locale>.md` phase by phase. |
| `docs/guide/` | **Full, mandatory** | User manual (Quick Start, deploy, features) must stay bilingual. |
| `docs/standards/` | **Highly recommended** | Relatively stable; translate to guide global contributors. |
| `docs/design/` | **High-level only** | Translate global designs (UI, database, API), not module internals. |
| `docs/design/modules/` | **Not translated** | Module designs change frequently; keep Chinese. |
| `docs/design/governance/` | **Not translated** | Governance and phase reviews iterate faster; Chinese source only. |
| `docs/plan/` | **Partial** | Only translate completed phases of `roadmap.md`; `backlog.md` and `todo.md` stay Chinese. |
| `docs/plan/todo.md` | **Not translated** | Task management file; Chinese only. |

Package READMEs under `packages/` are provided in Chinese and English only, and the two versions must stay consistent.

### 4.3.1 Freshness Tiers & Locale Scope

| Tier | Soft freshness ceiling (warning-only) | Allowed content form | Current typical scope |
| :-- | :-- | :-- | :-- |
| `must-sync` | `60` days | Operationally equivalent translation covering the real current entry and flows | `en-US` home, Quick Start, deploy, translation governance |
| `summary-sync` | `120` days | Summary sync keeping the Chinese source link | `en-US` roadmap / development guide / core high-frequency standards; `zh-TW` / `ko-KR` / `ja-JP` public entries and high-frequency guides |
| `source-only` | No day SLA; must declare "Chinese source first" | Locale URL kept, no ongoing translation promise | Low-frequency design pages, low-frequency guides, deprecated deep standards |

Current locale scope matrix:

| Locale | `must-sync` | `summary-sync` | `source-only` |
| :-- | :-- | :-- | :-- |
| `en-US` | `index`, `guide/quick-start`, `guide/deploy`, `guide/translation-governance` | `plan/roadmap`, `guide/development`, `guide/features`, `guide/variables`, `standards/planning`, `standards/documentation`, `standards/security`, `standards/testing`, `standards/development`, `standards/ai-collaboration` | `design/*`, `guide/ai-development`, `guide/comparison`, `standards/api` |
| `zh-TW` | None | `index`, `guide/quick-start`, `guide/deploy`, `guide/translation-governance`, `guide/features`, `guide/variables`, `plan/roadmap` | `design/*`, `guide/development`, `guide/ai-development`, `guide/comparison`, `standards/*` |
| `ko-KR` | None | Same as `zh-TW` | Same as `zh-TW` |
| `ja-JP` | None | `index`, `guide/quick-start`, `guide/deploy`, `guide/translation-governance`, `guide/features`, `guide/variables`, `plan/roadmap` | Same as `ko-KR` |

### 4.4 Standard for Translated Docs

1. **Header notice**: use a VitePress `::: warning` container pointing to the Chinese original.
2. **Frontmatter**: every translated doc must carry sync metadata for freshness auditing:

   ```yaml
   ---
   source_branch: master
   last_sync: 2026-08-07  # ISO date
   translation_tier: summary-sync # must-sync | summary-sync | source-only
   # source_origin: ../../../guide/ai-development.md # required for source-only pages
   # optional: source_hash: <git_commit_hash>
   ---
   ```

3. **`source-only` requirements**: declare `translation_tier: source-only` and `source_origin` in frontmatter; state at the top of the body that the page is no longer continuously maintained; and stop occupying locale navigation / sidebar main entries.

### 4.5 Roadmap Sync

`roadmap.md` follows progressive translation:

1. **Completed phases**: must provide complete, high-quality equivalent translations.
2. **Planning / backlog phases**: translate the second/third level headings to show the blueprint, keep body content untranslated with a placeholder note (`> [!NOTE] Content in progress...`), and avoid stale English descriptions caused by frequent roadmap tweaks.

## 5. Special File Maintenance

### 5.0 Module vs Governance Layering

`docs/design/modules/` and `docs/design/governance/` serve different roles and must not mix:

1. Keep one stable high-level entry per topic in `docs/design/modules/` (e.g. `system.md`, `i18n.md`, `migration.md`).
2. `docs/design/governance/` hosts `*-governance.md`, `*-unification.md`, `*-optimization.md`, `*-report.md`, execution matrices, and cross-module evaluations.
3. Governance docs must explicitly link back to their main design doc or unique source of truth.
4. Design docs must not carry TODO-list content pointing at `todo.md`; not-yet-implemented work belongs in `roadmap.md` or "future enhancement directions".
5. New design docs must first be classified as "stable module total design" vs "governance / incremental design / phase review" before choosing a directory.
6. Severely drifted governance docs should be rewritten as delta docs or archived/deleted.
7. Medium-to-large changes touching new modules, cross-module boundary rewrites, or contract changes must land a design doc before large-scale implementation.

### 5.1 Regression Record Governance

Regression records are managed under `docs/reports/regression/` instead of `docs/plan/`:

1. `docs/reports/regression/index.md` is the management and index entry explaining the current window, archive layering, and migration state.
2. New regression bodies go to `docs/reports/regression/current.md`, keeping only the last 1-2 phases or 6-8 full records.
3. Historical records are split into `docs/reports/regression/archive/` module/date shards; split further by year or half-year when they grow.
4. Planning docs only keep summaries and migration notes, not full regression bodies.
5. When the active window exceeds 500-700 lines or 6-8 full records, rotate archives before appending new records.
6. Standards and audit docs reference `docs/reports/regression/index.md` as the single entry.

Deep-archive thresholds (enforced by `pnpm docs:check:line-count`): root `README*` `<= 300` lines healthy; `roadmap.md` `<= 800`; `backlog.md` / `todo-archive.md` / `docs/reports/regression/current.md` `<= 500`; warning bands and error lines are encoded in the check script, which blocks `docs:build` and release/phase-close gates when exceeded.

### 5.2 Root README Multi-language Mirrors

Each `README.<locale>.md` mirror must include: project intro and core value proposition, feature list, tech stack, quick-start links (to the matching locale docs site), and cross-links at the top covering at least Chinese and English. READMEs keep only portal-style summaries; implementation details and long phase records must link back to the source-of-truth pages under `docs/`.

### 5.3 Plan Docs

- `roadmap.md`, `backlog.md`, and `todo.md` maintenance must follow the [Planning & Evaluation Standards](./planning.md).
- Phase archiving and next-phase planning must follow the Phase Archive Workflow in the planning standards; do not skip the fixed order "admission check -> evidence chain -> doc sync -> Review Gate -> next-phase gate".
- When a current-phase item hits the Design-First Gate, `roadmap.md` / `todo.md` must explicitly state "complete the design doc first, then implement".
- All planning/standards/Markdown changes need at least one review round before commit; "docs only" is not an excuse to skip review.
- Regression records migrate to `docs/reports/regression/`; planning docs keep only phase-related summaries and links.

## 6. Source of Truth Convergence

### 6.1 Authority Layers

| Layer | Document | Constraint |
|------|------|------|
| L0 | `AGENTS.md` | Project-level AI behavior rules, role boundaries, security red lines, PDTFC+ workflow |
| L1 | `docs/standards/*.md` | Specialized development standards (development, API, testing, security, docs) |
| L2 | `docs/design/*.md` | Architecture and module design |
| L3 | `CLAUDE.md` / platform adaptation files | Tool differences and fallback strategies |

### 6.2 Convergence Rules

1. **No duplicate definitions**: lower-layer docs must not re-define rules already defined at higher layers.
2. **Reference first**: when the same content appears in multiple places, reference the unique source of truth instead of repeating it.
3. **Version traceability**: translated docs must carry `last_sync`. The exact freshness semantics live in [§ 6.3](#63-translation-freshness-judgement).

### 6.3 Translation Freshness Judgement

Enforced by `scripts/docs/check-source-of-truth.mjs` (see the script-level docblock plus `tests/scripts/check-source-of-truth.test.ts`). Why this judgement is used is recorded in [`docs/design/governance/2026-08-29-docs-source-of-truth-freshness-redesign.md`](../../../design/governance/2026-08-29-docs-source-of-truth-freshness-redesign.md).

| Condition | Behaviour |
|:---|:---|
| Source has any git commit after `last_sync` | **error** (translation must catch up) |
| Source has no git commit after `last_sync`, and `last_sync` within the tier ceiling | pass |
| Source has no git commit after `last_sync`, but `last_sync` exceeds the tier ceiling | **warning** (soft signal, no block) |
| Translated doc has no `last_sync` | error |
| Source cannot be located / missing | error |

**Tier soft ceilings** (warning-only):

| Tier | Soft `maxAge` |
|:---|:---|
| `must-sync` | 60 days |
| `summary-sync` | 120 days |
| `source-only` | `null` |

**Source-path resolution** (three-layer fallback; on miss the next layer is tried):

1. `frontmatter.source_origin` (explicit declaration, repo-relative)
2. The first relative path after an anchor such as `original Chinese version` / `Chinese version` / `原始中文` / `中文原文` inside the document body
3. The directory convention `docs/i18n/<locale>/<path>` ⇄ `docs/<path>`

**`source-only` pages** must declare `translation_tier: source-only` and `source_origin` in their frontmatter, and their freshness is not checked by days.

**Entry points**:

| Command | Behaviour | Blocking? |
|:---|:---|:---|
| `pnpm docs:check:source-of-truth` (default profile, error mode) | Used by weekly regression. error blocks. | **Yes**, and only when the source actually changed in git |
| `pnpm docs:check:source-of-truth --mode=warn` | Demotes every error to a warning for display; exit code is unchanged | Display only |
| `pnpm docs:check:source-of-truth:candidate` (candidate profile, warn mode) | Keeps the legacy 21/30-day thresholds as a tightening baseline | Display only |

Agents citing a doc should still check the `last_sync` timestamp in its frontmatter, and cross-check `git blame` on the corresponding source path to see whether the source moved after `last_sync`. Run `pnpm i18n:audit` periodically for unsynced translation keys.

### 6.4 Maintenance Ownership

| File | Owner | Update trigger |
|------|-----------|-------------|
| `AGENTS.md` | Project owner | Agent system, PDTFC+ workflow, security red line changes |
| `CLAUDE.md` | `@documentation-specialist` | Re-check after major `AGENTS.md` changes |
| `docs/standards/*.md` | Standards owners | Standards content changes |
| `docs/design/*.md` | Architecture owners | Architecture or module design changes |

## 7. Site Configuration

Docs are built with VitePress; config lives in `docs/.vitepress/config.ts`.

- **Nav / Sidebar**: add new `.md` files to the matching sidebar group; update nav for major directory or external link changes.
- **Search & SEO**: keep new page titles clear enough for local search.
- **Rewrites**: after moving translated pages to `docs/i18n/<locale>/`, maintain rewrites so external URLs stay `/<locale>/...`.
- **Edit link**: `editLink` must point to the real source file so "Edit this page" never falls back to old directories.
- **Duplicate-page blocking**: run `pnpm docs:check:i18n` before every docs build; clean up any legacy `docs/<locale>/` recurrence or dual translation sources before continuing.

## 8. AI Synergy

1. **Auto-sync**: after implementing a feature (Do), check whether related design or guide docs need updates.
2. **Path awareness**: confirm the current directory before touching docs so links stay correct.
3. **Review awareness**: doc, planning, and archive changes need review with a clear conclusion or issue list.
4. **Archive awareness**: regularly move completed `todo.md` entries to `todo-archive.md`.
5. **CHANGELOG**: never edit `CHANGELOG.md` manually unless explicitly instructed; it is maintained by the pipeline.

## 9. Related Documents

- [Development Standards](./development.md)
- [Planning & Evaluation Standards](./planning.md)
- [AI Collaboration Standards](./ai-collaboration.md)
