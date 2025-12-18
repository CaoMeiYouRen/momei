# 墨梅 (Momei) UI 设计文档

## 1. 设计理念 (Design Philosophy)

**"墨梅" (Momei)** 的设计灵感源自中国传统文化中的"墨"与"梅"，结合现代 Web 设计趋势，旨在打造一个**简洁 (Minimalist)**、**优雅 (Elegant)** 且**高效 (Efficient)** 的跨语言博客平台。

-   **简洁 (Simplicity)**: 去除冗余装饰，专注于内容本身。留白 (Whitespace) 是设计的核心元素。
-   **现代 (Modernity)**: 运用微妙的动画和流畅的交互，体现科技感，避免生硬的过渡。
-   **沉浸 (Immersion)**: 提供无干扰的阅读和写作体验。

## 2. 视觉风格 (Visual Style)

### 2.1 主题 (Theme)

基于 **PrimeVue Aura** 主题进行定制。Aura 本身具有现代、圆润且通透的特点，非常符合墨梅的气质。

-   **基础风格**: Flat (扁平化) + Subtle Shadows (微阴影)。
-   **圆角**: 使用中等圆角 (0.5rem - 1rem)，保持亲和力。
-   **质感**: 磨砂玻璃 (Glassmorphism) 效果可用于导航栏或模态框，增加层次感。

### 2.2 配色方案 (Color Palette)

配色灵感取自水墨画与梅花。

-   **主色调 (Primary)**: **墨色 (Ink Slate)**

    -   用于主要按钮、高亮文本、Logo。
    -   色值参考: Slate 800 (`#1e293b`) 到 Slate 900 (`#0f172a`)。
    -   PrimeVue 对应: `primary-500` ~ `primary-900`。

-   **背景色 (Surface)**: **宣纸白 (Rice Paper White)**

    -   用于页面背景，保持极高的阅读舒适度。
    -   Light Mode: Pure White (`#ffffff`) 或 Very Light Gray (`#f8fafc`)。
    -   Dark Mode: Deep Charcoal (`#0f172a` 或 `#18181b`)。

-   **点缀色 (Accent)**: **梅红 (Plum Red)**

    -   用于强调、Like 按钮、错误提示。
    -   色值参考: Rose 500 (`#f43f5e`) 或 Pink 600 (`#db2777`)。
    -   _注: 点缀色应克制使用，避免喧宾夺主。链接悬停等常规交互应使用主色调的深色变体。_

-   **文本色 (Text)**:
    -   主要文本: Slate 900 (`#0f172a`)
    -   次要文本: Slate 500 (`#64748b`)

### 2.3 字体 (Typography)

-   **中文字体**: 优先使用系统默认的无衬线字体，如 `PingFang SC`, `Microsoft YaHei`，确保跨平台清晰度。可考虑引入开源衬线字体 (如 `Noto Serif SC`) 用于文章正文，营造文学感。
-   **英文字体**: `Inter` 或 `Roboto`，保持现代感。
-   **代码字体**: `Fira Code` 或 `JetBrains Mono`。

## 3. 组件库与规范 (Component Library)

使用 **PrimeVue** 作为基础组件库，配合 **SCSS** 进行布局和微调。

### 3.1 核心组件配置

-   **Buttons**:
    -   Primary: 墨色背景，白色文字。
    -   Secondary: 灰色边框或浅灰色背景。
    -   Text: 仅文字，Hover 时显示背景。
-   **Cards**:
    -   极简边框 (`border-1 border-gray-200`) 或微阴影 (`shadow-sm`)。
    -   Hover 时提升阴影 (`shadow-md`) 并轻微上浮。
-   **Inputs**:
    -   Aura 默认样式，Focus 环颜色调整为墨色。

### 3.2 布局 (Layout)

-   **响应式**: Mobile First。
-   **最大宽度**: 内容区域限制在 `max-w-4xl` (约 900px) 以内，优化阅读体验。
-   **栅格**: 使用 Flexbox 或 Grid 布局。

