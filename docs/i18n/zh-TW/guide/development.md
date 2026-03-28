---
source_branch: master
last_sync: 2026-03-18
---

# 開發指南

::: warning 翻譯說明
本頁對應 [中文原文](../../../guide/development.md)。若內容有差異，請以中文原文為準。
:::

本指南旨在協助開發者快速搭建墨梅的本機開發環境，並在理解專案規範的前提下參與功能開發、文件更新與品質驗證。

## 1. 環境準備

開始之前，請先確認你的系統已安裝：

- **Node.js**：`>= 20.x`
- **PNPM**：建議使用最新穩定版
- **Git**

若你需要測試完整的資料庫、郵件或物件儲存鏈路，也建議預先準備對應的本機或雲端資源。

## 2. 本機搭建流程

1. **複製專案**：

    ```bash
    git clone https://github.com/CaoMeiYouRen/momei.git
    cd momei
    ```

2. **安裝依賴**：

    ```bash
    pnpm install
    ```

3. **配置環境變數（可選）**：

    墨梅支援開發環境的零設定啟動。如果你需要自訂資料庫或 AI Key，可以從模板複製：

    ```bash
    cp .env.example .env
    # 或查看完整配置
    cp .env.full.example .env
    ```

    若沒有自訂 `.env`，系統會預設使用 SQLite，並自動生成開發用 Secret。若你要對接後台設定中心中的可管理項，建議優先沿用與設定服務映射一致的變數，例如：

    - `AI_QUOTA_ENABLED`
    - `AI_QUOTA_POLICIES`
    - `ASSET_PUBLIC_BASE_URL`
    - `ASSET_OBJECT_PREFIX`
    - `MEMOS_INSTANCE_URL`
    - `MEMOS_ACCESS_TOKEN`

4. **啟動開發伺服器**：

    ```bash
    pnpm dev
    ```

    啟動後造訪 `http://localhost:3000`，即可看到即時生效的變更。

## 3. 開發規範概要

為了讓專案邏輯與文件保持一致，日常開發時請遵循以下核心準則：

- **命名**：檔案使用 `kebab-case`，型別與 Schema 使用 `PascalCase`。
- **控制流程**：優先使用 Early Return，降低巢狀複雜度。
- **樣式**：採用 SCSS + BEM，常規樣式中避免 `!important`。
- **國際化**：所有 UI 文案都必須經過 i18n 鏈路，不要直接硬編碼文字。
- **設定讀取**：後端優先透過設定服務存取可熱更新配置，前端則透過現有 composable 讀取公開設定。

::: tip 提示
若你要修改核心邏輯、共享工具或後台模組，務必進一步閱讀 [開發規範](../standards/development.md) 與 [規劃規範](../standards/planning.md)。
:::

## 4. 常用命令

| 指令 | 說明 |
| :--- | :--- |
| `pnpm dev` | 啟動開發伺服器 |
| `pnpm build` | 建置生產版本 |
| `pnpm lint` | 執行 TypeScript / Vue 代碼檢查 |
| `pnpm lint:i18n` | 單獨執行 `@intlify/vue-i18n` 慢規則檢查 |
| `pnpm lint:css` | 執行樣式檢查 |
| `pnpm i18n:audit` | 稽核 i18n 模組與鍵集完整度 |
| `pnpm test` | 執行單元測試 |
| `pnpm test:e2e` | 執行 Playwright 端對端測試 |
| `pnpm typecheck` | 執行 TypeScript 型別檢查 |
| `pnpm deploy:wrangler` | 調試 wrangler 側適配（不代表支援整站部署到 Cloudflare） |

## 5. 參與貢獻

1. Fork 本專案。
2. 建立功能分支，例如 `git checkout -b feat/amazing-feature`。
3. 在本機完成功能、文件與必要測試。
4. 推送分支並提交 Pull Request。
5. 在 PR 說明中補充已執行的 lint、typecheck、測試與 i18n / 文件站驗證結果。

如果你的改動涉及多語言、AI、通知、設定或安全邊界，請在提交前一併確認對應的文件與設計說明是否已同步更新。
