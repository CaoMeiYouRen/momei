---
source_branch: master
last_sync: 2026-02-11
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
    -   **Roles**: Creator (Admin) vs. Guest.
    -   **User Management**: Admin can view user lists, adjust roles, and disable accounts.
3.  **Content Display**
    -   **Pages**: Home (Pagination), Article Detail (TOC), Archive.
    -   **Search**: Basic keyword search (Local filtering or simple DB query).
    -   **Responsive**: PC and Mobile support with a focus on mobile navigation (Hamburger menu).
    -   **Themes**: Light/Dark mode with persistence.
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

### Stage 5: Ecosystem Deepening (In Progress)

**Goal**: Multimedia integration, commercialization, and full AI creative loop.

1.  **Advanced Subscription (P1)**:
    -   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).
2.  **Notification & Preference System (P1)**:
    -   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).
3.  **Monetization & Growth (P2)**:
    -   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).
4.  **AI Voice Creative Enhancement (P1)**:
    -   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).
5.  **Third-party Integration**:
    -   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).
6.  **AI Agent & Automation Ecosystem**:
    -   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

## 3. Backlog & Long-term Roadmap

This section records features with long-term value but not prioritized for the current iteration.

### 1. Desktop Application
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

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

### 7. Real-time Notification Architecture (SSE/Web Push)
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).

### 8. I18n Experience Optimization
-   > [!NOTE] Content in progress. For the latest updates, please see the [Chinese version](../../plan/roadmap.md).
