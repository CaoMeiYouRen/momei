---
source_branch: master
last_sync: 2026-03-19
---

# Translation Governance and Contribution Flow

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/translation-governance.md) shall prevail.
:::

## 1. Goal and Scope

This document defines how Momei manages multilingual product copy and documentation so we do not ship a language where the UI is translated but email, SEO, or regression coverage is still incomplete.

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

## 4. Terminology Rules

- Keep product names, protocols, vendors, and major technical names untranslated when appropriate: `OpenAI`, `Cloudflare R2`, `Live2D`, `VAPID`.
- Use one translation per term inside the same target language.
- Reuse existing project terminology for governance words such as `Locale Registry`, `readiness`, and `fallback`.
- Traditional Chinese must not contain Simplified Chinese leftovers. Korean pages should not expose raw English placeholders in user-facing UI.

## 5. Contribution Flow

### 5.1 Before Starting

1. Define the target language and whether the work is for `ui-ready` or `seo-ready`.
2. Check whether app locales, email locales, and docs directories already exist.
3. Update the active phase status in [todo.md](../../../plan/todo.md).

### 5.2 During Translation

1. Prioritize high-frequency flows first.
2. When adding docs, start with the home page, quick start, and translation governance page.
3. Store translated docs physically under `docs/i18n/<locale>/` while keeping public site URLs at `/<locale>/...`.
4. The directory migration is now complete, so do not keep or recreate `docs/<locale>/`; if a straggler page is found there, move it into `docs/i18n/<locale>/` in the same change and keep rewrites plus edit-link mapping aligned.
5. If a module is intentionally untranslated, link to the source language instead of leaving placeholders.

### 5.3 Before Merging

Run at least:

```bash
node scripts/i18n/audit-locale-keys.mjs --fail-on-missing
pnpm docs:check:i18n
pnpm lint
pnpm typecheck
```

If email or critical business flows changed, run focused tests as well.

## 6. Regression Checklist

1. Confirm that the language switcher exposes the locale correctly.
2. Scan public pages and key admin pages for untranslated placeholders.
3. Verify that email locales are independently registered.
4. Confirm that i18n audit passes with no missing keys.
5. Confirm that the docs home page and quick start page are reachable.

## 7. Delivery Notes

For translation-related pull requests, include:

- Languages and modules covered in this round
- Whether dedicated email locales were added
- Whether docs pages were added
- Validation commands that were executed
- Remaining gaps or known residuals
