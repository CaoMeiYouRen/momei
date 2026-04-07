---
source_branch: master
last_sync: 2026-04-07
---

# Momei - Project Roadmap

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../plan/roadmap.md) shall prevail.
:::

This document outlines the development blueprint for the project. For specific task execution status, please refer to the [Todo List](../../../plan/todo.md) (Chinese Only). The long-term backlog now lives in the Chinese-only [backlog document](../../../plan/backlog.md).

## Latest Status Snapshot

- **Stage 21 has been audited and archived**: The validation entry workflow, script entry consolidation, taxonomy translation decoupling, and default cover typography cleanup have been fully closed in the Chinese source of truth.
- **Stage 22 has now been audited and archived**: Test effectiveness, operationalized periodic regression, batch translation orchestration assessment, phased ESLint tightening, time and date source-of-truth consolidation, and the top-bar admin post-management entry have all been closed in the Chinese source of truth.
- **Stage 23 has now been audited and archived**: Multilingual social and sponsorship platform expansion, Vercel-side AI media timeout compensation, daily dependency-risk automation, longer-lived realtime ASR credentials, and related-post discovery on article detail pages have all been closed in the Chinese source of truth.
- **Next-stage note**: The next phase remains at candidate-analysis level only; no formal Stage 24 has been written into the canonical Chinese roadmap or todo yet.
- **Scope note**: Full acceptance criteria and task decomposition remain Chinese-only in the canonical [roadmap](../../../plan/roadmap.md) and [todo](../../../plan/todo.md).

## 1. Project Overview

**Project Name**: Momei

**Goal**: Build an **AI-driven, native i18n** developer blog platform to empower "AI-assisted, Global Creation."

**Core Value Propositions**:

-   **Tech Stack**: Nuxt + TypeScript (Modern, SSG/SSR Hybrid).
-   **Differentiation**: Native internationalization (i18n), AI-assisted translation/content generation, Desktop application (Tauri), Smooth migration support (Path aliases).
-   **Target Audience**: Developers, technical authors, cross-border creators.
-   **Privacy First**: Login only required for comments and subscriptions, prioritize anonymous access to minimize user friction.

## 2. Development Roadmap

### Stage 1: MVP (Minimum Viable Product) (Completed)

**Timeline**: ~1.5 months

**Goal**: Validate the core content creation-display-basic i18n loop and migration capabilities.

#### Core Modules (P0)

1.  **Content Management (Lite)**
    -   **Editor**: Markdown support (Syntax highlighting, drag-and-drop image upload).
    -   **Lifecycle**: Create, Edit, Delete, Draft (Auto-save).
    -   **Migration Support**: **Path Aliases (Custom URL Slug)** - Critical for preserving SEO during migration.
    -   **Media**: Single image upload.
    -   **Taxonomy**: Basic category management.
2.  **User System (Lite)**
    -   **Auth**: Email/Password and OAuth (via `Better-Auth`, supporting GitHub, Google, etc.).
    -   **Logout**: Added logout button for secure session termination.
    -   **Anonymous Access**: Default support for anonymous browsing without login.
    -   **Anonymous Management**: Defined permissions and behavior rules for anonymous users.
    -   **Roles**: Creator (Admin) vs. Guest.
    -   **User Management**: Admin can view user lists, adjust roles, and disable accounts.
    -   **Personal Center**: Article management and profile editing.
3.  **Content Display**
    -   **Pages**: Home (Pagination), Article Detail (TOC), Archive.
    -   **Search**: Basic keyword search (Local filtering or simple DB query).
    -   **Responsive**: PC and Mobile support with a focus on mobile navigation (Hamburger menu).
    -   **Themes**: Light/Dark mode with persistence.
    -   **SSR**: Ensure core pages (Home, Article) are server-side rendered for SEO.
    -   **PV Stats**: Basic page view tracking with anti-spam logic.
4.  **Internationalization (Basic)**
    -   **UI**: Lang switcher (ZH/EN).
    -   **Routing**: Prefix strategy via `nuxt-i18n` (default is root, en is `/en/...`).
    -   **Content**: Manual translation support.
