---
source_branch: master
last_sync: 2026-03-09
---

# Momei - Project Roadmap

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../plan/roadmap.md) shall prevail.
:::

This document outlines the development blueprint for the project. For specific task execution status, please refer to the [Todo List](../../plan/todo.md) (Chinese Only).

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


### Stage 10: Notification Closure & Global Experience Enhancement (In Progress)

**Timeline**: ~1 - 1.5 months
**Goal**: Close the loop on notifications, language reach, and onboarding experience.

1. **Browser Push Reinforcement (P0)**:
    - **Full Loop**: Web Push integration for admin events and AI task completion.
    - **Gradual Delivery**: Service Worker fallback logic (SSE first when online).
2. **Code Quality & Engineering (P0)**:
   - **Type Sanitization**: Elimination of `any` in critical notification/config paths.
   - **Decoupling**: Extraction of shared composables for admin CRUD.
3. **I18n & L10n Enhancements (P1)**:
    - **Extensions**: Adding Traditional Chinese and Korean support via readiness tiers.
4. **User Experience Optimization (P1)**:
    - **Demo Enhancement**: Richer preset content and guided scripts.
    - **Feedback Loop**: Lightweight feedback entry for product suggestions.

## 3. Backlog & Long-term Roadmap

This section records features with long-term value but not prioritized for the current iteration.

### 1. Desktop Application
- **Tauri Cross-platform App**:
    - Desktop skeleton with multi-site management.
    - Offline Markdown editing with cloud sync.
    - Native system menus and integration.

### 2. Geek Tech Extras
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

### 3. Theme Ecosystem
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

### 4. Monetization & Membership
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

### 5. Advanced Creator Tools
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

### 6. Podcast & Multimedia Expansion
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).


