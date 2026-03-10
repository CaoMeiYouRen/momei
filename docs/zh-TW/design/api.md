---
source_branch: master
last_sync: 2026-03-10
---

# API 設計

::: warning 翻譯說明
本頁對應 [中文原文](../../design/api.md)。若內容有差異，請以中文原文為準。
:::

本文檔描述墨梅後端架構與 API 的高層設計，重點在於說明認證方式、資料模型邊界、路由拆分方式，以及不同模組如何共用統一規範。

## 1. 技術棧與定位

- **執行框架**：Nitro / Nuxt Server Engine
- **認證與授權**：better-auth
- **ORM**：TypeORM
- **資料庫**：支援 PostgreSQL、MySQL、SQLite
- **參數校驗**：Zod
- **郵件服務**：Nodemailer

後端設計的核心目標是：安全、易擴展、適配多部署環境，並且與前端的國際化、通知與內容工作流保持一致。

## 2. 認證與權限設計

- 支援 Email / Password 與 OAuth 等多種登入方式。
- 角色模型至少包含 `admin`、`author`、`user`。
- 服務端應盡量透過統一權限工具完成授權判斷，而不是在每個 Handler 中重寫邏輯。

## 3. 路由與模組劃分

具體接口按模組拆分，常見類別包括：

- 認證系統：`/api/auth/*`
- 使用者空間：`/api/user/*`
- 博客內容：`/api/posts/*`
- 分類與標籤：`/api/categories/*`、`/api/tags/*`
- 互動系統：`/api/comments/*`
- 管理端能力：`/api/admin/*`
- AI 助手：`/api/ai/*`
- 通知與訂閱：`/api/subscribers/*`
- 任務與排程：`/api/tasks/*`
- 系統能力：上傳、設定、安裝等接口

## 4. 國際化與 Slug 策略

- 文章、分類、標籤通常以 `(slug, language)` 保持聯合唯一。
- 同一內容的多語版本透過 `translationId` 關聯為翻譯簇。
- 語言切換時可根據 `translationId` 精準跳到對應版本。

## 5. 維護原則

- 具體模組的 API 細節應在各自模組設計文檔中維護。
- 若回應格式、驗證方式或權限邊界發生變化，需同步更新 [API 規範](../standards/api.md)。
- 涉及資料模型的改動，也要同步回看 [資料庫設計](./database.md)。