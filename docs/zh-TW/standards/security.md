---
source_branch: master
last_sync: 2026-03-10
---

# 安全開發規範

::: warning 翻譯說明
本頁對應 [中文原文](../../standards/security.md) 與 [英文版本](../../en-US/standards/security.md)。若內容有差異，請以中文原文為準。
:::

## 1. 核心原則

- 不可硬編碼敏感資訊。
- 環境變數、權限檢查與管理端能力需清楚隔離。
- CLI 與自動化腳本執行前要先確認路徑與上下文。

## 2. 高風險區域

- 認證與授權
- 管理端設定與敏感 API
- 檔案上傳、郵件與第三方服務金鑰

## 3. 配套閱讀

- [API 規範](./api.md)
- [中文安全規範](../../standards/security.md)