5.  **Security & Config**
    -   **Security**: XSS/CSRF protection, JWT for APIs.
    -   **Config**: Site name, Logo, Basic SEO Meta.

### Stage 2: Optimization & Monetization (Post-MVP) (Completed)

**Timeline**: +1 month

**Goal**: Enhance experience, introduce monetization, and expand differentiation.

1.  **AI Integration**:
    -   AI Title/Summary/Tag generation.
    -   AI URL Slug generation and Content translation (LLM-based).
    -   **Abuse Protection**: Rate limiting and usage monitoring for AI tasks.
2.  **Subscription System**:
    -   Global and **multi-dimensional (Category/Tag) RSS feeds**.
    -   Basic Email newsletter integration.
3.  **Enhanced Taxonomy**:
    -   Tag management and Translation for Tags/Categories.
4.  **Deep i18n Optimization**:
    -   **Admin I18n Labels**: Lang indicators in admin lists.
    -   **Unified Translation Management**: Grouping multi-language entities in the admin UI.
5.  **Experience Optimization**:
    -   Word count, Reading time, and Automated Copyright notices (CC BY-NC-SA 4.0).
    -   **Advanced Search**: Multi-dimensional filtering and Ctrl+K shortcut.
6.  **SEO & Integration**:
    -   Sitemap generation and Webmaster Tools verification.
    -   **External Posting API**: API-key-based article submission.
7.  **Compliance**:
    -   Terms of Service, Privacy Policy, and ICP registration support.
8.  **Demo Mode**:
    -   In-memory SQLite support for instant admin trial.

### Stage 3: Innovation & Expansion (Completed)

**Goal**: Build competitive barriers and transition from a "Blog Engine" to a "Developer Digital Asset Center."

1.  **Theme System**:
    -   Engine refactoring (Decoupled UI) and Online CSS variable editing.
    -   Sensory Experience: Mourning mode support.
2.  **Interactions & Privacy**:
    -   **Fine-grained Access**: Public, Private, Password, Subscriber-only, etc.
    -   **Native Comments**: High-performance system with likes and moderation.
    -   **Anti-spam**: Cloudflare Turnstile integration.
3.  **Rendering & Quality**:
    -   **Lighthouse Optimization**: Achieving high scores via preloading and compression.
    -   **Markdown Enhancement**: Code groups, Admonitions, GitHub alerts, Lightbox.
4.  **Geek Experience**:
    -   Zero-config startup via env-based feature detection.
5.  **Architecture Hardening**:
    -   Simplified Docker/Vercel deployment.
    -   Storage Evolution: Local Storage adapter with Serverless guards.
6.  **DevEx & AI Support**:
    -   Customizable `createdAt` and `views` for migration.
    -   **AI Dev Manual**: Modern docs for AI-assisted project expansion.
    -   **Copilot Hooks**: Security/Style intercepts and session summaries.

### Stage 4: Professionalization & Creative Empowerment (Completed)

**Goal**: Strengthen professional content presentation and build high-efficiency AI creative flows.

1.  **Professional Rendering**:
    -   Native $LaTeX$ support (KaTeX).
    -   Lighthouse Score (>= 90) across all 4 metrics.
2.  **Strategic AI Creative Flow**:
    -   Inspiration capture and AI-guided scaffolding (Outlining rather than just ghostwriting).
3.  **Ecosystem & Access**:
    -   **Momei CLI**: Fast migration tool for Hexo and other platforms.
    -   **Installation Wizard**: Web-based guided setup.
    -   Guest contribution workflow.
4.  **API & Core**:
    -   Removal of redundant logic via `assignDefined` and Zod schema-driven handlers.
5.  **Podcast Native Support**:
    -   Audio attachment management, automated metadata (via HEAD requests), and dedicated Podcast RSS feeds.

### Stage 5: Ecosystem Deepening (Completed)

**Goal**: Multimedia integration, commercialization, and full AI creative loop.

