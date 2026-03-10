---
source_branch: master
last_sync: 2026-03-10
---

# 部署指南

::: warning 翻譯說明
本頁對應 [中文原文](../../guide/deploy.md) 與 [英文版本](../../en-US/guide/deploy.md)。若內容有差異，請以中文原文為準。
:::

## 1. 支援的部署方式

- Vercel：最快速的託管方案，適合先驗證公開站點流程。
- Docker / Docker Compose：適合自管主機與私有部署。
- Cloudflare：適合需要邊緣能力與 Serverless 部署的場景。

## 2. 部署前必查項目

- 是否已設定 `AUTH_SECRET` 與基礎認證環境變數。
- 是否已確認資料庫、上傳檔案與靜態資源儲存方案。
- 是否已完成 AI、郵件、通知等可選服務的環境設定。

## 3. 建議閱讀順序

1. 先閱讀 [快速開始](./quick-start.md)。
2. 再對照 [變數與設定映射](./variables.md)。
3. 若需正式上線，請回看 [中文原文部署指南](../../guide/deploy.md)。
