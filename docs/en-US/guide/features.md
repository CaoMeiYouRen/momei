---
source_branch: master
last_sync: 2026-02-11
---

# Features

Momei is an **AI-driven, Native i18n** modern blogging platform. It integrates deep AI creative assistance and a ground-up internationalization design to achieve "AI-Empowered Global Creation," helping technical creators connect seamlessly with readers worldwide.

## 1. AI Creative Assistant (AI Power)

Momei features deep integration with AI providers (OpenAI, Anthropic, DeepSeek, Doubao, etc.), covering the entire workflow from inspiration to publishing:

-   **Smart Title Suggestions**: Automatically generate multiple attractive and SEO-friendly titles based on your content.
-   **Automated Abstracts**: One-click extraction of the article's essence, automatically filling SEO descriptions.
-   **Intelligent Tagging**: Analyze content to recommend appropriate tags.
-   **SEO Slug Generation**: Generate clean, readable URL slugs based on titles.
-   **One-Click Translation**: Full-text translation preserving Markdown formatting (including code blocks and formulas), syncing content, categories, and tags across languages.
-   **AI Image Generation**: Integrated with DALL-E 3 and Seedream for one-click high-quality cover images.
-   **Speech-to-Text (ASR)**: Quickly convert voice inspirations into text drafts via OpenAI Whisper.

## 2. Deep Internationalization (I18n Anywhere)

We believe i18n shouldn't just be UI translation, but content connection:

-   **Translation Cluster Management**: Aggregate and link different language versions of the same source in the admin dashboard.
-   **Smart Routing**: Supports multiple URL strategies (prefixes, default language without prefix, etc.) and automatically generates `hreflang` tags.
-   **Contextual Language Switching**: When a reader switches languages, Momei redirects to the translated version of the *current article* rather than just the homepage.
-   **Metadata Isolation**: Category and tag systems support multi-language, ensuring consistent metadata within a specific language context.

## 3. Subscription Hub

Momei builds a powerful hub to ensure your readers never miss an update:

-   **Multi-dimensional Feeds**: Generate RSS/Atom/JSON feeds for the entire site, individual categories, or specific tags. Supports Atom 1.0, JSON Feed 1.1, etc.
-   **Smart RSS Discovery**: Browsers and readers will detect the optimal subscription link for the current page automatically.
-   **Advanced Newsletter**: Visitors can subscribe to specific categories or tags. A built-in marketing campaign engine enables precision content delivery.
-   **WechatSync Integration**: Includes SDK support for syncing articles to WeChat Official Accounts.

## 4. Advanced Search Experience

-   **Local Full-text Retrieval**: Optimized with database indexing for extremely fast response times (usually < 100ms).
-   **Quick Access**: Site-wide support for the `Ctrl+K` (or `Cmd+K`) shortcut to trigger the search dialog.
-   **Multi-dimensional Filtering**: Real-time filtering by keywords, categories, tags, and languages.

## 5. Reading Experience & SEO

-   **Auto-generated TOC**: Automatically generate a sidebar table of contents based on Markdown headers.
-   **Reading Time Estimation**: Calculate word counts and estimate reading duration.
-   **Copyright Attribution**: Support for CC BY-NC-SA 4.0 and other licenses with prominent display at the bottom of articles.
-   **Dark Mode Support**: Seamlessly matches system preferences (Light/Dark) with no flickering on switch.
-   **Automatic Sitemap**: Real-time `sitemap.xml` generation with search engine notification.

## 6. Security & Protection

-   **Multi-vendor Captcha**: Integration with Cloudflare Turnstile, Google reCAPTCHA, hCaptcha, and CaptchaFox to prevent brute-force and automated attacks.
-   **Comment Moderation**: Native comment system with multi-level moderation tiers to prevent spam.

## 7. Compliance & Legal

-   **Markdown Policy Management**: Manage Terms of Service and Privacy Policy in Markdown format.
-   **Multi-language Policies**: Set independent legal texts for different languages.
-   **Built-in Templates**: Provides default legal templates for quick copy-pasting.

## 8. Developer & Demo Modes

-   **Publishing API**: Integrate Momei into your automation flows (e.g., publish from Obsidian) via API keys.
-   **Demo Mode**: Uses an in-memory database and blocks persistent changes, perfect for product demonstrations.

## 9. Memos Synchronization

-   **Seamless Integration**: Connect to your Memos (v1 API) instance to sync fragmented thoughts to your blog.
-   **Stream View**: Real-time display of latest Memos activities on the frontend, creating a personal "Life Stream."

## 10. Automation & Scheduled Tasks

-   **Built-in Task Engine**: Secure task triggering via Webhooks or system Cron using `TASKS_TOKEN`.
-   **Automated Management**: Supports scheduled post publishing, cache clearing, and external data syncing (like Memos).

---

::: tip
Want to try these features? Follow our [Quick Start](./quick-start.md) guide.
:::
