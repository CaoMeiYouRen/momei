---
source_branch: master
last_sync: 2026-03-18
---

# Quick Start

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/quick-start.md) shall prevail.
:::

Welcome to Momei! This guide will walk you through the fastest ways to deploy and run your blog.

## 1. One-Click Deploy to Vercel (Recommended)

This is the easiest way to get your blog online in minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. Click the button above.
2. Follow Vercel's instructions to create or select your GitHub repository.
3. Configure environment variables if needed.
4. Click **Deploy**.

## 2. Fast Deployment with Docker

We provide an official Docker image for Momei.

### 2.1 Basic Run

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

### 2.2 Using Docker Compose (Recommended)

Create a `docker-compose.yml` file locally:

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key # Required for production
        volumes:
            - ./database:/app/database # Persistent SQLite storage
            - ./uploads:/app/public/uploads # Persistent storage for uploads
```

Then run:

```bash
docker-compose up -d
```

## 3. Cloudflare Peripheral Integrations Only

The current version does not support deploying the application itself to Cloudflare Pages / Workers. The main reason is that the project still depends on TypeORM and Node runtime capabilities, and there is no maintainable Cloudflare runtime adaptation layer yet.

If you need Cloudflare, limit it to peripheral capabilities for now:

- Cloudflare R2 as object storage.
- Scheduled Events-related trigger adaptation kept for evaluating unified task-entry integration.
- Edge capabilities such as CDN, WAF, and DNS that remain decoupled from the main app runtime.

Keep the main app on Vercel, Docker, or a self-hosted Node environment, then use the [Deployment Guide](./deploy.md) to evaluate any Cloudflare-side additions.

## 4. Local Development (Zero-Config)

If you want to modify code or develop locally:

```bash
# 1. Clone the repository
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```

Momei supports **Zero-Config Startup** for development:
- Automatically uses local SQLite.
- Generates a development `AUTH_SECRET` automatically.
- No `.env` configuration required to run.

If you want the full feature set, start from `.env.full.example` and follow the settings mapping used by the settings service, especially for values such as `AI_QUOTA_ENABLED`, `AI_QUOTA_POLICIES`, `ASSET_PUBLIC_BASE_URL`, `MEMOS_INSTANCE_URL`, and `MEMOS_ACCESS_TOKEN`.

Visit `http://localhost:3000` in your browser.

## 5. Next Steps

-   **Admin Dashboard**: Visit `/admin` to log in. For a fresh installation, check the console logs for initialization credentials.
-   **AI Assistant**: Configure `AI_API_KEY` in your `.env` to enable smart title generation and one-click translation.
-   **Enable Memos Sync**: Configure `MEMOS_ENABLED=true`, `MEMOS_INSTANCE_URL`, and `MEMOS_ACCESS_TOKEN`.
-   **Demo Mode**: Set `NUXT_PUBLIC_DEMO_MODE=true` to preview all admin features in-memory (data is not persisted).

---

::: tip
For more detailed configurations and features, check the [Deployment Guide](./deploy.md) and [Features](./features.md).
:::
