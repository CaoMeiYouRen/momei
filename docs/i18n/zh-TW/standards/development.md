---
source_branch: master
last_sync: 2026-03-10
translation_tier: source-only
source_origin: ../../../standards/development.md
---

# 開發規範

::: warning 翻譯說明
本頁對應 [中文原文](../../../standards/development.md)。若內容有差異，請以中文原文為準。
:::

::: info 中文事實源優先
本頁目前只保留 locale URL 與原文入口，不再承諾持續維護翻譯正文。請改讀 [中文原文](../../../standards/development.md) 取得最新內容。
:::

本文檔定義墨梅專案的核心開發原則、目錄邊界、程式風格與提交流程，目標是在功能快速演進的同時維持良好的可維護性。

## 1. 核心原則

- **模組化與組件化**：保持高內聚、低耦合。
- **型別安全**：全面使用 TypeScript，避免 `any`。
- **最小改動原則**：聚焦根因修復，不順手改動無關區域。
- **實用優先**：避免為了理論完美引入過度設計。

## 2. 代碼風格

### 2.1 命名

- 檔案使用 `kebab-case`。
- 工具函數名稱應以動詞開頭且語義清晰。
- 類型與 Schema 採用 `PascalCase`。

### 2.2 控制流程

- 優先使用 Early Return。
- 控制函數長度與巢狀深度。
- 若涉及規劃與階段評估，應同步遵守 [規劃規範](./planning.md)。

### 2.3 樣式規範

- 使用 SCSS + BEM。
- 優先重用全域變數與 mixin。
- 常規樣式中避免 `!important`；若確有必要，必須有充分理由。
- 不使用 CSS-in-JS 或 Tailwind 類方案。

## 3. 目錄與依賴邊界

- `components/`：Vue 組件
- `pages/`：Nuxt 路由頁面
- `composables/`：可重用的組合式邏輯
- `utils/shared/`：前後端皆可使用的純函數
- `utils/web/`：僅前端使用邏輯
- `server/`：服務端 API、工具與資料層
- `docs/`：設計、規範、指南與規劃文檔

依賴原則：

- `shared` 不得依賴 `web` 或 `server`
- `web` 與 `server` 可依賴 `shared`
- 避免跨層直接引用深層實作

## 4. 生成與實作要求

- 新增代碼優先使用 TypeScript。
- Vue 組件統一採用 `<script setup lang="ts">`。
- 所有 UI 文案都必須走 i18n。
- 涉及 SEO 的頁面應同步配置 head 或頁面 meta。
- 專案內部 locale 標識統一採用 `zh-CN`、`en-US`、`zh-TW`、`ko-KR`。

## 5. Git 與提交流程

- 遵循 Conventional Commits。
- 每次提交應保持原子化，避免同時混入多個功能點。
- 提交前至少完成 lint、typecheck 與必要測試。

## 6. 文件同步

任何對核心功能、配置或架構的變更，都應同步檢查：

- 是否需要更新設計文檔
- 是否需要更新使用者指南
- 是否需要更新根目錄 README

對文檔的修改應遵守 [文件規範](./documentation.md)。
