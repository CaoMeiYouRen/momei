---
source_branch: master
last_sync: 2026-03-18
---

# Deployment Guide

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/deploy.md) shall prevail.
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
- **`AI_HEAVY_TASK_TIMEOUT`**: Shared timeout window for TTS, ASR, and other heavy AI jobs.
- **`AI_TEXT_DIRECT_RETURN_MAX_CHARS`** / **`AI_TEXT_TASK_CHUNK_SIZE`** / **`AI_TEXT_TASK_CONCURRENCY`**: Tune direct-return threshold, chunk size, and concurrency for long-text translation.
- **`GEMINI_API_TOKEN`**: Used when Gemini requires a dedicated token.
- **`AI_IMAGE_ENABLED`** / **`AI_IMAGE_PROVIDER`** / **`AI_IMAGE_API_KEY`**: AI image generation pipeline.
- **`ASR_ENABLED`** / **`ASR_PROVIDER`** / **`ASR_API_KEY`** / **`ASR_MODEL`** / **`ASR_ENDPOINT`**: Base ASR configuration.
- **`TTS_ENABLED`** / **`TTS_PROVIDER`** / **`TTS_API_KEY`** / **`TTS_DEFAULT_MODEL`**: Base text-to-speech configuration.
- **`AI_QUOTA_ENABLED`** / **`AI_QUOTA_POLICIES`** / **`AI_ALERT_THRESHOLDS`**: Enable tiered AI quota governance and threshold-based alerts. Reusing JSON exported from the admin settings UI is recommended.

### 2.3 Storage And Media

- **`STORAGE_TYPE`**: Recommended values are `local`, `s3`, `r2`, and `vercel_blob`.
	- Compatibility note: the legacy alias `vercel-blob` is still accepted at runtime, but new configuration should use `vercel_blob`.
- **Local storage**: `LOCAL_STORAGE_DIR` + `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` + `LOCAL_STORAGE_MIN_FREE_SPACE`
- **S3-compatible storage**: `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BASE_URL`
- **Cloudflare R2**: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_BASE_URL`
- **Path prefix governance**:
	- `ASSET_PUBLIC_BASE_URL`: Unified CDN or public asset domain.
	- `ASSET_OBJECT_PREFIX`: Unified object-key prefix.
	- `BUCKET_PREFIX`: Backward-compatible S3-style prefix.
- **Path prefix**: `BUCKET_PREFIX`
- **Vercel Blob**: `BLOB_READ_WRITE_TOKEN`

Note: browser direct upload currently uses presigned `PUT` requests when `STORAGE_TYPE=s3` or `STORAGE_TYPE=r2`. `local` and `vercel_blob` still fall back to proxy upload through the app server.

### 2.4 Email And Notifications

- **`EMAIL_HOST`** / **`EMAIL_PORT`** / **`EMAIL_USER`** / **`EMAIL_PASS`** / **`EMAIL_FROM`**
- **`EMAIL_REQUIRE_VERIFICATION`**: Recommended in production to reduce abusive registrations.

### 2.5 Scheduled Tasks And Automation

- **`CRON_SECRET`**: Bearer auth secret dedicated to Vercel Cron. Vercel sends it automatically as `Authorization: Bearer <secret>`.
- **`TASKS_TOKEN`**: Base token used for task webhook authentication, mainly for manual triggers or legacy integrations.
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
	- `NUXT_PUBLIC_POST_COPYRIGHT`
	- `NUXT_PUBLIC_SITE_COPYRIGHT_OWNER`
	- `NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR`
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
	- Prefer `STORAGE_TYPE=vercel_blob` or an external S3/R2 bucket.
	- Configure `CRON_SECRET` so Vercel can inject the Bearer token automatically. Add `TASKS_TOKEN` or `WEBHOOK_SECRET` only if you also need manual or external triggers.
	- Built-in scheduled triggers are defined in [vercel.json](../../../vercel.json) and currently run once per day.
- **Docker / Self-hosted server**: Best when you need local disk, built-in cron, and tighter operational control.
	- Mount `database/` and upload directories.
	- Use `TASK_CRON_EXPRESSION` if you want to customize the built-in cron schedule.
- **Cloudflare (Peripheral integrations only)**:
	- The current version does not support deploying the main application to Cloudflare Pages / Workers because it still depends on TypeORM and Node runtime capabilities.
	- Cloudflare R2 can still be used as object storage.
	- Scheduled Events-related trigger adaptation and [wrangler.toml](../../../wrangler.toml) are kept as peripheral-integration design / experimentation entry points and should not be read as full Cloudflare runtime support.
	- `pnpm deploy:wrangler` is currently only for wrangler-side integration debugging and should not be treated as a production full-site deployment command.

## 6. Troubleshooting

- **Auth callback errors**: Verify that both `NUXT_PUBLIC_SITE_URL` and `NUXT_PUBLIC_AUTH_BASE_URL` use the final public domain and the same protocol.
- **Scheduled task returns 401**: Check which auth mode your trigger is using.
	- Vercel Cron mode: `CRON_SECRET`
	- Token mode: `TASKS_TOKEN`
	- HMAC mode: `WEBHOOK_SECRET`
- **Volcengine ASR is not taking effect**: Check `ASR_VOLCENGINE_APP_ID`, `ASR_VOLCENGINE_ACCESS_KEY`, and `ASR_VOLCENGINE_CLUSTER_ID` first, then inspect generic `VOLCENGINE_*` fallback config.
- **OpenAI-compatible endpoint errors**: Confirm whether `AI_API_ENDPOINT` needs a `/v1` suffix.
- **Direct upload still falls back to proxy mode**: Make sure `STORAGE_TYPE` is `s3` or `r2` and that bucket credentials, bucket name, and public base URL are configured.
- **Local uploads return 404**: Verify that `LOCAL_STORAGE_DIR` exists and that `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` matches the exposed static path.
- **Cloudflare Pages / Workers shows TypeORM or Node-compatibility errors**: This is a known platform boundary, not a missed deployment step. Keep the main app on Vercel, Docker, or a self-hosted Node environment; if you need Cloudflare, use it only for peripheral integrations such as R2 or Scheduled Events-related experiments.

## 7. References

- [Variables & Settings Mapping](./variables): Overview of how environment variables map to settings keys.
- [Full environment variable example (.env.full.example)](../../../.env.full.example): Complete configuration matrix supported by the current version.
- [System integration design docs](../../../design/modules/index): Module-level integration boundaries and implementation notes.

Momei keeps the same deployment principle: configure the essential variables first so the site runs reliably, then enable AI, storage, tasks, and monetization step by step.
