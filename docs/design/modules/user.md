# 用户中心模块 (User Center Module)

## 1. 概述 (Overview)

本模块负责用户个人信息的查看与管理，包括个人资料修改、账号安全设置等。

## 2. 页面设计 (UI Design)

### 2.1 个人设置页 (`/settings`)

-   **布局**: 侧边栏导航 (Sidebar Navigation) + 内容区域。
    -   侧边栏: 个人资料 (Profile), 账号安全 (Security).

#### 2.1.1 个人资料 (Profile)

-   **头像上传**: 圆形头像区域，点击可上传/更换图片。
-   **基本信息表单**: 昵称 (Name), 简介 (Bio).
-   **操作**: "保存更改" 按钮。

#### 2.1.2 账号安全 (Security)

-   **修改密码**: 旧密码, 新密码, 确认新密码.
-   **账号绑定**: 显示已绑定的 OAuth 账号 (GitHub)，提供解绑/绑定按钮。

## 3. 接口设计 (API Design)

### 3.1 用户自身接口

| Method | Endpoint            | Description  | Auth | Note                             |
| :----- | :------------------ | :----------- | :--- | :------------------------------- |
| UPDATE | `/api/user/profile` | 更新个人信息 | User | 底层转发至 `auth.api.updateUser` |
| POST   | `/api/user/avatar`  | 上传头像     | User | 处理文件存储并更新 User 实体     |
