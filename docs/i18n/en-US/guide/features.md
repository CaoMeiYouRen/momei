---
source_branch: master
last_sync: 2026-08-29
translation_tier: summary-sync
---

# Features

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/features.md) shall prevail.
:::

Momei is an **AI-driven, Native i18n** modern blogging platform. It integrates deep AI creative assistance and a ground-up internationalization design to achieve "AI-Empowered Global Creation," helping technical creators connect seamlessly with readers worldwide.

## 1. AI Creative Assistant (AI Power)

Momei features deep integration with AI providers (OpenAI, Anthropic, DeepSeek, Doubao, etc.), covering the entire workflow from inspiration to publishing:

-   **Smart Title Suggestions**: Automatically generate multiple attractive and SEO-friendly titles based on your content.
-   **Automated Abstracts**: One-click extraction of the article's essence, automatically filling SEO descriptions.
-   **Intelligent Tagging**: Analyze content to recommend appropriate tags.
-   **Scaffold-style Writing Assistant**: AI can provide outlines and argument prompts to help authors build an article structure faster.
-   **SEO Slug Generation**: Generate clean, readable URL slugs based on titles.
-   **One-Click Translation**: Full-text translation preserving Markdown formatting (including code blocks and formulas), syncing content, categories, and tags across languages.
-   **AI Image Generation**: Integrated with DALL-E 3, Doubao Seedream, and SiliconFlow for one-click high-quality cover images.
-   **Speech-to-Text & Reusable Voice Input**: Supports both browser-native Web Speech and cloud ASR modes, and the voice pipeline has been extracted into reusable multi-line text-input primitives for posts, snippets, and inspiration capture.
-   **Inspiration Capture Engine**: Collect fragmented ideas quickly and turn them into formal content later.

## 2. Deep Internationalization (I18n Anywhere)

We believe i18n shouldn't just be UI translation, but content connection:

-   **Translation Cluster Management**: Aggregate and link different language versions of the same source in the admin dashboard.
-   **Smart Routing**: Supports multiple URL strategies (prefixes, default language without prefix, etc.) and automatically generates `hreflang` tags.
-   **Contextual Language Switching**: When a reader switches languages, Momei redirects to the translated version of the *current article* rather than just the homepage.
-   **Metadata Isolation**: Category and tag systems support multi-language, ensuring consistent metadata within a specific language context.

## 3. Content Orchestration & Authoring Input

-   **Homepage Orchestration**: The homepage now ships with distinct latest/popular sections, cross-section deduplication, refill behavior, and SSR-safe output.
-   **Post Pinning Semantics**: Admin editing, public queries, card rendering, and ordering rules now share one `isPinned` contract, with clear priority boundaries among pinned, popular, and latest.
-   **Stable Editor Integration**: The current Markdown editor is wrapped behind an async client-only adapter, preserving upload/preview/fullscreen behavior while keeping replacement work behind a no-regression gate.
-   **Admin Content Insights Home**: `/admin` now doubles as a content-insights dashboard with trend cards (views, comments, publishing volume) plus hot-post, hot-tag, and hot-category rankings, filterable by time range, language, and public status.

## 4. Subscription & Distribution Hub

Momei treats subscription and external delivery as part of the same operating surface:

-   **Multi-dimensional Feeds**: Generate RSS/Atom/JSON feeds for the entire site, individual categories, or specific tags. Supports Atom 1.0, JSON Feed 1.1, and more.
-   **Smart RSS Discovery**: Browsers and readers will detect the optimal subscription link for the current page automatically.
-   **Advanced Newsletter**: Visitors can subscribe to specific categories or tags. A built-in marketing campaign engine enables precision content delivery.
-   **Distribution Governance Panel**: The admin post editor now supports viewing Memos / WechatSync / remote-repo sync status in one place, plus manual sync, retry, and termination, with remote links, target files, status timelines, and failure categories recorded; remote repo distribution currently outputs Hexo-style article files.

## 5. Advanced Search Experience

-   **Local Full-text Retrieval**: Optimized with database indexing for extremely fast response times (usually < 100ms).
-   **Quick Access**: Site-wide support for the `Ctrl+K` (or `Cmd+K`) shortcut to trigger the search dialog.
-   **Multi-dimensional Filtering**: Real-time filtering by keywords, categories, tags, and languages.

## 6. Reading Experience & SEO

