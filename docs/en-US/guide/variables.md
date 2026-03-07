---
source_branch: master
last_sync: 2026-03-07
---

# Variables & Settings Mapping

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../guide/variables.md) shall prevail.
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
| `NUXT_PUBLIC_DEFAULT_COPYRIGHT` | `site_copyright` | 0 | none | Default copyright declaration |
| `NUXT_PUBLIC_CONTACT_EMAIL` | `contact_email` | 0 | email | Public contact email |
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
| `GEMINI_API_TOKEN` | `gemini_api_token` | 2 | key | Dedicated Gemini token |
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

### 2.3 Storage And Database

| Environment Variable | SettingKey | Level | Mask | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | - | 3 | password | Database DSN, never stored in the database |
| `REDIS_URL` | - | 3 | password | Cache / rate-limit DSN |
| `STORAGE_TYPE` | `storage_type` | 2 | none | Storage engine: local / s3 / vercel-blob |
| `S3_ACCESS_KEY_ID` | `s3_access_key` | 2 | key | S3-compatible access key |
| `S3_SECRET_ACCESS_KEY` | `s3_secret_key` | 2 | password | S3-compatible secret key |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_token` | 3 | password | Vercel Blob token |

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
| `TASKS_TOKEN` | - | 3 | password | Task webhook token |
| `WEBHOOK_SECRET` | - | 3 | password | Webhook HMAC signing secret |
| `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` | `baidu_analytics` | 0 | none | Baidu Analytics ID |
| `NUXT_PUBLIC_SENTRY_DSN` | - | 0 | key | Shared Sentry DSN for frontend and backend |
| `LOG_LEVEL` | - | 3 | none | Logging level |
| `NUXT_PUBLIC_LIVE2D_ENABLED` | `live2d_enabled` | 0 | none | Live2D widget switch |

## 3. Locking Rules And Notes

1. **Environment lock (`FORCED_ENV_LOCKED`)**:
   Some third-party integrations, especially Better Auth, read directly from `process.env` instead of the settings center. For `SITE_URL`, `GITHUB_*`, `GOOGLE_*`, and `CAPTCHA_*`, Momei enforces an ENV lock, so those values cannot be edited from the admin panel.

2. **Internal-only values (`INTERNAL_ONLY`)**:
   `DATABASE_URL`, `REDIS_URL`, and `AUTH_SECRET` are always host-level secrets. They never appear in the database and are not editable in the admin UI.

3. **Hot-update behavior**:
   Non-locked settings usually take effect immediately after changes in the admin panel. Some storage-engine changes may still require a restart so the driver can be reinitialized.

4. **Scheduled-task note**:
   `WEBHOOK_TIMESTAMP_TOLERANCE` still appears in the example file, but the current implementation does not read it. Webhook timestamp tolerance is fixed to 5 minutes.
