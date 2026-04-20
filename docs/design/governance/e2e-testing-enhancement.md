# E2E 测试增强设计文档 (E2E Testing Enhancement)

## 1. 概述 (Overview)

端对端 (E2E) 测试是确保墨梅博客平台核心业务流程稳定性的关键。目前的 E2E 测试仅覆盖了首页的基础渲染、语言切换和主题切换等表面逻辑。为了实现项目高质量交付的目标，本文档旨在分析当前的 E2E 测试现状，识别关键测试盲区，并设计一套完整的增强方案。

## 2. 现状分析 (Current Status)

### 2.1 已有覆盖量
目前已建立基础测试框架，包含：
-   首页基础渲染、i18n 语言切换、暗色模式切换 (`home.e2e.test.ts`)。
-   身份验证基础页面显示 (`auth.e2e.test.ts`)。
-   初步封装的身份验证辅助类 (`auth.helper.ts`)。

### 2.2 测试盲区 (Critical Gaps)
-   **身份验证流 (Auth Flow)**: 注册、注销完整流、找回密码交互。
-   **公共页面 (Public Pages)**: 关于、归档、分类/标签云、协议页面、投稿页面。
-   **创作与管理流 (Content Management)**: 管理后台的登录后操作、文章发表、分类/标签维护、系统设置修改。
-   **阅读深度体验 (Reading Experience)**: 文章详情页加载、目录导航、评论系统交互（目前处于跳过状态）。
-   **系统部署流 (Infrastructure)**: 系统的安装向导 (Installation) 逻辑测试。

## 3. 详细测试用例设计 (Test Cases Design)

### 3.1 身份验证模块 (Authentication)
-   **登录与注销**:
    -   管理员登录 -> 验证用户菜单显示 -> 注销 -> 验证登录按钮恢复。
-   **注册流 (`/register`)**:
    -   表单输入验证 -> 点击注册 -> (Mock) 验证成功跳转。
-   **密码管理**:
    -   忘记密码表单提交 -> 邮箱填写验证。

### 3.2 公共页面覆盖 (Public Pages Reachability)
-   **归档与索引**:
    -   `/archives`: 验证时间轴渲染。
    -   `/categories`, `/tags`: 验证分类/标签云显示。
-   **信息展示**:
    -   `/about`, `/privacy-policy`, `/user-agreement`: 验证内容正常渲染且包含关键法律职责信息。
-   **投稿互动**:
    -   `/submit`: 验证投稿表单存在。

### 3.3 阅读体验 (Reading & Interactions)
-   **文章内容**:
    -   验证 `[id].vue` 中的 Markdown 渲染、KaTeX 公式、代码块高亮。
    -   验证 Table of Contents (TOC) 的粘性定位与点击跳转。
-   **评论互动**:
    -   发表评论 -> 验证评论列表更新。
    -   回复评论交互。

### 3.4 管理后台 (Admin Dashboard)
-   **文章管理**:
    -   文章列表分页与搜索。
    -   编辑器：标题输入、封面上传、AI 摘要生成触发。
-   **分类与标签管理**:
    -   新增/编辑/删除分类与标签。
-   **系统设置**:
    -   修改站点名称、配置信息。

### 3.5 移动端适配 (Responsive)
-   **导航栏**: 移动端下汉堡菜单的展开与收起。
-   **内容**: TOC 在移动端的浮窗/隐藏表现。

## 4. 技术实施方案 (Technical Implementation)

### 4.1 核心公共能力封装
-   **`auth.helper.ts`**: 封装 `loginAsAdmin()`、`logout()` 等通用操作，支持测试中快速切换身份。
-   **Mock 策略**: 
    -   使用 Playwright 的 `route()` 功能拦截 AI 接口请求，模拟生成内容。
    -   拦截验证码发送接口。

### 4.2 文件结构建议
目前的测试文件分布如下：
- `home.e2e.test.ts`: 首页、多语言、主题切换。
- `auth.e2e.test.ts`: 登录、注册、找回密码流程。
- `public-pages.e2e.test.ts`: 遍历测试所有公共静态/半动态页面。
- `posts.e2e.test.ts`: 文章列表、详情渲染、TOC、评论。
- `admin.e2e.test.ts`: 管理后台 CRUD 操作库。
- `responsive.e2e.test.ts`: 移动端视图与交互测试。
- `installation.e2e.test.ts`: 环境安装流程测试。

### 4.3 自动化运行环境
-   **测试数据库**: E2E 测试应始终连接到独立的测试数据库（如 `sqlite::memory:` 或专门的 `test_db`）。
-   **环境变量**: 使用 `.env.test` 或在 `nuxt.config.ts` 中通过 `runtimeConfig` 注入测试标志。

## 5. 执行进度 (Execution Progress)

- [x] **Phase 1**: 实现 Auth 基础流测试（登录/注销）。
- [x] **Phase 2**: 实现公共页面覆盖测试。
- [x] **Phase 3**: 实现文章详情页与阅读体验测试（TOC/评论渲染）。
- [x] **Phase 4**: 覆盖管理后台核心逻辑（Dashboard/设置/AI）。
- [x] **Phase 5**: 补齐安装向导测试。
- [ ] **Phase 6**: (待做) 完善 Mock Data 工厂，支持在每个测试用例前自动注入所需数据。

### 4.1 核心公共能力封装
-   **`auth.helper.ts`**: 封装 `loginAsAdmin()`、`logout()` 等通用操作，避免每个测试文件重复编写登录逻辑。
-   **`mock-api.ts`**: 为 E2E 环境提供稳定的 API Mock 策略，特别是涉及 AI 生成和邮件发送等不可控服务时。

### 4.2 环境隔离
-   **测试数据库**: E2E 测试应始终连接到独立的测试数据库（如 `sqlite::memory:` 或专门的 `test_db`）。
-   **`TEST_MODE` 标记**: 在测试环境下运行 Nuxt 时，自动禁用生产混淆与高强度速率限制。

### 4.3 浏览器与设配覆盖
-   **桌面端**: Chrome, Firefox, Safari (Webkit)。
-   **移动端**: 增加对 iPhone 13/Android 设配的视图模拟，重点验证 Header 菜单和 Table of Contents 在移动端的收展效果。

## 5. 执行计划 (Roadmap)

1.  **Phase 1**: 实现 Auth 基础流测试（登录/注销）。
2.  **Phase 2**: 实现文章详情页与阅读体验测试（TOC/评论）。
3.  **Phase 3**: 覆盖管理后台核心逻辑（文章发布/AI 辅助）。
4.  **Phase 4**: 补齐安装向导与边缘情况（404/权限控制）。