1.  **Advanced Subscription (P1)**:
    -   **Protocol Expansion**: Native support for Atom 1.0 and JSON Feed 1.1, optimized for Enclosures.
    -   **Subscription Hub**: Admin/User interface for granular subscription management.
2.  **Notification & Preference System (P1)**:
    -   **Channel Management**: Centralized UI for email/push notification preferences.
    -   **Marketing Admin**: Targeted campaign delivery based on user preferences.
3.  **Monetization & Growth (P2)**:
    -   **Multilingual Sponsorship**: Dynamic display of PayPal/Sponsors/Alipay links based on locale.
    -   **Private Traffic**: Integration of Wechat Official Account following guides.
4.  **AI Voice Creative Enhancement (P1)**:
    -   **Dual-mode ASR**: Web Speech API and Cloud ASR (SiliconFlow) integration.
    -   **Voice-to-Post**: Workflow for voice input to polished blog posts.
5.  **Advanced AI Creative Flow**:
    -   **Multimodal Tasks**: AI Cover generation (DALL-E 3, Stable Diffusion).
6.  **Hardening**:
    -   Complete English translation of deployment and development guides.
7.  **Third-party Integration**:
    -   One-click sync with Memos and Wechatsync.
8. **AI Agent & Automation Ecosystem**:
    - **MCP Server**: Native Anthropic MCP implementation.
    - **Scheduled Tasks**: Timed post publishing and email delivery.

### Stage 6: Global Experience & Creative Refinement (Completed)

**Timeline**: Jan 2026 - Feb 2026
**Goal**: Enhance creative security, multimedia productivity, and geek reading experience.

1. **Creative Security & Resilience**:
   - Local Auto-save: Editor snapshotting via LocalStorage.
   - Versioning: DB-level post history with rollbacks (3-5 versions).
   - Full Export: Batch Markdown export with Front-matter.
2. **Advanced Multimedia & AI**:
   - Audiofication (TTS): OpenAI/Azure TTS integration.
   - Cloud ASR: Unified SiliconFlow batch transcription controller.
   - AI Image Support: Gemini 3 Pro Vision and Stable Diffusion drivers.
3. **Geek UX Optimization**:
   - Reading Mode: Distraction-free panel with customizable typography.
   - Deep Mobile Adaption: Optimized layouts for nested components.
4. **Architecture & Ecosystem**:
   - Backend i18n: Nitro hooks for global error/email/RSS localization.
   - Notification Matrix: Hierarchical delivery based on AdminConfig x UserPreference.
   - MCP Validation: Verification against modern AI editors.

### Stage 7: System Hardening & Multimedia Evolution (Completed)

**Timeline**: ~1.5 months
**Goal**: Elevate security, metadata depth, and sensory experience.

1. **Podcast & Multimedia Evolution**:
    - **Text-to-Podcast**: LLM-driven dialog generation with distributed TTS tasks.
    - **Real-time ASR**: Low-latency streaming ASR controller.
2. **System Hardening & Security**:
    - **Permissions Audit**: Deep sanitization of API roles and tenant isolation.
    - **Metadata Management**: Fine-grained ENV/DB config unification.
3. **Sensory Experience Enhancement**:
    - **Live2D System**: Optional virtual companion for creation/reading.
    - **Visual Effects**: Optional particle backgrounds and smooth transitions.
4. **Performance & Optimization**:
    - **Lighthouse Redline**: CI gatekeeping for Lighthouse scores (>= 90).
    - **Extreme Loading**: Bundle size optimization and critical path rendering.

### Stage 8: Ecosystem Convergence & Protocol Delivery (Completed)

**Timeline**: ~1.5 months
**Goal**: Converge existing capabilities within Web architecture, focusing on setting unification and open protocols.

1. **System Config Unification**:
    - **Convergence**: Solidified `ENV -> DB -> Default` hierarchy with source labels.
    - **Auth Boundary**: Better-Auth ENV locking for security.
2. **Monetization & Ad Networks**:
    - **Ad Integration**: Native Google AdSense/Baidu Ads slots.
    - **Commercial Link Management**: Centralized management of referral/ad links.
