---
source_branch: master
last_sync: 2026-03-10
---

# 測試規範

::: warning 翻譯說明
本頁對應 [中文原文](../../standards/testing.md) 與 [英文版本](../../en-US/standards/testing.md)。若內容有差異，請以中文原文為準。
:::

## 1. 測試目標

測試需覆蓋單元、整合與關鍵回歸路徑，確保變更不只在本機可執行，也能穩定交付。

## 2. 常用檢查

- `pnpm lint`
- `pnpm typecheck`
- 定向 Vitest 測試
- i18n parity 與文件站構建

## 3. 多語言變更補充

- locale 變更後需執行 i18n audit。
- 重要語系擴展需檢查郵件、設定頁與文件站入口。