---
source_branch: master
last_sync: 2026-02-11
---

# API Design

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../design/api.md) shall prevail.
:::

## 1. Overview

This document describes the backend architecture and API design for the Momei blog. The backend is designed to be secure, efficient, extensible, and capable of multi-environment deployment.

### 1.1 Tech Stack

-   **Framework**: Nuxt Server Engine (Nitro)
-   **Auth & Permissions**: [better-auth](https://github.com/better-auth/better-auth)
-   **ORM**: [TypeORM](https://typeorm.io/)
-   **Databases**: PostgreSQL (Recommended), MySQL, SQLite (Dev/Lite)
-   **Validation**: [Zod](https://zod.dev/)
-   **Email**: [Nodemailer](https://nodemailer.com/)
-   **Deployment**: Node.js, Docker, Vercel, Cloudflare Workers

## 2. Authentication & Authorization

Managed via **better-auth**.

-   **Methods**: Email/Password, OAuth (GitHub, Google, etc.).
-   **RBAC Roles**:
    -   `admin`: System administrator with full control.
    -   `author`: Can manage their own posts and comments.
    -   `user`: Registered visitor for browsing and commenting.

## 3. Database Design

Uses **TypeORM** for the ORM layer, supporting multi-database switching.
Refer to the **[Database Design Document](./database.md)** for details.

## 4. API & Route Planning

API definitions are split by functional modules:

-   **Auth**: `/api/auth/*` (Login, Register, OAuth).
-   **User Space**: `/api/user/*` (Profile, API Keys, Preferences).
-   **Blog Content**: `/api/posts/*` (Browsing, Details, Views).
-   **Taxonomy**: `/api/categories/*`, `/api/tags/*`.
-   **Interactions**: `/api/comments/*` (Comments, Likes, Captcha).
-   **Admin**: `/api/admin/*` (System Settings, Global Management).
-   **AI Hub**: `/api/ai/*` (Abstracts, Translation, Slug generation).
-   **Search**: `/api/search/*` (Full-site content search).
-   **Installation**: `/api/install/*` (Environment initialization).
-   **System**: `/api/upload/*` (File management), `/api/settings/*` (Public settings).

## 5. i18n Routing & Slug Design

### 5.1 Uniqueness Optimization

-   **Composite Index**: Unique constraints for `Post`, `Category`, and `Tag` are applied to the `(slug, language)` pair.
-   **SEO Friendly**: Allows different language versions to have their own localized slugs.

### 5.2 Translation Clusters

-   **Cluster Identification**: Entities sharing the same `translationId` form a "Translation Cluster."
-   **Smooth Switching**: The language switcher uses `translationId` to jump accurately between localized versions of the same content.
