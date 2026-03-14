---
source_branch: master
last_sync: 2026-03-10
---

# 部署指南

::: warning 翻譯說明
本頁依據 [中文原文](../../guide/deploy.md) 整理；若內容有差異，請以中文原文為準。
:::

墨梅的部署配置以環境變數為核心，且盡量與實際程式實作保持同步。大多數能力都遵循「填入對應變數即可啟用」的原則，但認證、定時任務與物件儲存仍建議優先由部署層管理，而不是依賴後台即時變更。

為了方便落地，本指南把配置分成三層：**核心必填**、**生產建議** 與 **體驗增強**。

## 1. 核心必填

缺少以下配置時，系統要嘛無法啟動，要嘛會在登入、資料庫初始化或公開連結生成階段出現明顯錯誤。

- **`AUTH_SECRET`**：Better Auth 與服務端簽章的核心密鑰。
	- 建議使用 `openssl rand -hex 32` 產生。
- **`NUXT_PUBLIC_SITE_URL`**：站點對外公開網址，影響 SEO、Sitemap、RSS 與公開連結。
- **`NUXT_PUBLIC_AUTH_BASE_URL`**：Better Auth 回呼基址。
	- 生產環境下通常應與 `NUXT_PUBLIC_SITE_URL` 一致。
- **`DATABASE_URL`**：資料庫連線字串。
	- SQLite：`sqlite://database/momei.sqlite`
	- MySQL：`mysql://user:pass@host:3306/db`
	- PostgreSQL：`postgres://user:pass@host:5432/db`

## 2. 生產建議配置

這一層不是「能否開機」的門檻，但幾乎決定了線上部署是否穩定、好維護且具備完整能力。

### 2.1 資料庫與快取

- **`DATABASE_SYNCHRONIZE=false`**：生產環境建議固定為 `false`。
- **`REDIS_URL`**：若要使用快取、部分限流或分散式能力，建議補齊。

### 2.2 AI 與多模態能力

- **`AI_PROVIDER`** / **`AI_API_KEY`** / **`AI_MODEL`**：文字 AI 主引擎。
- **`AI_API_ENDPOINT`**：OpenAI 相容服務或代理端點。
- **`AI_HEAVY_TASK_TIMEOUT`**：控制 TTS / ASR / AI 圖像等重任務的超時窗口。
- **`AI_TEXT_DIRECT_RETURN_MAX_CHARS`**、**`AI_TEXT_TASK_CHUNK_SIZE`**、**`AI_TEXT_TASK_CONCURRENCY`**：控制翻譯與長文本處理的直返門檻、分塊大小與併發。
- **`GEMINI_API_TOKEN`**：Gemini 使用獨立 Token 驗證時需要。
- **`AI_IMAGE_ENABLED`**、**`AI_IMAGE_PROVIDER`**、**`AI_IMAGE_API_KEY`**：AI 配圖鏈路。
- **`ASR_ENABLED`**、**`ASR_PROVIDER`**、**`ASR_API_KEY`**、**`ASR_MODEL`**、**`ASR_ENDPOINT`**：語音識別基礎配置。
- **`TTS_ENABLED`**、**`TTS_PROVIDER`**、**`TTS_API_KEY`**、**`TTS_DEFAULT_MODEL`**：文字轉語音配置。
- **`AI_QUOTA_ENABLED`**、**`AI_QUOTA_POLICIES`**、**`AI_ALERT_THRESHOLDS`**：AI 成本與額度治理。

### 2.3 儲存與媒體資產

- **`STORAGE_TYPE`**：建議使用 `local`、`s3`、`r2` 或 `vercel_blob`。
	- 舊值 `vercel-blob` 仍可讀取，但新配置統一使用 `vercel_blob`。
- **本機儲存**：`LOCAL_STORAGE_DIR`、`NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL`、`LOCAL_STORAGE_MIN_FREE_SPACE`
- **S3 相容儲存**：`S3_ENDPOINT`、`S3_BUCKET_NAME`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`S3_BASE_URL`
- **Cloudflare R2**：`CLOUDFLARE_R2_ACCOUNT_ID`、`CLOUDFLARE_R2_ACCESS_KEY`、`CLOUDFLARE_R2_SECRET_KEY`、`CLOUDFLARE_R2_BUCKET`、`CLOUDFLARE_R2_BASE_URL`
- **公共資產治理**：`ASSET_PUBLIC_BASE_URL`、`ASSET_OBJECT_PREFIX`、`BUCKET_PREFIX`
- **Vercel Blob**：`BLOB_READ_WRITE_TOKEN`

說明：當 `STORAGE_TYPE=s3` 或 `STORAGE_TYPE=r2` 時，瀏覽器直傳會優先走 `PUT` 預簽名授權；`local` 與 `vercel_blob` 則繼續回退到服務端代理上傳。

### 2.4 郵件與通知

- **`EMAIL_HOST`** / **`EMAIL_PORT`** / **`EMAIL_USER`** / **`EMAIL_PASS`** / **`EMAIL_FROM`**
- **`EMAIL_REQUIRE_VERIFICATION`**：生產環境建議開啟，降低垃圾註冊風險。

### 2.5 定時任務與自動化