## 4. 动画与交互 (Animations & Interactions)

动画应服务于功能，体现"流畅"而非"炫技"。

-   **页面过渡 (Page Transition)**:

    -   使用 Nuxt 内置的 `<NuxtPage>` transition。
    -   效果: 轻微的 `fade` (淡入淡出) 或 `slide-up` (上滑淡入)。
    -   时长: 0.3s ease-out。

-   **组件交互**:

    -   **Hover**: 按钮、卡片 Hover 时，背景色加深或阴影加重，过渡时间 `0.2s`。
    -   **Loading**: 使用骨架屏 (Skeleton) 代替旋转 Loading，减少等待焦虑。
    -   **列表加载**: 列表项依次淡入 (Staggered Fade-in)。

-   **微交互**:
    -   点赞/收藏时的图标缩放动画。
    -   开关 (Switch) 切换时的平滑过渡。

## 5. 资源 (Assets)

-   **Logo**: `public/logo.png`
    -   应用场景: 导航栏左侧、页脚、登录页。
    -   样式: 保持清晰，适应深色/浅色背景。
-   **Favicon**: `public/favicon.ico`
    -   浏览器标签页图标。

## 6. 页面详细设计 (Page Detail Design)

### 6.1 认证页面 (Authentication Pages)

#### 登录页 (`/login`)

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

#### 注册页 (`/register`)

-   **布局**: 同登录页。
-   **元素**:
    -   Logo 与 标题 ("创建新账号").
    -   **表单**: Name (昵称), Email, Password, Confirm Password.
    -   **提交按钮**: "注册".
    -   **底部链接**: "已有账号? 直接登录".
-   **流程**: 注册成功后自动跳转至首页或验证提示页。

### 6.2 用户中心 (User Center)

#### 个人设置页 (`/settings`)

-   **布局**: 侧边栏导航 (Sidebar Navigation) + 内容区域。
    -   侧边栏: 个人资料 (Profile), 账号安全 (Security).
-   **个人资料 (Profile)**:
    -   **头像上传**: 圆形头像区域，点击可上传/更换图片。
    -   **基本信息表单**: 昵称 (Name), 简介 (Bio).
    -   **操作**: "保存更改" 按钮。
-   **账号安全 (Security)**:
    -   **修改密码**: 旧密码, 新密码, 确认新密码.
    -   **账号绑定**: 显示已绑定的 OAuth 账号 (GitHub)，提供解绑/绑定按钮。

### 6.3 管理后台 (Admin Dashboard)

#### 用户列表页 (`/admin/users`)

-   **权限**: 仅 `admin` 角色可见。
-   **布局**: 全宽表格布局。
-   **工具栏**: 搜索框 (搜索用户名/邮箱), 角色筛选下拉框.
-   **表格列**:
    -   用户信息 (头像 + 昵称 + 邮箱).
    -   角色 (Role) - Badge 显示.
    -   注册时间.
    -   状态 (正常/封禁).
    -   操作 (Actions): "编辑角色", "封禁用户".
-   **交互**:
    -   点击 "编辑角色" 弹出模态框 (Modal)，选择新角色并保存。

## 7. 实施计划 (Implementation Plan)

1.  **安装 PrimeVue**: 配置 Nuxt 模块，引入 Aura 主题。
2.  **定制主题**: 使用 PrimeVue 的 Design Token 或 CSS 变量覆盖默认颜色，匹配"墨梅"色调。
3.  **全局样式**: 在 `styles/main.scss` 中定义基础字体、重置样式和动画类。
4.  **组件开发**: 逐步替换/开发 Header, Footer, ArticleCard 等核心组件。

## 7. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [项目计划](../plan/roadmap.md)
-   [开发规范](../standards/development.md)
-   [API 设计](./api.md)
-   [测试规范](../standards/testing.md)