3. **Open Federation**:
    - **ActivityPub Core**: Actor skeleton and WebFinger discovery for Fediverse.
4. **Extreme ASR Performance**:
    - **Speedup**: Direct-to-provider signing and Wasm-based compression.
5. **Serverless Ecosystem Integration**:
    - **Scheduled Triggers**: Native Vercel/Cloudflare Cron/Scheduled event triggers.

### Stage 9: Globalization Governance & Delivery Infrastructure (Completed)

**Timeline**: ~1.5 - 2 months
**Goal**: Scalable i18n, AI cost governance, and cloud delivery infrastructure.

1. **System Config UX Enhancements**:
    - **Source Indicators**: Background UI with source badges and lock reason tooltips.
2. **AI Cost Governance & Multi-user Quotas**:
    - **Governance Model**: Unified `AITask` usage auditing for AI/ASR/TTS.
    - **Quota Policies**: Role-based and user-level limits with threshold alerts.
3. **I18n Expansion & Modularization**:
    - **Locale Registry**: Solidified fallback strategies and modular translation loading.
4. **Multilingual SEO**:
    - **Deep Meta**: Unified `hreflang`, canonical, and JSON-LD output.
    - **Sitemap Alternates**: Multi-language support in sitemap.xml.
5. **Cloud Storage & Assets**:
    - **Browser Direct-upload**: Backend signing with direct-to-S3/Vercel Blob support.
    - **Asset Prefixes**: Unified CDN and storage path prefixes.


### Stage 10: Notification Closure & Global Experience Enhancement (Audited & Archived)

**Timeline**: ~1 - 1.5 months
**Goal**: Close the loop on notifications, language reach, and onboarding experience.

**Audit Conclusion**: Stage 10 has been fully closed in both code and documentation. Browser push delivery, engineering hardening, language expansion, and onboarding improvements are all live, and no stage-specific leftovers remain outside the backlog.

1. **Browser Push Reinforcement (P0)**:
    - **Full Loop**: Web Push now complements SSE for admin events and high-value async task completion.
    - **History & Audit**: Notification history, delivery logs, and channel-level tracking are now available in the app and admin UI.
2. **Code Quality & Engineering (P0)**:
   - **Type Sanitization**: Critical notification, settings, editor, and AI paths have been tightened with shared types and fewer implicit `any` boundaries.
   - **Decoupling**: Reused admin composables, utilities, and style fragments now back major CRUD and editor flows.
3. **I18n & L10n Enhancements (P1)**:
    - **Extensions**: Traditional Chinese and Korean have been integrated through readiness tiers, locale fallback rules, and translation governance.
    - **Regression Coverage**: Route, SEO, email, and key UI fallback paths were covered by targeted validation.
4. **User Experience Optimization (P1)**:
    - **Demo Enhancement**: Demo content, onboarding flow, and preview paths now better reflect real-world usage.
    - **Feedback Loop**: Lightweight public/admin feedback entry points and issue-routing guidance are now in place.

### Stage 11: Migration Governance & Automation Delivery Deepening (Audited & Archived)

**Timeline**: ~1.5 - 2 months
**Goal**: Strengthen migration controllability, version traceability, agreement governance, decoupled third-party distribution, and CLI / MCP automation so Momei can move from “feature complete inside the app” to “portable, auditable, and automation-friendly across tools.”

**Audit Conclusion**: Stage 11 has been fully delivered in code, admin workflows, and external tooling. The only remaining mismatch was documentation drift: the distribution-governance item had already shipped but was still unchecked in the plan docs. No Stage 11-specific leftovers remain outside the backlog.

1. **Linear Version Tracking & Rollback (P0)**:
    - **Git-style Linear History**: Posts now have a single-line version model with readable commit summaries, operator context, and recovery source metadata.
    - **History & Diff Review**: Admin users can inspect version history and compare adjacent or selected revisions through a consistent diff contract.
    - **Rollback Safety**: Recovery creates a new version instead of overwriting history, with explicit rollback boundaries and idempotent guards.
