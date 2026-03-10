---
source_branch: master
last_sync: 2026-03-10
---

# 開發指南

::: warning 翻譯說明
本頁對應 [中文原文](../../guide/development.md) 與 [英文版本](../../en-US/guide/development.md)。若內容有差異，請以中文原文為準。
:::

## 1. 本機開發流程

- 安裝依賴：`pnpm install`
- 啟動開發：`pnpm dev`
- 執行 lint：`pnpm lint`
- 執行型別檢查：`pnpm typecheck`

## 2. 開發時的重點

- 優先沿用既有 Nuxt、TypeScript、SCSS 與 i18n 結構。
- 功能變更後同步檢查文件、測試與待辦狀態。
- 涉及多語言變更時，同步關注 locale parity、郵件文案與文檔站入口。

## 3. 配套文檔

- [變數與設定映射](./variables.md)
- [AI 驅動開發指南](./ai-development.md)
- [中文開發指南](../../guide/development.md)