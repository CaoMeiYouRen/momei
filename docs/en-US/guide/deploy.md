---
source_branch: master
last_sync: 2026-03-07
---

# Deployment Guide

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../guide/deploy.md) shall prevail.
:::

Momei uses an environment-variable-first deployment model that stays aligned with the current codebase. Most capabilities follow a simple rule: once the required variables are present, the feature is enabled. Authentication, scheduled tasks, and object storage should still be managed primarily through environment variables rather than runtime edits in the admin panel.

To make rollout easier, the configuration is grouped into three layers: **Essential**, **Recommended for production**, and **Optional enhancements**.

## 1. Essential

- **`AUTH_SECRET`**: Core secret used by Better Auth and server-side signatures.
	- Generate it with: `openssl rand -hex 32`
- **`NUXT_PUBLIC_SITE_URL`**: Public site URL used for SEO, sitemap, RSS, federation, and absolute links.
- **`NUXT_PUBLIC_AUTH_BASE_URL`**: Base URL used for Better Auth callbacks.
	- In production, it should usually match `NUXT_PUBLIC_SITE_URL`.
- **`DATABASE_URL`**: Database connection string.
	- SQLite: `sqlite://database/momei.sqlite`
	- MySQL: `mysql://user:pass@host:3306/db`
	- PostgreSQL: `postgres://user:pass@host:5432/db`

## 2. Recommended For Production

These settings are not strictly required to boot the app, but they largely determine whether the production deployment is stable, maintainable, and feature-complete.

### 2.1 Database And Cache

- **`DATABASE_SYNCHRONIZE=false`**: Recommended in production.
- **`REDIS_URL`**: Recommended when you need cache, parts of rate limiting, or distributed behavior.

### 2.2 AI And Multimodal Services

- **`AI_PROVIDER`** / **`AI_API_KEY`** / **`AI_MODEL`**: Core text AI engine.
- **`AI_API_ENDPOINT`**: Endpoint for OpenAI-compatible services or proxies.
- **`GEMINI_API_TOKEN`**: Used when Gemini requires a dedicated token.
- **`AI_IMAGE_ENABLED`** / **`AI_IMAGE_PROVIDER`** / **`AI_IMAGE_API_KEY`**: AI image generation pipeline.
- **`ASR_ENABLED`** / **`ASR_PROVIDER`** / **`ASR_API_KEY`** / **`ASR_MODEL`** / **`ASR_ENDPOINT`**: Base ASR configuration.
- **`TTS_ENABLED`** / **`TTS_PROVIDER`** / **`TTS_API_KEY`** / **`TTS_DEFAULT_MODEL`**: Base text-to-speech configuration.

### 2.3 Storage And Media

- **`STORAGE_TYPE`**: `local`, `s3`, or `vercel-blob`.
- **Local storage**: `LOCAL_STORAGE_DIR` + `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL`
- **S3-compatible storage**: `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BASE_URL`
- **Path prefix**: `BUCKET_PREFIX`
- **Vercel Blob**: `BLOB_READ_WRITE_TOKEN`

### 2.4 Email And Notifications

- **`EMAIL_HOST`** / **`EMAIL_PORT`** / **`EMAIL_USER`** / **`EMAIL_PASS`** / **`EMAIL_FROM`**
- **`EMAIL_REQUIRE_VERIFICATION`**: Recommended in production to reduce abusive registrations.

### 2.5 Scheduled Tasks And Automation

- **`TASKS_TOKEN`**: Base token used for task webhook authentication.
- **`WEBHOOK_SECRET`**: Recommended as a dedicated HMAC signing secret.
- **`TASK_CRON_EXPRESSION`**: Only effective in self-hosted mode to override the built-in cron frequency.
- **`DISABLE_CRON_JOB=true`**: Explicitly disables the built-in cron job in self-hosted mode.

`WEBHOOK_TIMESTAMP_TOLERANCE` still appears in the example file, but the current implementation does not read it. Webhook validation uses a fixed 5-minute tolerance window.

## 3. Optional Enhancements

These settings round out observability, branding, visual effects, and monetization defaults.

- **Site metadata**:
	- `NUXT_PUBLIC_APP_NAME`
	- `NUXT_PUBLIC_SITE_DESCRIPTION`
	- `NUXT_PUBLIC_SITE_KEYWORDS`
	- `NUXT_PUBLIC_CONTACT_EMAIL`
	- `NUXT_PUBLIC_DEFAULT_COPYRIGHT`
- **Analytics and monitoring**:
	- `NUXT_PUBLIC_BAIDU_ANALYTICS_ID`
	- `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`
	- `NUXT_PUBLIC_CLARITY_PROJECT_ID`
	- `NUXT_PUBLIC_SENTRY_DSN`
