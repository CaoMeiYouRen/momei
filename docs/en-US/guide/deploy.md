---
source_branch: master
last_sync: 2026-02-11
---

# Deployment Guide

Momei follows the **Convention over Configuration** principle. Most features are automatically activated upon detecting relevant keys, minimizing the burden of environment variable configuration.

## 1. Core Environment Variables

Momei provides two example files for reference:
-   [**.env.example**](../../.env.example): Minimalist version with only the essentials.
-   [**.env.full.example**](../../.env.full.example): Full version with all available configuration options.

For production deployment, you typically only need to configure these two variables:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `AUTH_SECRET` | **YES** | Secret key for the auth system (recommended length: 32+ chars). | `j8H2...k9L1` |
| `DATABASE_URL` | NO | Database connection URL. Defaults to local SQLite if empty. | `mysql://user:pass@host:3306/db` |

### 1.1 Smart Inference

Momei automatically infers system behavior based on your configuration:

- **Database Type**: Automatically inferred from the `DATABASE_URL` protocol (`sqlite://`, `mysql://`, `postgres://`, etc.).
- **AI Assistant**: Features (one-click translation, SEO optimization) are activated automatically once `AI_API_KEY` is provided.
- **Dev Mode**: In `NODE_ENV=development`, `AUTH_SECRET` is auto-generated and SQLite is used by default for a zero-config experience.

---

## 2. Functional Configuration

Detailed variables for each module:

### 2.1 Database & Management

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Database connection string. `sqlite://` prefix recommended. | `sqlite://database/momei.sqlite` |
| `DATABASE_SYNCHRONIZE` | Auto-sync schema. Set to `false` in production. | `false` |
| `REDIS_URL` | Redis URL (optional, for higher performance caching). | `redis://localhost:6379` |
| `ADMIN_USER_IDS` | List of admin user IDs (comma-separated). | `123123123,456456456` |
| `NUXT_PUBLIC_DEMO_MODE`| Enable Demo Mode (data is not persisted). | `false` |

### 2.2 AI Assistant (Multimodal AI)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `AI_API_KEY` | **Enables AI features once set**. | `sk-xxxx...` |
| `AI_PROVIDER` | AI provider (`openai`, `anthropic`, `deepseek`, `doubao`). | `openai` |
| `AI_MODEL` | Model ID to use. | `gpt-4o`, `deepseek-chat` |
| `AI_API_ENDPOINT` | Custom API endpoint (e.g., for proxy). | `https://api.openai.com/v1` |
| `AI_IMAGE_PROVIDER` | AI Image generator provider (`dall-e-3`, `seedream`). | `seedream` |
| `AI_IMAGE_API_KEY` | Dedicated image API key (optional, defaults to `AI_API_KEY`).| `sk-xxxx...` |
| `AI_IMAGE_API_ENDPOINT`| Image API endpoint (optional). | `https://api.openai.com/v1` |
| `AI_IMAGE_MODEL` | Image model ID. | `dall-e-3`, `Seedream-2.0` |

### 2.3 Email System (Subscription & Password Recovery)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `EMAIL_HOST` | SMTP server host. | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port. | `587` |
| `EMAIL_USER` | SMTP username. | `user@example.com` |
| `EMAIL_PASS` | SMTP password (App-specific password). | `xxxx xxxx xxxx xxxx` |
| `EMAIL_SECURE` | Use SSL/TLS. | `false` |
| `EMAIL_FROM` | Email sender address (including display name). | `Momei Blog <admin@example.com>` |

### 2.4 Object Storage

Momei supports multiple storage backends, defaulting to `local`. Switch via `STORAGE_TYPE`.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `STORAGE_TYPE` | Storage engine (`local`, `s3`, `vercel-blob`). | `local` |
| `BUCKET_PREFIX` | Path prefix for uploaded files. | `momei/` |
| `NUXT_PUBLIC_MAX_UPLOAD_SIZE` | Max upload size. | `10MB` (Default 4.5MiB) |

::: tip
If using Docker with `STORAGE_TYPE=local`, ensure you mount the upload directory to prevent data loss on container restart.
:::

#### 2.4.1 S3 Compatible Storage (STORAGE_TYPE=s3)

Works with Cloudflare R2, AWS S3, MinIO, etc.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `S3_REGION` | S3 Region (Required). | `auto` |
| `S3_BUCKET_NAME` | Bucket name (Required). | `momei-assets` |
| `S3_ACCESS_KEY_ID` | Access Key (Required). | `xxxx...` |
| `S3_SECRET_ACCESS_KEY` | Secret Key (Required). | `xxxx...` |
| `S3_ENDPOINT` | S3 API Endpoint (Optional). | `https://<id>.r2.cloudflarestorage.com` |
| `S3_BASE_URL` | Public access URL prefix (Optional). | `https://pub-xxxx.r2.dev` |

#### 2.4.2 Vercel Blob Storage (STORAGE_TYPE=vercel-blob)

For projects deployed on Vercel.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `BLOB_READ_WRITE_TOKEN`| Vercel Blob Token. | `vercel_blob_rw_...` |

#### 2.4.3 Local Storage (STORAGE_TYPE=local)

**Note**: Not supported in Serverless environments like Vercel.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `LOCAL_STORAGE_DIR` | Directory for local file storage. | `public/uploads` |
| `LOCAL_STORAGE_BASE_URL`| Base URL path for public access. | `/uploads` |
| `LOCAL_STORAGE_MIN_FREE_SPACE` | Min free space to allow writes. | `100MiB` |

---

## 3. Site & Compliance

### 3.1 Basic Site Config

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_SITE_URL` | Official site URL. | `https://momei.app` |
| `NUXT_PUBLIC_AUTH_BASE_URL`| Auth API base path. | `https://momei.app/api/auth` |
| `NUXT_PUBLIC_APP_NAME` | Site title. | `Momei Blog` |
| `NUXT_PUBLIC_SITE_OPERATOR`| Site owner/operator. | `Momei Team` |
| `NUXT_PUBLIC_CONTACT_EMAIL`| Contact email. | `admin@example.com` |
| `NUXT_PUBLIC_DEFAULT_COPYRIGHT`| Default copyright type. | `all-rights-reserved`, `cc-by-nc-sa` |

### 3.2 Compliance (Beian)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NUXT_PUBLIC_SHOW_COMPLIANCE_INFO` | Toggle compliance info display. | `false` |
| `NUXT_PUBLIC_ICP_LICENSE_NUMBER` | ICP License ID. | `粤ICP备xxxxxxxx号` |
| `NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER`| Public Security ID. | `粤公网安备 xxxxxxxxxxxxxx号` |
| `NUXT_PUBLIC_SECURITY_URL_WHITELIST`| External resource domain whitelist. | `images.unsplash.com,i.imgur.com` |
