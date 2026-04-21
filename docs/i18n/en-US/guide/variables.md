---
source_branch: master
last_sync: 2026-04-21
---

# Variables & Settings Mapping

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../guide/variables.md) shall prevail.
:::

This page lists the environment variables used by Momei and their corresponding internal settings keys (`SettingKey`), visibility levels, and masking rules.

## 1. Core Concepts

### 1.1 Configuration Priority

Momei uses an **environment-variable-first** strategy:

1. **Environment variables (ENV)**: Highest priority. If a value exists in ENV, the database value is ignored and the admin panel usually shows the field as read-only or restricted.
2. **System settings (Database)**: If no ENV is set, the system reads from the `setting` table. These values can usually be updated from the admin settings panel.
3. **Hard-coded defaults**: If neither ENV nor database values exist, the code falls back to its default values.

### 1.2 Config Levels

These levels control how much of a setting can appear in API responses:

- **Level 0 (public)**: Visible to everyone, such as site name or logo.
- **Level 1 (restricted)**: Visible only to authenticated users.
- **Level 2 (admin)**: Visible only to administrators and may be masked.
- **Level 3 (kernel)**: Server-only values that are never exposed to the frontend, such as `AUTH_SECRET`.

### 1.3 Mask Types

- **none**: Displayed as-is.
- **password**: Fully hidden as `********`.
- **key**: Keeps the first and last few characters visible, masking the middle.
- **email**: Masks the local part of an email address.

## 2. Mapping Table

### 2.1 Essentials

These values are usually locked at startup and should normally be managed through environment variables only.

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `NUXT_PUBLIC_APP_NAME` | `site_name` / `site_title` | 0 | none | Site name used by public title and branding text |
| `NUXT_PUBLIC_SITE_URL` | - | 0 | none | Public site URL used for SEO, sitemap, RSS, and absolute links |
| `AUTH_SECRET` | - | 3 | password | Core secret, ENV-only |
| `NUXT_PUBLIC_AUTH_BASE_URL` | `site_url` | 0 | none | Better Auth callback base URL; the settings UI lock state is mainly based on this variable |
| `NUXT_PUBLIC_POST_COPYRIGHT` | `post_copyright` | 0 | none | Default post copyright license (legacy alias: `NUXT_PUBLIC_DEFAULT_COPYRIGHT`) |
| `NUXT_PUBLIC_CONTACT_EMAIL` | `contact_email` | 0 | email | Public contact email |
| `NUXT_PUBLIC_SITE_COPYRIGHT_OWNER` | `site_copyright_owner` | 0 | none | Site copyright owner (legacy alias: `NUXT_PUBLIC_FOOTER_COPYRIGHT_OWNER`) |
| `NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR` | `site_copyright_start_year` | 0 | none | Site copyright year range start (legacy alias: `NUXT_PUBLIC_FOOTER_COPYRIGHT_START_YEAR`) |
| `MACHINE_ID` | - | 3 | none | Distributed ID machine code (0-1023) |

### 2.2 AI Integration