2. **Migration Link Governance & Cloud Asset Rewrite (P0)**:
    - **Asset URL Rewrite**: Historical asset URLs now support dry runs, domain filtering, bulk rewrite, and governance reporting.
    - **Legacy Link Mapping**: The migration stack now supports old-to-new mapping seeds across posts, taxonomy, archives, and static pages.
    - **Validation & Retry**: Static validation, optional online checks, retry handling, and admin-side report review are all part of the closure.
3. **Content Distribution Decoupling (P1)**:
    - **Manual Dispatch Control**: Publishing is no longer tightly coupled with Memos or WechatSync distribution, and admin users can dispatch manually from a dedicated panel.
    - **Clear Delivery Modes**: Update-existing, republish-new, retry, and terminate flows now share one state model with explicit user choice.
    - **Auditability**: Distribution timelines, failure reasons, retry state, and result write-back are now tracked consistently.
4. **CLI / MCP Automation Surface Expansion (P1)**:
    - **Translation Workflow**: CLI and MCP now support full-post translation with source-language overrides, preview confirmation, target-post updates, and translation-cluster backfill.
    - **Media Backfill**: Cover image generation and TTS / podcast audio generation can be triggered externally and auto-attach results back to posts.
    - **Automation Contract**: Task lookup, category/tag suggestions, and publish orchestration now share a stable external automation surface.
5. **Agreement Governance & Compliance Delivery (P1)**:
    - **Effective-Version Semantics**: Agreement governance now distinguishes authoritative language, effective version, and reference translations with one consistent runtime contract.
    - **Admin Constraints**: Environment-locked, user-accepted, and already-effective agreements now have clear edit restrictions and operator guidance.
    - **Public Presentation**: Public agreement pages now expose version number, effective date, updated date, and translation disclaimers consistently.

### Stage 12: Content Orchestration & Authoring Input Consolidation (Audited & Archived)

**Timeline**: ~1 - 1.5 months
**Goal**: Close the usability gap around homepage orchestration, reusable voice input, editor stability, and footer-branding semantics so the product can evolve without duplicating logic across multiple entry points.

**Audit Conclusion**: Stage 12 is complete in code, tests, and configuration flow. The homepage now ships with deduplicated latest/popular sections and pinning semantics, reusable voice input has been extracted into shared composables/components, footer copyright now consumes explicit site settings, and the admin-translation/Memos permalink/WechatSync/default-language regressions have all been fixed. The editor decision is also closed for this stage: keep the current `mavon-editor` async wrapper, and only revisit replacement work behind a no-regression gate.

1. **Homepage Orchestration & Post Pinning (P0)**:
    - Latest and popular homepage slots now run as separate sections with cross-slot deduplication and refill behavior.
    - `isPinned` is now part of the post model, admin editing flow, public queries, and card rendering.
    - Homepage and post-list ordering regressions are covered by targeted page/API tests.
2. **Reusable Textarea Voice Input (P1)**:
    - The shared `useVoiceInput`, trigger, and overlay layers now unify Web Speech and cloud ASR entry points.
    - Multi-line text areas no longer need page-specific voice-state duplication.
    - Composable tests cover mode switching, transcript reset, and baseline recording flow.
3. **Editor Compatibility Hardening & Incremental Replacement Plan (P1)**:
    - The current Markdown editor remains wrapped behind an async client-only adapter to avoid Nuxt 4 SSR/style-injection breakage.
    - Existing upload, preview, and fullscreen behavior stays in place.
    - Replacement work remains gated behind an explicit no-regression compatibility matrix.
4. **Footer Branding & Copyright Configuration (P1)**:
    - Footer copyright owner/year now flow through installation, admin settings, public settings, and frontend rendering.
    - Legacy keys and ENV aliases stay readable for upgrade compatibility.
    - Public-settings tests now verify the separation between footer copyright text and post default license.
5. **Multilingual Authoring & Distribution Hotfix (Hotfix)**:
    - The missing `translate_name_batch` i18n key is now present across admin locales.
    - Memos link write-back now normalizes instance URLs to public permalinks.
    - WechatSync completion, failure classification, operator feedback, and default-language option syncing are all back under test.

