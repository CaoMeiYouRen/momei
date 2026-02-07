# 用户中心模块 (User Center Module)

## 1. 概述 (Overview)

本模块负责用户个人信息的查看与管理，包括个人资料修改、账号安全设置等。

## 2. 页面设计 (UI Design)

### 2.1 个人设置页 (`/settings`)

-   **布局**: 侧边栏导航 (Sidebar Navigation) + 内容区域。
    -   侧边栏: 个人资料 (Profile), 安全设置 (Security), API 密钥 (API Keys).

#### 2.1.1 个人资料 (Profile)

-   **头像上传**: 圆形头像区域，点击上传。
-   **基本信息**: 昵称 (Name), 个人简介 (Bio), 语言偏好.

#### 2.1.2 安全设置 (Security)

-   **密码管理**: 修改登录密码。
-   **账号绑定**: 管理 GitHub/Google 等第三方账号关联。

#### 2.1.3 API 密钥 (API Keys)

-   **列表展示**: 显示已创建的密钥名称、前缀、最后使用时间。
-   **创建密钥**: 用户可自定义密钥名称。
-   **删除密钥**: 撤销已发放的密钥。

## 3. 接口设计 (API Design)

### 3.1 用户设置

| Method | Endpoint            | Description         | Auth |
| :----- | :------------------ | :------------------ | :--- |
| PUT    | `/api/user/profile` | 更新个人资料/语言等 | User |
| POST   | `/api/user/avatar`  | 上传并更新头像       | User |

### 3.2 API 密钥管理

| Method | Endpoint                    | Description      | Auth |
| :----- | :-------------------------- | :--------------- | :--- |
| GET    | `/api/user/api-keys`        | 获取密钥列表     | User |
| POST   | `/api/user/api-keys`        | 创建新密钥       | User |
| DELETE | `/api/user/api-keys/:id`    | 删除指定密钥     | User |