These variables control the site-wide AI capabilities.

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `AI_ENABLED` | `ai_enabled` | 0 | none | Global AI switch |
| `AI_PROVIDER` | `ai_provider` | 2 | none | Text AI provider |
| `AI_API_KEY` | `ai_api_key` | 2 | key | Provider API key |
| `AI_MODEL` | `ai_model` | 2 | none | Default text model |
| `AI_API_ENDPOINT` | `ai_endpoint` | 2 | none | API endpoint or proxy |
| `AI_HEAVY_TASK_TIMEOUT` | - | 3 | none | Shared timeout window for TTS, ASR, image generation, and other heavy jobs |
| `AI_TEXT_DIRECT_RETURN_MAX_CHARS` | - | 3 | none | Character threshold for switching long-text translation to async task mode |
| `AI_TEXT_TASK_CHUNK_SIZE` | - | 3 | none | Default chunk size for long-text translation tasks |
| `AI_TEXT_TASK_CONCURRENCY` | - | 3 | none | Default concurrency for long-text translation tasks |
| `GEMINI_API_TOKEN` | `gemini_api_token` | 2 | key | Dedicated Gemini token |
| `AI_IMAGE_ENABLED` | `ai_image_enabled` | 0 | none | Whether AI image generation is enabled |
| `AI_IMAGE_PROVIDER` | `ai_image_provider` | 2 | none | AI image provider |
| `AI_IMAGE_API_KEY` | `ai_image_api_key` | 2 | key | AI image API key |
| `AI_IMAGE_MODEL` | `ai_image_model` | 2 | none | Default AI image model |
| `AI_IMAGE_ENDPOINT` | `ai_image_endpoint` | 2 | none | AI image endpoint or proxy |
| `AI_QUOTA_ENABLED` | `ai_quota_enabled` | 2 | none | Enables tiered AI quota governance |
| `AI_QUOTA_POLICIES` | `ai_quota_policies` | 2 | none | JSON quota policy set for global / role / trust-level / user scopes |
| `AI_ALERT_THRESHOLDS` | `ai_alert_thresholds` | 2 | none | JSON alert thresholds for quota, cost, and failure bursts |
| `ASR_ENABLED` | `asr_enabled` | 0 | none | Speech-to-text switch |
| `ASR_PROVIDER` | `asr_provider` | 2 | none | ASR provider |
| `ASR_API_KEY` | `asr_api_key` | 2 | key | Generic ASR API key |
| `ASR_MODEL` | `asr_model` | 2 | none | Default ASR model or resource ID |
| `ASR_ENDPOINT` | `asr_endpoint` | 2 | none | ASR endpoint |
| `ASR_SILICONFLOW_API_KEY` | `asr_siliconflow_api_key` | 2 | key | Dedicated SiliconFlow ASR key |
| `ASR_SILICONFLOW_MODEL` | `asr_siliconflow_model` | 2 | none | Dedicated SiliconFlow ASR model |
| `ASR_VOLCENGINE_APP_ID` | `asr_volcengine_app_id` | 2 | none | Volcengine ASR App ID |
| `ASR_VOLCENGINE_ACCESS_KEY` | `asr_volcengine_access_key` | 2 | key | Volcengine ASR access key |
| `ASR_VOLCENGINE_SECRET_KEY` | `asr_volcengine_secret_key` | 2 | password | Volcengine ASR secret key |
| `ASR_VOLCENGINE_CLUSTER_ID` | `asr_volcengine_cluster_id` | 2 | none | Volcengine ASR resource/cluster ID |
| `TTS_ENABLED` | `tts_enabled` | 0 | none | Text-to-speech switch |
| `TTS_PROVIDER` | `tts_provider` | 2 | none | TTS provider |
| `TTS_API_KEY` | `tts_api_key` | 2 | key | TTS API key, with optional fallback to `AI_API_KEY` |
| `TTS_ENDPOINT` | `tts_endpoint` | 2 | none | TTS endpoint or proxy |
| `TTS_DEFAULT_MODEL` | `tts_model` | 2 | none | Default TTS model |
| `TTS_DEFAULT_VOICE` | - | 2 | none | Default TTS voice |

### 2.3 Storage And Database

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | - | 3 | password | Database DSN, never stored in the database |
| `REDIS_URL` | - | 3 | password | Cache / rate-limit DSN |
| `STORAGE_TYPE` | `storage_type` | 2 | none | Canonical storage type: `local` / `s3` / `r2` / `vercel_blob`; legacy alias `vercel-blob` is still accepted |
| `LOCAL_STORAGE_DIR` | `local_storage_dir` | 2 | none | Local storage directory |
| `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` | `local_storage_base_url` | 2 | none | Public base path for local assets |
| `LOCAL_STORAGE_MIN_FREE_SPACE` | `local_storage_min_free_space` | 2 | none | Minimum free-space guard for local storage |
| `S3_ENDPOINT` | `s3_endpoint` | 2 | none | S3-compatible endpoint |
| `S3_BUCKET_NAME` | `s3_bucket` | 2 | none | S3-compatible bucket name |
| `S3_REGION` | `s3_region` | 2 | none | S3 region |
| `S3_ACCESS_KEY_ID` | `s3_access_key` | 2 | key | S3-compatible access key |
| `S3_SECRET_ACCESS_KEY` | `s3_secret_key` | 2 | password | S3-compatible secret key |
| `S3_BASE_URL` | `s3_base_url` | 2 | none | Public base URL for S3-compatible assets |
| `BUCKET_PREFIX` | `s3_bucket_prefix` | 2 | none | Backward-compatible object prefix |
| `ASSET_PUBLIC_BASE_URL` | `asset_public_base_url` | 2 | none | Unified public asset base URL, higher priority than driver-specific base URLs |
| `ASSET_OBJECT_PREFIX` | `asset_object_prefix` | 2 | none | Unified object-key prefix, higher priority than `s3_bucket_prefix` |
| `CLOUDFLARE_R2_ACCOUNT_ID` | `cloudflare_r2_account_id` | 2 | none | Cloudflare R2 account ID |
| `CLOUDFLARE_R2_ACCESS_KEY` | `cloudflare_r2_access_key` | 2 | key | Cloudflare R2 access key |
| `CLOUDFLARE_R2_SECRET_KEY` | `cloudflare_r2_secret_key` | 2 | password | Cloudflare R2 secret key |
| `CLOUDFLARE_R2_BUCKET` | `cloudflare_r2_bucket` | 2 | none | Cloudflare R2 bucket |
| `CLOUDFLARE_R2_BASE_URL` | `cloudflare_r2_base_url` | 2 | none | Public base URL for Cloudflare R2 |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_token` | 3 | password | Vercel Blob token |

Browser direct upload currently prefers presigned `PUT` mode when `STORAGE_TYPE=s3` or `STORAGE_TYPE=r2`. Other drivers still fall back to server-side proxy upload.

### 2.4 Security And Authentication

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ALLOW_REGISTRATION` | `allow_registration` | 0 | none | Whether public sign-up is enabled |
| `ANONYMOUS_LOGIN_ENABLED` | `anonymous_login_enabled` | 0 | none | Whether guest access is enabled |
| `ENABLE_CAPTCHA` | `enable_captcha` | 0 | none | Whether captcha is enabled |
| `NUXT_PUBLIC_GITHUB_CLIENT_ID` | `github_client_id` | 2 | none | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | - | 3 | password | GitHub OAuth secret, ENV-locked |
| `NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER` | `captcha_provider` | 2 | none | Captcha provider |
| `NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY` | `captcha_site_key` | 2 | none | Captcha site key |
| `AUTH_CAPTCHA_SECRET_KEY` | - | 3 | password | Captcha secret key, ENV-locked |