- **`CRON_SECRET`**：Vercel Cron 專用 Bearer 驗證密鑰。
- **`TASKS_TOKEN`**：排程任務 Webhook 的基礎驗證令牌。
- **`WEBHOOK_SECRET`**：建議額外配置，用於 HMAC 驗簽。
- **`TASK_CRON_EXPRESSION`**：自託管環境覆蓋內建排程頻率。
- **`DISABLE_CRON_JOB=true`**：顯式停用自託管環境中的內建 Cron。

## 3. 體驗增強配置

這一層主要補齊監控、品牌資訊、視覺效果與商業化預設。

- **站點元資料**：
	- `NUXT_PUBLIC_APP_NAME`
	- `NUXT_PUBLIC_SITE_DESCRIPTION`
	- `NUXT_PUBLIC_SITE_KEYWORDS`
	- `NUXT_PUBLIC_CONTACT_EMAIL`
	- `NUXT_PUBLIC_DEFAULT_COPYRIGHT`
	- `NUXT_PUBLIC_FOOTER_COPYRIGHT_OWNER`
	- `NUXT_PUBLIC_FOOTER_COPYRIGHT_START_YEAR`
- **分析與監控**：
	- `NUXT_PUBLIC_BAIDU_ANALYTICS_ID`
	- `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`
	- `NUXT_PUBLIC_CLARITY_PROJECT_ID`
	- `NUXT_PUBLIC_SENTRY_DSN`
- **視覺特效**：
	- `NUXT_PUBLIC_LIVE2D_ENABLED`
	- `NUXT_PUBLIC_CANVAS_NEST_ENABLED`
	- `NUXT_PUBLIC_EFFECTS_MOBILE_ENABLED`
- **中國區合規資訊**：
	- `NUXT_PUBLIC_SHOW_COMPLIANCE_INFO`
	- `NUXT_PUBLIC_ICP_LICENSE_NUMBER`
	- `NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER`
- **商業化預設**：`COMMERCIAL_SPONSORSHIP_JSON`

## 4. 常見服務通道示例

### 4.1 SiliconFlow：文字 + ASR / TTS 一體化

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

### 4.2 Volcengine / 豆包：文字或 ASR 分離接入

如果你只接入火山 ASR：

```dotenv
ASR_ENABLED=true
ASR_PROVIDER=volcengine
ASR_VOLCENGINE_APP_ID=888888
ASR_VOLCENGINE_ACCESS_KEY=AK-xxx
ASR_VOLCENGINE_SECRET_KEY=SK-xxx
ASR_VOLCENGINE_CLUSTER_ID=volc.bigasr.sauc.duration
```

如果文字 AI 也走火山鏈路，再補充：

```dotenv
AI_PROVIDER=volcengine
AI_API_KEY=your-text-api-key
AI_MODEL=ep-2024xxx
```

### 4.3 Memos 同步

```dotenv
MEMOS_ENABLED=true
MEMOS_INSTANCE_URL=https://memos.yourdomain.com
MEMOS_ACCESS_TOKEN=xxx
MEMOS_DEFAULT_VISIBILITY=PRIVATE
```

## 5. 部署到主流平台

- **Vercel**：適合 Serverless 部署。
	- 建議 `STORAGE_TYPE=vercel_blob` 或外接 S3 / R2。
	- 應配置 `CRON_SECRET` 供平台自動注入 Bearer Header。
	- 內建排程由 [vercel.json](../../vercel.json) 觸發。
- **Docker / 自託管主機**：適合需要本機磁碟、排程控制與較高可控性的場景。
	- 建議掛載 `database/` 與上傳目錄。
	- 若需內建 Cron，可使用 `TASK_CRON_EXPRESSION` 自訂頻率。
- **Cloudflare Pages / Workers**：
	- 建議搭配 R2 或 S3 相容儲存。
	- 定時任務通常由平台 Scheduled Events 觸發，而非本機 Cron 程序。
	- CLI 部署命令為 `pnpm deploy:wrangler`。

## 6. 排障指引

- **登入回呼錯誤**：檢查 `NUXT_PUBLIC_SITE_URL` 與 `NUXT_PUBLIC_AUTH_BASE_URL` 是否都指向最終公開域名，且協議一致。
- **定時任務 401**：確認觸發方式是否與 `CRON_SECRET`、`TASKS_TOKEN` 或 `WEBHOOK_SECRET` 的配置相符。
- **Volcengine ASR 未生效**：優先檢查 `ASR_VOLCENGINE_APP_ID`、`ASR_VOLCENGINE_ACCESS_KEY`、`ASR_VOLCENGINE_CLUSTER_ID`。
- **AI 相容接口報錯**：確認 `AI_API_ENDPOINT` 是否需要帶 `/v1`。
- **直傳仍走代理上傳**：確認 `STORAGE_TYPE` 是否為 `s3` 或 `r2`，並檢查 Bucket、憑據與公開地址是否完整。
- **本機資源 404**：檢查 `LOCAL_STORAGE_DIR` 是否存在，以及 `NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL` 是否與實際靜態路徑一致。

## 7. 延伸閱讀

- [變數與設定映射](./variables.md)：查看環境變數與設定中心鍵名的大致對應。
- [完整環境變數示例](../../.env.full.example)：查看當前版本支援的完整矩陣。
- [系統集成設計文檔](../design/api.md)：從高層理解後端、儲存與外部服務的整合邊界。

墨梅的部署原則很直接：**先把核心變數配齊讓系統穩定跑起來，再按模組逐步啟用 AI、儲存、任務與營運能力。**
