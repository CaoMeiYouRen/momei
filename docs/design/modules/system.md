# 系统与通用模块 (System & Common Module)

## 1. 概述 (Overview)

本模块包含系统级通用服务与外部集成接口。

## 2. 接口设计 (API Design)

### 2.1 文件上传 (Upload)

-   `POST /api/upload`
    -   **Auth**: User/Admin
    -   **Feature**: 支持图片/文件上传，对接本地存储或 S3。

### 2.2 外部接口 (External APIs)

供第三方程序通过 API Key 调用的接口。

-   **鉴权**: Header `X-API-KEY`.
-   **POST /api/external/posts**
    -   创建文章 (Body: title, content, slug, tags...).

## 3. 通用 UI 规范 (Common UI)

_(虽然本模块主要偏后端，但可在此定义全局通用的 UI 组件行为)_

-   **Toasts/Notifications**: 全局消息通知。
-   **Modals/Dialogs**: 通用弹窗交互。
-   **Loading**: 全局加载条 (Nuxt Loading Indicator).