### Stage 13: Multilingual Creative Asset & Channel Distribution Deepening

**Timeline**: ~1 - 1.5 months
**Goal**: Build on the Stage 12 authoring/distribution baseline and close the next gap between localized content, localized assets, and multi-channel delivery.

**ROI Review**: Locale-specific cover/audio assets 1.80; channel-specific export templates and hashtag normalization 1.67; listmonk/newsletter external delivery 1.60; progressive long-text translation write-back 1.75; post-detail reading flow and SEO branding 1.67. All five items meet the next-stage entry threshold.

1. **Locale-specific Cover & Audio Assets (P0)**:
    - Generate cover prompts from the target-language title/summary instead of reusing the source-language asset blindly.
    - Bind TTS/podcast assets per locale with explicit `translationId` and language-aware backfill rules.
    - Add fallback and regression coverage for missing or mismatched media assets.
2. **Channel-specific Export Templates & Hashtag Adaptation (P0)**:
    - Split body, excerpt, cover, hashtags, and copyright footer rendering by channel instead of relying on one shared Markdown/HTML output.
    - Normalize hashtag cleanup, deduplication, length caps, and invalid-character stripping.
    - Provide a minimal preview/debug contract for the main distribution channels.
3. **External Newsletter Delivery Expansion (P1)**:
    - Add listmonk-oriented article/campaign delivery with audience mapping, idempotent updates, and failure write-back.
    - Sync the settings/ENV/docs contract so the integration is operable, not just coded.
    - Preserve auditability and regression coverage across the expanded delivery surface.
4. **Progressive Long-text Translation Write-back (P1)**:
    - Reuse the existing `/api/ai/translate.stream` capability in the post editor, and auto-switch between field-level live streaming and chunk-by-chunk write-back based on content length.
    - Expose field-level progress, partial translated content, and cancel/retry controls so long translations do not lose all intermediate output on failure.
    - Add regression coverage for SSE parsing, chunk merging, failure recovery, and threshold-based mode switching.
5. **Post Detail Reading Flow & SEO Branding (P1)**:
    - Add previous/next navigation on post detail pages using only same-locale, published, publicly accessible posts ordered by `publishedAt`.
    - Keep related-post recommendations as an optional enhancement so they do not block the first delivery of previous/next navigation.
    - Unify the default post-detail SEO template around the “Momei Blog” branding and AI-blog messaging while preserving custom `siteTitle` overrides.

### Stages 14-15: Configuration Governance & AI Collaboration Hardening (Audited & Archived)

- **Stage 14** closed multilingual settings governance, legal-text review flow, import-path guards, Cloudflare deployment wording, and admin settings UX alignment.
- **Stage 15** closed AI governance authority order, validation matrices, periodic regression templates, docs i18n directory migration, and the first `ja-JP` `ui-ready` rollout.
- During the Stage 15 audit, the repository also removed a stale `.claude/skills/git-flow-manager` mirror directory and extended `pnpm ai:check` to detect extra mirror files or directories.

### Stage 16: Governance Fact-Source Consolidation & Focused Regression Hardening (Audited & Archived)

**Timeline**: ~1 - 1.5 months
**Goal**: Close the remaining governance gaps around duplicated standards, loose Review Gate evidence, manual mirror maintenance, and narrow first-round regression coverage so the project can move from “rules written down” to “rules executable and reusable.”

**Audit Conclusion**: Stage 16 fully closed standards fact-source convergence, Review Gate evidence hardening, skills / agents mirror governance, and three dedicated regression tracks across code quality, docs-config-database sync, and clean smoke-performance-security baselines. No Stage 16-specific leftovers remain outside the backlog.

1. **Standards Fact-Source Convergence (P0)**:
    - Reduced duplicated gates across standards and linked back to one authoritative source wherever possible.
    - Rewrote stale API, security, and performance guidance to match the current request layer, auth boundaries, dependency governance, and performance-budget contracts.