- **Visual effects**:
	- `NUXT_PUBLIC_LIVE2D_ENABLED`
	- `NUXT_PUBLIC_CANVAS_NEST_ENABLED`
	- `NUXT_PUBLIC_EFFECTS_MOBILE_ENABLED`
- **China-region compliance**:
	- `NUXT_PUBLIC_SHOW_COMPLIANCE_INFO`
	- `NUXT_PUBLIC_ICP_LICENSE_NUMBER`
	- `NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER`
- **Commercial defaults**:
	- `COMMERCIAL_SPONSORSHIP_JSON`

## 4. Channel-Specific Examples

### 4.1 SiliconFlow: Text + ASR/TTS

```dotenv
AI_PROVIDER=siliconflow
AI_API_KEY=sk-xxxx
AI_MODEL=Qwen/Qwen2.5-72B-Instruct
AI_API_ENDPOINT=https://api.siliconflow.cn/v1

ASR_ENABLED=true
ASR_PROVIDER=siliconflow
ASR_SILICONFLOW_API_KEY=sk-xxxx
ASR_SILICONFLOW_MODEL=FunAudioLLM/SenseVoiceSmall

TTS_ENABLED=true
TTS_PROVIDER=siliconflow
TTS_API_KEY=sk-xxxx
```

### 4.2 Volcengine / Doubao: Split Text And ASR Access

If you only use Volcengine for ASR, prefer the dedicated ASR credentials:

```dotenv
ASR_ENABLED=true
ASR_PROVIDER=volcengine
ASR_VOLCENGINE_APP_ID=888888
ASR_VOLCENGINE_ACCESS_KEY=AK-xxx
ASR_VOLCENGINE_SECRET_KEY=SK-xxx
ASR_VOLCENGINE_CLUSTER_ID=volc.bigasr.sauc.duration
```

If text AI also runs on Volcengine, add:

```dotenv
AI_PROVIDER=volcengine
AI_API_KEY=your-text-api-key
AI_MODEL=ep-2024xxx
```

### 4.3 Memos Sync

```dotenv
MEMOS_ENABLED=true
MEMOS_INSTANCE_URL=https://memos.yourdomain.com
MEMOS_ACCESS_TOKEN=xxx
MEMOS_DEFAULT_VISIBILITY=PRIVATE
```

## 5. Deploying To Major Platforms

- **Vercel**: Best for serverless deployments.
	- Prefer `STORAGE_TYPE=vercel-blob` or an external S3/R2 bucket.
	- `TASKS_TOKEN` is required, and `WEBHOOK_SECRET` is strongly recommended.
	- Built-in scheduled triggers are defined in [vercel.json](../../vercel.json) and currently run once per day.
- **Docker / Self-hosted server**: Best when you need local disk, built-in cron, and tighter operational control.
	- Mount `database/` and upload directories.
	- Use `TASK_CRON_EXPRESSION` if you want to customize the built-in cron schedule.
- **Cloudflare Pages / Workers**:
	- Prefer R2 or another S3-compatible store.
	- Scheduled tasks should come from platform scheduled events, not a local cron process.

## 6. Troubleshooting

- **Auth callback errors**: Verify that both `NUXT_PUBLIC_SITE_URL` and `NUXT_PUBLIC_AUTH_BASE_URL` use the final public domain and the same protocol.
- **Scheduled task returns 401**: Check which auth mode your trigger is using.
	- Token mode: `TASKS_TOKEN`
	- HMAC mode: `WEBHOOK_SECRET`
- **Volcengine ASR is not taking effect**: Check `ASR_VOLCENGINE_APP_ID`, `ASR_VOLCENGINE_ACCESS_KEY`, and `ASR_VOLCENGINE_CLUSTER_ID` first, then inspect generic `VOLCENGINE_*` fallback config.
- **OpenAI-compatible endpoint errors**: Confirm whether `AI_API_ENDPOINT` needs a `/v1` suffix.
- **Local uploads return 404**: Verify that `LOCAL_STORAGE_DIR` exists and that `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` matches the exposed static path.

## 7. References

- [Variables & Settings Mapping](./variables): Overview of how environment variables map to settings keys.
- [Full environment variable example (.env.full.example)](../../.env.full.example): Complete configuration matrix supported by the current version.
- [System integration design docs](../../design/modules/index): Module-level integration boundaries and implementation notes.

Momei keeps the same deployment principle: configure the essential variables first so the site runs reliably, then enable AI, storage, tasks, and monetization step by step.
