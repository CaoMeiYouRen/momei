---
source_branch: master
last_sync: 2026-04-21
translation_tier: must-sync
---

# Translation Governance and Contribution Flow

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/translation-governance.md) shall prevail.
:::

## 1. Goal and Scope

This document defines how Momei manages multilingual product copy and documentation so we do not ship a language where the UI is translated but email, SEO, or regression coverage is still incomplete.

For docs specifically, this page also defines which translated pages remain fully maintained, which pages are summary-only, and which locale URLs intentionally fall back to the Chinese source of truth.

It applies to:

- App UI locale files
- Email locale packs
- Public documentation pages
- Documentation repository paths and public URL mapping
- SEO, sitemap, and fallback rules related to language publishing

## 2. Release Levels

New languages use staged readiness levels:

- `draft`: local verification only, not exposed in the public language switcher.
- `ui-ready`: core UI, locale entry points, fallback chain, and baseline quality checks are complete.
- `seo-ready`: email, SEO, sitemap, and regression checks are complete on top of `ui-ready`.

Rules:

- Start with `ui-ready` by default.
- Do not promote a language to `seo-ready` without regression coverage.
- If a fast-moving module stays in Chinese, document that decision explicitly.

## 3. Coverage Checklist

Every language rollout should verify these five gates:

1. Module parity for high-frequency domains such as `common`, shared components, public pages, auth, settings, home, and legal.
2. UI dependencies such as PrimeVue locale, Locale Registry, language switcher, and date/number formatting.
3. Email coverage for verification, password reset, OTP, magic link, and security notifications.
4. SEO coverage for locale routing, canonical, hreflang, sitemap, and readiness status.
5. Docs coverage with at least an accessible home page, quick start page, and translation governance page.

## 3.1 Runtime Boundaries and Copy Ownership

- Route-level locale modules continue to load on demand through the global middleware rather than being promoted into full startup payloads.
- Shared components must not assume a page already loaded optional locale message modules. Reuse the runtime dependency pattern already enforced around locale-module loading.
- Keep page-private copy in page namespaces, module-shared copy in module namespaces, and only move genuinely global wording into shared namespaces.

## 4. Document Freshness Tiers

Documentation translations no longer use one blanket 30-day rule. They now follow three tiers:

| Tier | Freshness window | Allowed shape | Current examples |
| :--- | :--- | :--- | :--- |
| `must-sync` | 30 days | Operationally equivalent public-entry translation | `en-US` home, quick start, deploy, translation governance |
| `summary-sync` | 45 days | Maintained summary that may be shorter than the Chinese source | English roadmap summary, development guide, planning / documentation / security / testing standards, public entry pages in `zh-TW`, `ko-KR`, and `ja-JP` |
| `source-only` | No day-based SLA | Locale URL kept as a source link instead of a maintained translation body | Design pages, de-scoped deep guides, and low-frequency standards |

## 5. Current Locale Scope

- `en-US`: public entry pages stay `must-sync`; roadmap, development guide, and core high-frequency standards stay `summary-sync`; design pages, `guide/ai-development`, `guide/comparison`, and `standards/api` are now `source-only`.
- `zh-TW` / `ko-KR`: public entry pages, `features`, `variables`, and roadmap stay `summary-sync`; deep guides, design pages, and standards fall back to `source-only`.
- `ja-JP`: home, quick start, deploy, translation governance, and roadmap summary remain the maintained public set.

Source-only pages must still keep the locale URL plus a direct link back to the Chinese source. They should not keep occupying locale navigation as if they were fully maintained pages.

## 6. Blocker Gates and Minimum Checks

| Scenario | Minimum commands | Blocker rule |
| :--- | :--- | :--- |
| Doc translation changes | `pnpm docs:check:source-of-truth` + `pnpm docs:check:i18n` | Any mismatch between declared page tier and freshness scope is a blocker |
| Locale message or runtime loading changes | Above commands + `pnpm lint:i18n` + `pnpm i18n:audit:missing` + `pnpm i18n:verify:runtime` | Missing keys and runtime-loading regressions are blockers |
| Release / phase close | `pnpm regression:pre-release` or `pnpm regression:phase-close` | Do not replace the fixed regression entry with ad-hoc command picking |

## 7. Terminology Rules

- Keep product names, protocols, vendors, and major technical names untranslated when appropriate: `OpenAI`, `Cloudflare R2`, `Live2D`, `VAPID`.
- Use one translation per term inside the same target language.
- Reuse existing project terminology for governance words such as `Locale Registry`, `readiness`, and `fallback`.
- Traditional Chinese must not contain Simplified Chinese leftovers. Korean pages should not expose raw English placeholders in user-facing UI.

## 8. Contribution Flow

### 8.1 Before Starting

1. Define the target language and whether the work is for `ui-ready` or `seo-ready`.
2. Check whether app locales, email locales, and docs directories already exist.
3. Update the active phase status in [todo.md](../../../plan/todo.md).

### 8.2 During Translation

1. Prioritize high-frequency flows first.
2. When adding docs, start with the home page, quick start, and translation governance page.
3. Store translated docs physically under `docs/i18n/<locale>/` while keeping public site URLs at `/<locale>/...`.
4. The directory migration is now complete, so do not keep or recreate `docs/<locale>/`; if a straggler page is found there, move it into `docs/i18n/<locale>/` in the same change and keep rewrites plus edit-link mapping aligned.
5. If a module is intentionally untranslated, link to the source language instead of leaving placeholders.
6. If a page is downgraded to `source-only`, add `translation_tier: source-only`, `source_origin`, and a visible note telling readers to use the Chinese source.

### 8.3 Before Merging

Run at least:

```bash
pnpm docs:check:source-of-truth
pnpm docs:check:i18n
pnpm lint
pnpm lint:i18n
pnpm typecheck
pnpm i18n:audit:missing
```

For locale message runtime or release work, continue with:

```bash
pnpm i18n:verify:runtime
pnpm typecheck
```

If email or critical business flows changed, run focused tests as well.

## 9. Regression Checklist

1. Confirm that the language switcher exposes the locale correctly.
2. Scan public pages and key admin pages for untranslated placeholders.
3. Verify that email locales are independently registered.
4. Confirm that i18n audit passes with no missing keys.
5. Confirm that the docs home page and quick start page are reachable.
6. Confirm that source-only pages are no longer promoted in locale navigation and still point to the Chinese source.

## 10. Delivery Notes

For translation-related pull requests, include:

- Languages and modules covered in this round
- Whether dedicated email locales were added
- Whether docs pages were added
- Validation commands that were executed
- Remaining gaps or known residuals