2. **Review Gate Closure & Evidence Automation (P0)**:
    - Standardized review outputs around explicit failure reasons, pass conditions, severity levels, and recheck baselines.
    - Unified command-selection rules for code, styles, Markdown, scripts, and governance changes.
3. **Skills / Agents Governance (P0)**:
    - Clarified internal vs external skill ownership, lifecycle, mirroring, and cleanup rules.
    - Fixed `full-stack-master` PDTFC+ workflow ambiguities and kept `.github/` and `.claude/` mirrors aligned.
4. **Code Quality & Structure Regression (P0)**:
    - Ran a dedicated ESLint / type-debt / `max-lines` regression track instead of folding those issues into unrelated work.
    - Cleaned script entry drift and documented long-lived script responsibilities.
5. **Docs / Config / Database Baseline Sync (P0)**:
    - Re-synced README, deployment docs, translation governance, environment-variable semantics, and database initialization contracts.
    - Captured structured drift records between code, init scripts, and design docs.
6. **Testing / Performance / Dependency-Security Baseline (P0)**:
    - Rebuilt a cleaner smoke baseline, reran targeted coverage / browser / performance checks, and documented the remaining dependency-security boundary.

### Stage 17: Configuration Fact-Source Reuse & Creative/Distribution Efficiency Consolidation (Audited & Archived)

**Timeline**: ~1 - 1.5 months
**Goal**: Reuse configuration fact sources across installation and admin settings, reduce auth-session request churn, close the admin email-template loop, harden long-text translation on Serverless platforms, and finish two expansion tracks around AI visual assets and historical asset-link migration.

**Audit Conclusion**: Stage 17 fully closed configuration fact-source reuse, auth-session governance, admin email-template configuration, Serverless long-text translation continuation, and the two expansion tracks for AI visual assets and asset-link migration. Two late stage-closure fixes were also completed and documented: the release dependency-risk gate and the admin new-post blank-draft language-switch regression. No Stage 17-specific leftovers remain outside the backlog.

1. **Installation / Admin Settings Locale-aware Convergence (P0)**:
    - The installation wizard and admin settings now share one locale-aware settings model, fallback resolver, and metadata contract.
    - Installation edits only the current locale while multilingual expansion continues in admin settings.
2. **Auth Session Request Governance (P0)**:
    - `/api/auth/get-session` call paths were audited across SSR, hydration, navigation, refocus, and remount scenarios.
    - Short-lived caching, request coalescing, and invalidation/broadcast rules now reduce duplicate reads without weakening auth semantics.
3. **Admin Email Template Configuration (P1)**:
    - Admin now has a minimum viable email-template management loop with template selection, variable guidance, enable/disable controls, and preview.
    - Template subject/body text stays inside the existing i18n system instead of spawning a second locale fact source.
4. **Serverless Long-text Translation Continuation (P1)**:
    - Long translations now converge on one rule: SSE in non-cloud-function environments, background task + polling in cloud-function environments.
    - Partial chunk completion survives timeout/interruption and can continue without restarting from the beginning.
5. **AI Visual Asset Convergence (P1)**:
    - Cover prompting now converges on a five-dimension model: type, palette, rendering, text, and atmosphere.
    - AI image generation expanded from covers to article illustrations and related visual scenarios under one shared contract.
6. **Historical Asset-link Rewrite & Migration (P1)**:
    - Historical resource links now support batch rewrite, domain filtering, dry-run previews, diff export, and guarded apply flow.
    - The migration tool stays aligned with the existing storage, base-URL, prefix, and permission model.
7. **Stage-closure Fixes (P0)**:
    - Release now runs a reproducible dependency-risk gate with an allowlist-based temporary exception baseline for known unresolved high risks.
    - The admin post editor now allows switching an untouched blank new draft to another language while still protecting drafts that already contain real input.

### Stage 18: Validation Baseline Deepening & I18n Maintenance Consolidation (Audited & Archived)

> [!NOTE]
> This stage has been completed and archived. The Chinese roadmap remains the authoritative source for detailed scope, acceptance criteria, and backlog triage.

