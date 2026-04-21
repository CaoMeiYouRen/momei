---
source_branch: master
last_sync: 2026-04-21
translation_tier: must-sync
---

# Quick Start

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/quick-start.md) shall prevail.
:::

Welcome to Momei! This guide will walk you through the fastest ways to deploy and run your blog.

## 0. Minimum Viable Startup Paths

Do not try to configure AI, storage, email, and notifications all at once on your first deployment. Start by making one minimal path work end to end.

| Path | When to choose it | Confirm before first startup | Can wait until later |
| :--- | :--- | :--- | :--- |
| Local development | You want to preview the app, modify code, or verify features quickly | `pnpm install`, `pnpm dev`; development mode can auto-generate a temporary `AUTH_SECRET` and falls back to local SQLite | AI, object storage, email, scheduled tasks |
| Vercel | You want the fastest publicly reachable deployment | `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`, and an external `DATABASE_URL` | AI, object storage, email, analytics |
| Docker / self-hosted Node | You need stronger control, local disk, or custom ops | `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`; if you keep SQLite, make sure the database path or mounted volume persists | AI, object storage, email, analytics |

Recommended preflight before the first startup:

1. Fill the core variables first: production deployments should provide `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, and `NUXT_PUBLIC_AUTH_BASE_URL` before anything else.
2. Match the platform path first: Vercel and other serverless paths should not keep using default SQLite; Cloudflare Pages / Workers are still unsupported for the full app runtime.
3. Converge on storage early: do not leave `STORAGE_TYPE=local` on serverless paths, or uploads and media flows will fail later.
4. When the wizard shows a blocker, compare it against the essential and troubleshooting sections in [Deployment Guide](./deploy.md) and the variable names in [Variables & Settings Mapping](./variables.md).

## 1. One-Click Deploy to Vercel (Recommended)

This is the easiest way to get your blog online in minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. Click the button above.
2. Follow Vercel's instructions to create or select your GitHub repository.
3. At minimum, provide `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`, and an external `DATABASE_URL`.
4. Click **Deploy**.

## 2. Fast Deployment with Docker

We provide an official Docker image for Momei.

### 2.1 Basic Run

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

For production, add at least:

```bash
docker run -d -p 3000:3000 \
    -e AUTH_SECRET=your-random-secret \
    -e NUXT_PUBLIC_SITE_URL=https://blog.example.com \
    -e NUXT_PUBLIC_AUTH_BASE_URL=https://blog.example.com \
    caomeiyouren/momei
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

For the current blocker matrix, minimum prototype boundary, and stop-loss criteria, see [Cloudflare Runtime Compatibility Study And Stop-Loss Conclusion](../../design/governance/cloudflare-runtime-study.md).

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

That zero-config experience is only for local development. Once you are preparing a public deployment, OAuth callback, or absolute public links, go back to the minimal path above and make the core variables explicit.

If you want the full feature set, start from `.env.full.example` and follow the settings mapping used by the settings service, especially for values such as `AI_QUOTA_ENABLED`, `AI_QUOTA_POLICIES`, `ASSET_PUBLIC_BASE_URL`, `MEMOS_INSTANCE_URL`, `MEMOS_ACCESS_TOKEN`, `LISTMONK_INSTANCE_URL`, and `LISTMONK_ACCESS_TOKEN`.

Visit `http://localhost:3000` in your browser.

## 5. Next Steps

-   **Admin Dashboard**: Visit `/admin` to log in. For a fresh installation, check the console logs for initialization credentials.
-   **AI Assistant**: Configure `AI_API_KEY` in your `.env` to enable smart title generation and one-click translation.
-   **Enable Memos Sync**: Configure `MEMOS_ENABLED=true`, `MEMOS_INSTANCE_URL`, and `MEMOS_ACCESS_TOKEN`.
-   **Enable listmonk Newsletter Delivery**: In system settings -> third-party integrations, enable `listmonk`, provide the instance URL, admin username, access token, and default list ID or category/tag mapping.
-   **Demo Mode**: Set `NUXT_PUBLIC_DEMO_MODE=true` to preview all admin features in-memory (data is not persisted).

If you want to validate the minimum external newsletter flow, use this sequence:

1. Configure the `LISTMONK_*`-mapped settings in the admin panel, including at least the instance URL, username, access token, and default list ID.
2. Trigger one delivery through article redistribution or the marketing campaign entry.
3. Trigger the same campaign again and confirm the system reuses the written-back remote campaign ID instead of creating a duplicate remote campaign.
4. Open notification delivery audit and inspect the latest `listmonk` channel result, failure reason, and suggested manual action.

---

::: tip
For more detailed configurations and features, check the [Deployment Guide](./deploy.md) and [Features](./features.md).
:::
