---
source_branch: master
last_sync: 2026-04-21
---

# 變數與設定映射

::: warning 翻譯說明
本頁對應 [中文原文](../../../guide/variables.md)。若內容有差異，請以中文原文為準。
:::

本頁用來說明墨梅中的環境變數、系統設定鍵名（`SettingKey`）、可見等級與脫敏策略之間的關係。理解這套映射，能幫助你更安全地配置部署環境，也能避免在後台誤以為某些欄位可以熱修改。

## 1. 核心概念

### 1.1 配置來源優先級

墨梅採用 **環境變數優先** 的策略：

1. **環境變數（ENV）**：最高優先級。若已配置 ENV，資料庫中的對應值通常會被忽略，後台也會顯示為唯讀或受限。
2. **系統設定（Database）**：若未配置 ENV，系統會嘗試從資料庫 `setting` 表讀取，可由後台熱修改。
3. **程式預設值**：若前兩者都沒有，則回退到代碼內預設值。

### 1.2 配置等級

- **Level 0（公開）**：任何人可見，例如站點名稱。
- **Level 1（受限）**：僅登入用戶可見。
- **Level 2（管理）**：僅管理員可見，必要時支援脫敏。
- **Level 3（內核）**：只在服務端可見，不透過 API 返回前端，例如 `AUTH_SECRET`。

### 1.3 脫敏方式

- **none**：原樣顯示。
- **password**：完全遮蔽。
- **key**：保留前後少量字元，中間遮蔽。
- **email**：以郵箱規則進行脫敏。

## 2. 重要映射類別

### 2.1 基礎核心配置

| 環境變數 | 設定鍵名 | 等級 | 說明 |
| :--- | :--- | :--- | :--- |
| `NUXT_PUBLIC_APP_NAME` | `site_name` / `site_title` | 0 | 站點名稱與部分公開文案 |
| `NUXT_PUBLIC_SITE_URL` | - | 0 | SEO、Sitemap、RSS 與公開連結的基礎 URL |
| `AUTH_SECRET` | - | 3 | Better Auth 核心密鑰，僅允許透過 ENV 配置 |
| `NUXT_PUBLIC_AUTH_BASE_URL` | `site_url` | 0 | Better Auth 回呼地址 |
| `NUXT_PUBLIC_POST_COPYRIGHT` | `post_copyright` | 0 | 預設文章版權協議（相容舊變數 `NUXT_PUBLIC_DEFAULT_COPYRIGHT`） |
| `NUXT_PUBLIC_CONTACT_EMAIL` | `contact_email` | 0 | 公開聯絡郵箱 |
| `NUXT_PUBLIC_SITE_COPYRIGHT_OWNER` | `site_copyright_owner` | 0 | 站點版權顯示的權利人（相容舊變數 `NUXT_PUBLIC_FOOTER_COPYRIGHT_OWNER`） |
| `NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR` | `site_copyright_start_year` | 0 | 站點版權年份區間的起始年份（相容舊變數 `NUXT_PUBLIC_FOOTER_COPYRIGHT_START_YEAR`） |

### 2.2 AI 與多模態配置

| 環境變數 | 設定鍵名 | 等級 | 說明 |
| :--- | :--- | :--- | :--- |
| `AI_ENABLED` | `ai_enabled` | 0 | 是否開啟全站 AI |
| `AI_PROVIDER` | `ai_provider` | 2 | 文字 AI 提供商 |
| `AI_API_KEY` | `ai_api_key` | 2 | AI 密鑰 |
| `AI_MODEL` | `ai_model` | 2 | 預設模型名稱 |
| `AI_API_ENDPOINT` | `ai_endpoint` | 2 | 相容接口或代理地址 |
| `AI_QUOTA_ENABLED` | `ai_quota_enabled` | 2 | AI 額度治理開關 |
| `AI_QUOTA_POLICIES` | `ai_quota_policies` | 2 | 配額策略 JSON |
| `AI_ALERT_THRESHOLDS` | `ai_alert_thresholds` | 2 | 告警閾值 JSON |
| `ASR_ENABLED` | `asr_enabled` | 0 | 語音轉文字開關 |
| `TTS_ENABLED` | `tts_enabled` | 0 | 文字轉語音開關 |

### 2.3 資料庫與儲存