1. Browser and performance baselines were deepened by extending key admin and authoring flows from Chromium-only coverage to Firefox / WebKit and minimum mobile viewport validation, while closing the tracked async chunk budget overrun.
2. Release-time dependency risk was reduced by replacing the `mjml` / `mjml-cli` -> `html-minifier` high-risk chain with a verifiable compatibility alias strategy instead of relying on a long-lived allowlist alone.
3. Oversized `admin.json` locale resources were split into stable domain modules, and the admin locale loading registry now converges on one shared fact source.
4. `ja-JP` was promoted from the earlier `ui-ready` tier to `seo-ready`, with locale parity, mail, SEO, sitemap, and audit gates aligned to the same maintenance standard as the other public locales.
5. Additional stage-closure work completed WechatSync Weibo compatibility plus preflight/preview checks and tag-progress visibility in the admin translation workflow; the deferred repeated pure-function / shared-type governance item remains in the Chinese-only [backlog](../../../plan/backlog.md) for a later intake review.


### Stage 19: Governance Observability & Reuse Baseline Establishment (Audited & Archived)

> [!NOTE]
> This stage has been completed and archived. The Chinese roadmap remains the authoritative source for detailed scope, acceptance criteria, and backlog triage.

1. Internal-vs-external skill visibility is now governed through explicit `metadata.internal` markers, a structured external-skill intake registry, and automated checks for frontmatter drift plus naming mismatches.
2. Active and archived regression logs now share one indexed lookup path, making recent baselines and older comparison evidence easier to retrieve without full-text hunting.
3. A first bounded reuse pass landed in shared helpers for normalized string lists, optional string coercion, ASCII slug normalization, and base-URL/path composition, all backed by focused verification.
4. PostgreSQL traffic analysis was narrowed to result-set size and high-frequency query payloads; the public-settings path and scheduled-task scan were reduced with minimal-scope fixes, while the serverless direct-write fallback remains an observation item rather than a blocking in-scope refactor.

### Stage 20: Quality Gates, Release Automation & Security Governance Closure (Audited & Archived)

> [!NOTE]
> This stage has been completed and archived. The Chinese roadmap remains the authoritative source for detailed scope, acceptance criteria, and backlog triage.

1. Browser / E2E stability was closed through reusable critical-path scripts, stale-build detection, protected-route navigation hardening, and a stable multi-engine baseline for auth and editor smoke flows.
2. Release and Review Gate automation were consolidated around reusable pre-release and evidence-generation scripts, so release-time validation no longer depends on scattered human-run command sequences.
3. Dependabot and Code Scanning alerts were moved into a formal closure loop with official-source preference, local fallback handling, and at least one real high-risk dependency fix fully traced through validation evidence.
4. Duplicate-code detection now has a bounded scriptable baseline, stable artifact output, and an initial classification of “fix next / defer / keep local,” without expanding into an uncontrolled repository-wide cleanup.

### Stage 21: Validation Entry Points & Authoring Workflow Experience Consolidation (Audited & Archived)

> [!NOTE]
> This stage has been completed and archived in the Chinese planning source. Later stages have continued to close in the canonical Chinese roadmap; use the latest status snapshot above for the current archived-stage boundary.

1. UI real-environment testing now becomes the first planning line, with emphasis on script-first regression flows, environment setup convergence, and reusable evidence output for Review Gate.
2. Script governance and entrypoint cleanup are being promoted into an explicit stage objective: document high-frequency scripts, reduce duplicated helpers, and close out dead or overlapping script surfaces.
3. Tag translation is planned to move earlier in long-form translation workflows so metadata becomes visible sooner, while editor, CLI, and MCP entry points keep one shared orchestration contract.
4. Default cover generation will focus on shorter copy selection and larger, more readable typography so auto-filled covers stop inheriting overlong raw titles by default.

## 3. Backlog & Long-term Roadmap

> [!NOTE]
> Long-term backlog items are now maintained separately in the Chinese-only [backlog document](../../../plan/backlog.md). For the latest backlog priorities, promoted items, and deferred governance work, please follow that file together with the [Chinese roadmap](../../../plan/roadmap.md).


