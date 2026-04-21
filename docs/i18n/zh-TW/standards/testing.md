---
source_branch: master
last_sync: 2026-03-10
translation_tier: source-only
source_origin: ../../../standards/testing.md
---

# 測試規範

::: warning 翻譯說明
本頁對應 [中文原文](../../../standards/testing.md)。若內容有差異，請以中文原文為準。
:::

::: info 中文事實源優先
本頁目前只保留 locale URL 與原文入口，不再承諾持續維護翻譯正文。請改讀 [中文原文](../../../standards/testing.md) 取得最新內容。
:::

本文檔說明墨梅的測試分層、命名規則、覆蓋率目標與高效執行策略，目的是讓測試既能保護核心功能，又不成為日常開發的阻塞點。

## 1. 測試工具

- **Vitest**：單元測試與整合測試主力工具
- **Playwright**：端到端測試工具
- **`pnpm test`**：常用測試入口

## 2. 目錄與命名

- 與源碼強關聯的單元測試通常與源檔同級放置，命名為 `[filename].test.ts`
- 服務端整合與 API 測試集中在 `tests/server/`
- E2E 測試放在 `tests/e2e/`，命名通常帶 `.e2e.test.ts`

## 3. 測試內容要求

- 前端組件：驗證 props、事件、關鍵狀態與必要渲染結果
- 頁面：驗證路由參數、頁面渲染與 SEO meta
- API：驗證輸入校驗、成功回應、錯誤分支與權限邏輯
- 外部依賴：適當 mock，避免污染真實環境

## 4. 覆蓋率與執行策略

- 全專案覆蓋率目標：至少約 60%
- 核心工具與服務端邏輯建議更高
- 日常開發優先跑與改動直接相關的定向測試
- 僅在大規模重構、關鍵路徑變更或安全敏感場景下執行全量測試

## 5. 提交前檢查

提交前至少建議完成：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

若本輪涉及多語言，建議再補跑 i18n audit 與文檔站構建；若涉及 UI 關鍵流程，則應考慮補 E2E 驗證。
