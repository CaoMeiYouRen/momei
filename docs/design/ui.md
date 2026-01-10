# 墨梅 (Momei) UI 设计文档

## 1. 设计理念 (Design Philosophy)

**"墨梅" (Momei)** 的设计灵感源自中国传统文化中的"墨"与"梅"，结合现代 Web 设计趋势，旨在打造一个**简洁 (Minimalist)**、**优雅 (Elegant)** 且**高效 (Efficient)** 的跨语言博客平台。

-   **简洁 (Simplicity)**: 去除冗余装饰，专注于内容本身。留白 (Whitespace) 是设计的核心元素。
-   **现代 (Modernity)**: 运用微妙的动画和流畅的交互，体现科技感，避免生硬的过渡。
-   **沉浸 (Immersion)**: 提供无干扰的阅读和写作体验。
-   **隐私与无感 (Privacy & Frictionless)**: 仅在评论和订阅等必要交互时要求登录，尽可能优先使用匿名访问，减少对用户的打扰并保护隐私。

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

### 2.4 暗色模式 (Dark Mode)

-   **策略**: 支持 **浅色 (Light)**、**深色 (Dark)** 及 **跟随系统 (System)** 三种模式。
-   **实现**:
    -   使用 CSS Variables 或 SCSS Mixins 管理颜色主题。
    -   通过 HTML 根元素的 `class="dark"` 进行切换 (Tailwind/PrimeVue 兼容)。
-   **体验**:
    -   切换时应有平滑的过渡动画 (Transition)。
    -   避免页面加载时的闪烁 (FOUC)。

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

### 3.3 管理后台组件 (Admin Components)

针对管理后台场景，抽象出的高效通用组件：

-   **AdminPageHeader**: 统一的页面头部，包含标题、副标题、面包屑和主操作按钮。
-   **ConfirmDeleteDialog**: 基于 PrimeVue ConfirmDialog 封装的删除确认弹窗，统一交互体验。
-   **AdminTable**:（规划中）封装了分页、搜索、排序逻辑的 DataTable。

### 3.4 移动端适配 (Mobile Adaptation)

-   **导航**:
    -   移动端使用 **汉堡菜单 (Hamburger Menu)** 或底部导航栏。
    -   侧边栏 (Sidebar) 在移动端应默认隐藏，通过手势或按钮触发。
-   **排版**:
    -   适当增大正文字号 (16px -> 17px/18px) 和行高，提升可读性。
    -   增加点击区域 (Touch Targets)，按钮和链接的高度/宽度至少 44px。
-   **交互**:
    -   支持常见手势 (如左滑返回、下拉刷新)。
    -   避免使用 Hover 状态作为唯一交互提示。

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
-   **区域**:
    -   **顶部栏**: 返回按钮, 标题输入框, 状态指示 (保存中/已保存), 发布/保存按钮, 设置按钮 (齿轮图标)。
    -   **编辑区**: 双栏 (左侧 Markdown 编辑，右侧实时预览) 或 所见即所得 (WYSIWYG)。支持快捷键 (Ctrl+S 保存)。
    -   **侧边栏/设置抽屉**:
        -   **发布设置**: Slug 自定义, 分类选择, 标签输入 (Autocomplete).
        -   **封面图**: 上传/选择图片.
        -   **摘要**: 手动输入或 AI 生成.
        -   **SEO**: Meta Title, Meta Description.

## 6. 模块设计 (Module Designs)

具体页面和组件的设计细节请参考 `docs/design/modules` 下的各模块文档：

-   **[认证模块 (Auth)](./modules/auth.md)**: 登录、注册、密码找回等。
-   **[用户中心 (User)](./modules/user.md)**: 个人设置、资料管理。
-   **[博客前台 (Blog)](./modules/blog.md)**: 文章列表、详情、归档。
-   **[管理后台 (Admin)](./modules/admin.md)**: 内容管理、用户管理。
-   **[系统服务 (System)](./modules/system.md)**: 通用服务、文件上传。

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
