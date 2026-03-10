---
source_branch: master
last_sync: 2026-03-10
---

# API 規範

::: warning 翻譯說明
本頁對應 [中文原文](../../standards/api.md)。若內容有差異，請以中文原文為準。
:::

本文檔定義墨梅後端接口的通用規範，包括回應格式、認證機制、參數校驗與任務接口要求。所有 API 開發都應以這份規範為基準。

## 1. HTTP 方法規範

專案統一使用以下四種標準 HTTP 方法：

- **GET**：獲取資源。
- **POST**：建立資源。
- **PUT**：更新資源，包含完整或部分更新。
- **DELETE**：刪除資源。

專案不使用 `PATCH`；所有局部更新都應統一收斂到 `PUT`。

## 2. 統一回應格式

除流式接口與下載場景外，API 應返回統一 JSON 結構：

```typescript
interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data?: T;
    locale?: string;
}
```

常用狀態碼：

| Code | 說明 |
| :--- | :--- |
| `200` | 成功 |
| `400` | 請求參數錯誤 |
| `401` | 未授權 |
| `403` | 禁止訪問 |

對於列表接口，應使用統一的分頁結構，資料列表字段固定為 `items`，不要混用 `list` 等名稱。

## 3. 認證與授權

- 專案統一使用 **better-auth**。
- Session 應採用 Cookie 模式，以兼容 SSR。
- 權限判斷優先使用語意化的工具函數，例如 `requireAuth`、`requireAdmin`、`requireAdminOrAuthor`。
- 避免在 Handler 中手寫複雜角色邏輯，降低重複與風險。

## 4. 參數校驗

所有輸入參數（Query、Body、Params）都必須經由 **Zod** schema 驗證。

```typescript
const createPostSchema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});
```

若 schema 會被前後端共用，建議放入共享目錄以避免重複定義。

## 5. 郵件與任務接口

- 郵件應使用統一的發送抽象，並通過獨立 locale 管理多語文案。
- 任務接口（例如 `/api/tasks/*`）必須具備鑑權校驗。
- 長耗時任務應設計成異步流程，返回任務 ID，前端再輪詢或接收狀態更新。
- 任務接口需具備冪等性與詳細日誌。

## 6. 維護要求

- 具體業務接口的路由、參數與回應結構，應同步記錄於對應模組設計文檔。
- 變更資料更新模式時，優先使用既有工具（例如 `assignDefined`）同步普通字段。
- 若代碼實作與文檔不一致，應以代碼變更為契機同步更新設計說明。