### 2.5 Operations And Visual Services

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `CRON_SECRET` | - | 3 | password | Vercel Cron Bearer auth secret |
| `TASKS_TOKEN` | - | 3 | password | Task webhook token |
| `WEBHOOK_SECRET` | - | 3 | password | Webhook HMAC signing secret |
| `TASK_CRON_EXPRESSION` | - | 3 | none | Built-in cron expression for self-hosted deployments |
| `DISABLE_CRON_JOB` | - | 3 | none | Explicitly disables the built-in cron job |
| `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` | `baidu_analytics` | 0 | none | Baidu Analytics ID |
| `NUXT_PUBLIC_SENTRY_DSN` | - | 0 | key | Shared Sentry DSN for frontend and backend |
| `LOG_LEVEL` | - | 3 | none | Logging level |
| `NUXT_PUBLIC_LIVE2D_ENABLED` | `live2d_enabled` | 0 | none | Live2D widget switch |

### 2.6 Third-party And Distribution

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `MEMOS_ENABLED` | `memos_enabled` | 2 | none | Enables Memos publishing sync |
| `MEMOS_INSTANCE_URL` | `memos_instance_url` | 2 | none | Memos instance base URL |
| `MEMOS_ACCESS_TOKEN` | `memos_access_token` | 2 | key | Memos API token |
| `MEMOS_DEFAULT_VISIBILITY` | `memos_default_visibility` | 2 | none | Default Memos visibility |
| `HEXO_SYNC_ENABLED` | `hexo_sync_enabled` | 2 | none | Enables remote repository sync for Hexo-style article exports |
| `HEXO_SYNC_PROVIDER` | `hexo_sync_provider` | 2 | none | Target provider, currently `github` or `gitee` |
| `HEXO_SYNC_OWNER` | `hexo_sync_owner` | 2 | none | Target repository owner or namespace |
| `HEXO_SYNC_REPO` | `hexo_sync_repo` | 2 | none | Target repository name |
| `HEXO_SYNC_BRANCH` | `hexo_sync_branch` | 2 | none | Target branch, default `main` |
| `HEXO_SYNC_POSTS_DIR` | `hexo_sync_posts_dir` | 2 | none | Posts directory inside the repository, default `source/_posts` |
| `HEXO_SYNC_ACCESS_TOKEN` | `hexo_sync_access_token` | 3 | password | Repository write token, server-only |

Note: `HEXO_SYNC_*` is now exposed in the admin panel under System Settings > Integrations. `HEXO_SYNC_ACCESS_TOKEN` is still masked in the UI, and any value injected via environment variables remains locked as deployment-managed configuration.

## 3. Locking Rules And Notes

1. **Environment lock (`FORCED_ENV_LOCKED`)**:
   Some third-party integrations, especially Better Auth, read directly from `process.env` instead of the settings center. For `SITE_URL`, `GITHUB_*`, `GOOGLE_*`, and `CAPTCHA_*`, Momei enforces an ENV lock, so those values cannot be edited from the admin panel.

2. **Internal-only values (`INTERNAL_ONLY`)**:
   `DATABASE_URL`, `REDIS_URL`, and `AUTH_SECRET` are always host-level secrets. They never appear in the database and are not editable in the admin UI. `HEXO_SYNC_ACCESS_TOKEN` follows the same server-only rule.

3. **Hot-update behavior**:
   Non-locked settings usually take effect immediately after changes in the admin panel. Some storage-engine changes may still require a restart so the driver can be reinitialized.

4. **Scheduled-task note**:
   `WEBHOOK_TIMESTAMP_TOLERANCE` still appears in the example file, but the current implementation does not read it. Webhook timestamp tolerance is fixed to 5 minutes.