-   **Math Rendering**: Native support for KaTeX inline and block formulas.
-   **Auto-generated TOC**: Automatically generate a sidebar table of contents based on Markdown headers.
-   **Immersive Reading Mode**: Reduce distractions with configurable font size, line height, page width, and eye-friendly themes.
-   **End-to-end Performance Optimization**: Core pages meet Lighthouse >= 90 across the board for fast loading.
-   **Reading Time Estimation**: Calculate word counts and estimate reading duration.
-   **Copyright Attribution**: Support for CC BY-NC-SA 4.0 and other licenses with prominent display at the bottom of articles.
-   **Dark Mode Support**: Seamlessly matches system preferences (Light/Dark) with no flickering on switch.
-   **Automatic Sitemap**: Real-time `sitemap.xml` generation with search engine notification.
-   **GEO / AI Crawler Visibility**: The public surface now includes `llms.txt`, structured data, site-level AI entry docs, and baseline feed / sitemap entries, helping search engines and AI retrieval systems understand the site structure and content semantics.

## 7. Security & Protection

-   **Multi-vendor Captcha**: Integration with Cloudflare Turnstile, Google reCAPTCHA, hCaptcha, and CaptchaFox to prevent brute-force and automated attacks.
-   **Comment Moderation**: Native comment system with multi-level moderation tiers to prevent spam.
-   **Read-only Comment Translation**: Comments can be translated into the current UI language while reusing the existing quota, rate-limit, and cache audit chain.

## 8. Compliance & Legal

-   **Markdown Policy Management**: Manage Terms of Service and Privacy Policy in Markdown format.
-   **Multi-language Policies**: Set independent legal texts for different languages.
-   **Built-in Templates**: Provides default legal templates for quick copy-pasting. See [Legal Templates](../../../guide/legal-templates.md) for details.

## 9. Developer, Deployment, and Demo Modes

-   **Installation Wizard**: New installations can use a guided setup flow to complete the initial database and base configuration.
-   **Momei CLI Migration Tool**: Import Markdown content from Hexo and similar systems through a dedicated CLI with Front-matter support.
-   **Publishing API**: Integrate Momei into your automation flows (e.g., publish from Obsidian) via API keys.
-   **Demo Mode**: Uses an in-memory database and blocks persistent changes, perfect for product demonstrations.

## 10. Engineering Foundation & Runtime Boundaries

-   **Modern Full-stack Base**: Built on Nuxt 4, Vue 3, and TypeScript, with SCSS + PrimeVue styling, covering SSR, SSG, and the admin panel in one codebase.
-   **Database & Auth Baseline**: SQLite for local / demo runs; MySQL or PostgreSQL recommended for production. Auth is built on Better Auth, covering Credentials and third-party OAuth.
-   **Clear Deployment Boundaries**: The main app targets Vercel, Docker, and self-hosted VPS. Cloudflare R2 and Scheduled Events can be integrated as peripheral capabilities, but the main app does not claim full Cloudflare runtime deployment due to TypeORM and Node runtime dependencies.

## 11. Quality Assurance & Runtime Observability

-   **Testing & Regression Baseline**: Vitest covers core logic and high-risk regression paths; Playwright guards key browser flows; coverage, lint, typecheck, and Review Gate evidence are closed out phase by phase.
-   **Performance Guardrails**: Bundle budgets, Lighthouse, and key-page performance sampling baselines are in place, with ongoing governance over first-screen size, async chunks, and critical CSS.
-   **Runtime Observability**: Sentry, Microsoft Clarity, Google Analytics 4, and Baidu Analytics are integrated for error monitoring, performance tracking, behavior analysis, and traffic observation.

## 12. Automation & Scheduled Tasks

-   **Built-in Task Engine**: Secure task triggering via `CRON_SECRET` (Vercel Cron), `WEBHOOK_SECRET` (HMAC), or `TASKS_TOKEN` (compat mode), with support for Webhooks and system Cron.
-   **Automated Management**: Supports scheduled post publishing, external distribution tasks, AI media timeout inspection and status compensation, and other background maintenance flows.

---

::: tip
Want to try these features? Follow our [Quick Start](./quick-start.md) guide.

Interested in batch translation orchestration, multi-platform distribution tracking, and unified content-asset management? See the [Enhanced Pack](./enhanced-pack.md).
:::
