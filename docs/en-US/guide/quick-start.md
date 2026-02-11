---
source_branch: master
last_sync: 2026-02-11
---

# Quick Start

Welcome to Momei! This guide will walk you through the fastest ways to deploy and run your blog.

## 1. One-Click Deploy to Vercel (Recommended)

This is the easiest way to get your blog online in minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. Click the button above.
2. Follow Vercel's instructions to create or select your GitHub repository.
3. Configure environment variables (optional, see documentation below).
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

## 3. Deployment to Cloudflare

If you prefer a seamless Serverless experience at the edge:

```bash
pnpm build
pnpm wrangler deploy
```

See [Deployment Guide - Cloudflare](./deploy.md) for more details.

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

Visit `http://localhost:3000` in your browser.

## 5. Next Steps

-   **Admin Dashboard**: Visit `/admin` to log in. For a fresh installation, check the console logs for initialization credentials.
-   **AI Assistant**: Configure `AI_API_KEY` in your `.env` to enable smart title generation and one-click translation.
-   **Demo Mode**: Set `NUXT_PUBLIC_DEMO_MODE=true` to preview all admin features in-memory (data is not persisted).

---

::: tip
For more detailed configurations and features, check the [Deployment Guide](./deploy.md) and [Features](./features.md).
:::
