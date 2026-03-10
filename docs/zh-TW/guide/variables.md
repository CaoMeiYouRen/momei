---
source_branch: master
last_sync: 2026-03-10
---

# 變數與設定映射

::: warning 翻譯說明
本頁對應 [中文原文](../../guide/variables.md) 與 [英文版本](../../en-US/guide/variables.md)。若內容有差異，請以中文原文為準。
:::

## 1. 設定來源優先序

系統設定通常遵循以下來源順序：

1. 環境變數（ENV）
2. 資料庫設定
3. 系統預設值

## 2. 高優先度變數分類

- 認證：`AUTH_SECRET` 與登入相關設定
- AI：供應商、模型、成本與額度治理
- 儲存：本地、S3、Cloudflare R2、Vercel Blob
- 郵件與通知：SMTP、Web Push、站務提醒

## 3. 使用建議

- 正式環境優先使用環境變數管理敏感資訊。
- 修改前先確認該欄位是否已被 ENV 鎖定。
- 涉及跨服務設定時，請對照 [中文原文變數頁](../../guide/variables.md)。