| 環境變數 | 設定鍵名 | 等級 | 說明 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | - | 3 | 資料庫連線字串 |
| `REDIS_URL` | - | 3 | 快取 / 限流連線字串 |
| `STORAGE_TYPE` | `storage_type` | 2 | 儲存驅動，標準值為 `local` / `s3` / `r2` / `vercel_blob` |
| `LOCAL_STORAGE_DIR` | `local_storage_dir` | 2 | 本機儲存目錄 |
| `S3_ENDPOINT` | `s3_endpoint` | 2 | S3 相容 endpoint |
| `S3_BUCKET_NAME` | `s3_bucket` | 2 | S3 Bucket 名稱 |
| `ASSET_PUBLIC_BASE_URL` | `asset_public_base_url` | 2 | 靜態資產公共訪問前綴 |
| `ASSET_OBJECT_PREFIX` | `asset_object_prefix` | 2 | 靜態資產對象路徑前綴 |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_token` | 3 | Vercel Blob 專用 Token |

說明：目前瀏覽器直傳在 `STORAGE_TYPE=s3` 或 `STORAGE_TYPE=r2` 時優先使用預簽名 `PUT`；其他驅動會回退到服務端代理上傳。

### 2.4 認證與安全

| 環境變數 | 設定鍵名 | 等級 | 說明 |
| :--- | :--- | :--- | :--- |
| `ALLOW_REGISTRATION` | `allow_registration` | 0 | 是否開放註冊 |
| `ENABLE_CAPTCHA` | `enable_captcha` | 0 | 是否啟用驗證碼 |
| `NUXT_PUBLIC_GITHUB_CLIENT_ID` | `github_client_id` | 2 | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | - | 3 | GitHub OAuth Secret |
| `NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER` | `captcha_provider` | 2 | 驗證碼提供商 |
| `AUTH_CAPTCHA_SECRET_KEY` | - | 3 | 驗證碼服務密鑰 |

### 2.5 任務、通知與第三方服務

| 環境變數 | 設定鍵名 | 等級 | 說明 |
| :--- | :--- | :--- | :--- |
| `CRON_SECRET` | - | 3 | Vercel Cron Bearer 驗證密鑰 |
| `TASKS_TOKEN` | - | 3 | 任務 Webhook 驗證令牌 |
| `WEBHOOK_SECRET` | - | 3 | HMAC 驗簽密鑰 |
| `MEMOS_ENABLED` | `memos_enabled` | 2 | 是否啟用 Memos 同步 |
| `MEMOS_INSTANCE_URL` | `memos_instance_url` | 2 | Memos 實例位址 |
| `MEMOS_ACCESS_TOKEN` | `memos_access_token` | 2 | Memos API Token |
| `HEXO_SYNC_ENABLED` | `hexo_sync_enabled` | 2 | 是否啟用 Hexo 風格倉庫同步 |
| `HEXO_SYNC_PROVIDER` | `hexo_sync_provider` | 2 | 目標提供商，當前支援 `github` / `gitee` |
| `HEXO_SYNC_OWNER` | `hexo_sync_owner` | 2 | 目標倉庫 Owner / 命名空間 |
| `HEXO_SYNC_REPO` | `hexo_sync_repo` | 2 | 目標倉庫名稱 |
| `HEXO_SYNC_BRANCH` | `hexo_sync_branch` | 2 | 目標分支，預設 `main` |
| `HEXO_SYNC_POSTS_DIR` | `hexo_sync_posts_dir` | 2 | 倉庫內文章目錄，預設 `source/_posts` |
| `HEXO_SYNC_ACCESS_TOKEN` | `hexo_sync_access_token` | 3 | 倉庫寫入令牌，僅服務端可讀 |

補充：目前 Hexo 倉庫同步候選能力尚未接入通用系統設定頁，因此 `HEXO_SYNC_*` 應暫時視為部署層配置，避免在後台保存其他設定時被隱式回寫。

## 3. 鎖定機制與注意事項

1. **環境變數鎖定**：由於部分第三方庫會直接讀取 `process.env`，某些配置會被強制鎖定為部署層管理，後台無法修改。
2. **內部獨占配置**：像 `DATABASE_URL`、`REDIS_URL`、`AUTH_SECRET` 這類系統核心變數，永遠不應進入一般後台設定介面；`HEXO_SYNC_ACCESS_TOKEN` 也遵循同樣規則。
3. **熱更新邊界**：非鎖定類配置通常可在後台即時生效，但切換儲存驅動等場景仍可能需要重啟。
4. **排程補充**：`WEBHOOK_TIMESTAMP_TOLERANCE` 目前仍存在於示例檔案中，但當前實作尚未真正讀取它。

## 4. 使用建議

- 生產環境請優先用環境變數管理敏感資訊。
- 在後台修改前，先確認欄位是否已被 ENV 鎖定。
- 若配置涉及 AI、儲存、通知與任務，建議同步閱讀 [部署指南](./deploy.md) 與 [API 規範](../standards/api.md)。
