---
source_branch: master
last_sync: 2026-03-10
---

# API 規範

::: warning 翻譯說明
本頁對應 [中文原文](../../standards/api.md) 與 [英文版本](../../en-US/standards/api.md)。若內容有差異，請以中文原文為準。
:::

## 1. 核心要求

- API 採用一致的回應結構。
- 路由命名、驗證與權限控制需保持一致。
- 管理端與公開端 API 的邊界需清楚分離。

## 2. 檢查重點

- 是否有 schema / type 作為介面邊界。
- 是否有正確的錯誤碼與錯誤訊息。
- 是否覆蓋必要的認證與授權。

## 3. 參考來源

- [中文 API 規範](../../standards/api.md)
- [API 設計](../design/api.md)