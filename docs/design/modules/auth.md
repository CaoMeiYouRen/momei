# 认证模块 (Authentication Module)

## 1. 概述 (Overview)

本模块负责用户身份认证，包括注册、登录、密码重置及第三方登录（OAuth）。

## 2. 页面设计 (UI Design)

### 2.1 登录页 (`/login`)

-   **布局**: 居中卡片布局 (Centered Card Layout)。
-   **元素**:
    -   Logo 与 欢迎语 ("欢迎回来，请登录").
    -   **OAuth 按钮组**: GitHub (Primary)
    -   **分割线**: "Or continue with email".
    -   **表单**: Email 输入框, Password 输入框, "记住我" 复选框, "忘记密码" 链接.
    -   **提交按钮**: "登录" (全宽).
    -   **底部链接**: "还没有账号? 立即注册".
-   **交互**:
    -   表单验证错误实时显示在输入框下方.
    -   点击登录后按钮显示 Loading 状态.

### 2.2 注册页 (`/register`)

-   **布局**: 同登录页。
-   **元素**:
    -   Logo 与 标题 ("创建新账号").
    -   **表单**: Name (昵称), Email, Password, Confirm Password.
    -   **提交按钮**: "注册".
    -   **底部链接**: "已有账号? 直接登录".
-   **流程**: 注册成功后自动跳转至首页或验证提示页。

### 2.3 找回/重置密码页 (`/forgot-password`, `/reset-password`)

_(待补充详细设计，参照登录页风格)_

## 3. 接口设计 (API Design)

所有认证路由由 [better-auth](https://github.com/better-auth/better-auth) 统一处理。

### 3.1 核心路由 (`/api/auth/*`)

| Method | Endpoint                    | Description  | Note                      |
| :----- | :-------------------------- | :----------- | :------------------------ |
| POST   | `/api/auth/sign-up/email`   | 邮箱注册     | { email, password, name } |
| POST   | `/api/auth/sign-in/email`   | 邮箱登录     | { email, password }       |
| POST   | `/api/auth/sign-out`        | 登出         |                           |
| GET    | `/api/auth/list-sessions`   | 获取当前会话 |                           |
| POST   | `/api/auth/revoke-session`  | 吊销会话     |                           |
| POST   | `/api/auth/forget-password` | 申请重置密码 | 发送邮件                  |
| POST   | `/api/auth/reset-password`  | 执行重置密码 |                           |

### 3.2 权限控制 (RBAC)

-   **角色**:
    -   `admin`: 系统管理员。
    -   `author`: 普通作者。
    -   `user`: 普通注册用户。
    -   `visitor`: 访客（匿名）。
