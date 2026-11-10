# 墨梅博客 UI 设计文档

> **组件库迁移已收口（2026-11-09）**：`caomei-ui@1.0.0` 为唯一组件库，**PrimeVue 及其依赖已于第七十二阶段条目 4 卸载**（`primevue` / `@primevue/*` / `@primeuix/*` / `primeicons` / `primelocale` 移除，`--p-*` token、`p-*` class 与 `.p-*` 选择器清零，零残留守卫见 `tests/modules/primevue-residual-guard.test.ts`），迁移过程见 [PrimeVue → caomei-ui 迁移方案](./governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)。**全文已按 caomei-ui 重写（2026-11-10，第七十三阶段条目 1）**，组件口径见 §3。实际实现以 `caomei-ui` 组件 + `--caomei-*`（语义角色）/ `--m-*`（项目调色板）为准。

## 1. 设计理念 (Design Philosophy)

**"墨梅" (Momei)** 的设计灵感源自中国传统文化中的"墨"与"梅"，结合现代 Web 设计趋势，旨在打造一个**简洁 (Minimalist)**、**优雅 (Elegant)** 且**高效 (Efficient)** 的跨语言博客平台。

-   **简洁 (Simplicity)**: 去除冗余装饰，专注于内容本身。留白 (Whitespace) 是设计的核心元素。
-   **现代 (Modernity)**: 运用微妙的动画和流畅的交互，体现科技感，避免生硬的过渡。
-   **沉浸 (Immersion)**: 提供无干扰的阅读和写作体验。
-   **隐私与无感 (Privacy & Frictionless)**: 仅在评论和订阅等必要交互时要求登录，尽可能优先使用匿名访问，减少对用户的打扰并保护隐私。

## 2. 视觉风格 (Visual Style)

### 2.1 主题 (Theme)

主题 token 体系原基于 **PrimeVue Aura** 定制（现代、圆润、通透），迁移后由 **caomei-ui** 的语义 token（`--caomei-*`）与项目调色板层（`--m-*`）承接，视觉基调与迁移前保持一致。

-   **基础风格**: Flat (扁平化) + Subtle Shadows (微阴影)。
-   **圆角**: 使用中等圆角 (0.5rem - 1rem)，保持亲和力。
-   **质感**: 磨砂玻璃 (Glassmorphism) 效果可用于导航栏或模态框，增加层次感。

### 2.2 配色方案 (Color Palette)

配色灵感取自水墨画与梅花。墨梅支持高度自定义的配色方案，管理员可以为浅色和深色模式分别配置以下核心颜色：

-   **主色调 (Primary)**:
    -   用于主要按钮、高亮文本、Logo。
    -   默认色值: Slate 800 (`#1e293b`) 到 Slate 900 (`#0f172a`)。
-   **点缀色 (Accent)**:
    -   用于强调、具有活力的交互元素。
    -   默认色值: Rose 500 (`#f43f5e`)。
-   **表面色 (Surface)**:
    -   用于卡片、组件背景。
    -   浅色默认: `#ffffff`；深色默认: `#121212`。
-   **文本色 (Text)**:
    -   主要文本颜色。
    -   浅色默认: Slate 900；深色默认: Slate 100。

系统支持多种预设（如琥珀、极客紫、清新绿）以及完全自定义模式，允许管理员对 8 个核心颜色点位（浅色/深色各 4 个）进行精细化调整。

### 2.3 字体 (Typography)

-   **中文字体**: 优先使用系统默认的无衬线字体，如 `PingFang SC`, `Microsoft YaHei`，确保跨平台清晰度。可考虑引入开源衬线字体 (如 `Noto Serif SC`) 用于文章正文，营造文学感。
-   **英文字体**: `Inter` 或 `Roboto`，保持现代感。
-   **代码字体**: `Fira Code` 或 `JetBrains Mono`。

### 2.4 暗色模式 (Dark Mode) 与 主题覆盖 (Theme Overrides)

-   **策略**: 支持 **浅色 (Light)**、**深色 (Dark)** 及 **跟随系统 (System)** 三种模式。
-   **实现**:
    -   使用 CSS Variables 通过 HTML 根元素的 `class="dark"` 进行切换。
    -   **CSS Layers (@layer)**: 项目定义了以下层级（PrimeVue 的 `primevue` 层已随卸载移除）：
        1. `momei-base`: 墨梅的基础全局样式（含 `--m-*` 调色板与全局盒模型 / `color-scheme` 基线）。
        2. `momei-overrides`: 用于覆盖组件样式的最高优先级层，动态生成的主题变量即注入此层。
    -   **动态生成**: 通过 `useTheme` Composable 监听配置变化，动态向 `<style id="momei-custom-theme">` 注入各模式下的 CSS 变量。
-   **体验**:
    -   切换时应有平滑的过渡动画 (Transition)。
    -   避免页面加载时的闪烁 (FOUC)。

## 3. 组件库与规范 (Component Library)

使用 **caomei-ui** 作为基础组件库（`@1.0.0` 精确锁定），配合 **SCSS** 进行布局和微调；PrimeVue 已于 2026-11-09 卸载。

### 3.1 核心组件配置

组件一律来自 `caomei-ui`；样式定制只走两条通道：**语义 token（`--caomei-*` / `--m-*`）** 或 **未分层覆盖**。caomei-ui 的组件样式未分层，写在 `@layer momei-base` 里的同名声明会被压制——需要改几何或品牌色时，改用上游文档化钩子（如 `--caomei-dialog-width`、`--caomei-badge-*`）或把规则移出 `@layer`。

-   **Buttons (`CaomeiButton`)**:
    -   `variant="primary"`：墨色实底 + 白字，用于每屏唯一主操作。
    -   `variant="secondary"`：白底 + `--caomei-color-control-border` 边框，用于次级操作。
    -   `variant="ghost"`：无底色，Hover 时叠 8% 文字色；纯图标按钮用 `icon-only` 且必须给 `:label`。
    -   尺寸 / 语气通过 `--caomei-button-height` / `--caomei-button-padding-x` / `tone` 覆盖，不写死宽度。
-   **Cards**: 页面容器统一 `.admin-content-card`（`--caomei-color-bg` + `$border-radius-md` + 微阴影）；卡内不再嵌套带边框的盒子。
-   **Inputs (`CaomeiInput` / `CaomeiSelect` / `CaomeiSwitch`)**:
    -   Focus 环取 `--caomei-color-primary`；字段默认 `width: 100%`，行内固定宽度由包装元素承担（`class` 只落在触发器上）。
    -   选择器的「全部」选项以哨兵值承载，`null` 不作为选项值。
-   **Data (`CaomeiDataTable` / `CaomeiPaginator`)**:
    -   服务端分页用 `lazy` + 受控 `:page`（1 基）；筛选变更后回到第 1 页。
    -   **空表不渲染分页**：`paginator` 绑定 `total > 0`；当前页 0 行但 `total > 0` 时仍渲染分页，保证末页删空后可回退。
    -   空态统一走 §3.3 的 `AppEmptyState`。
-   **Overlays (`CaomeiDialog` / `CaomeiDrawer` / `CaomeiPopover` / `CaomeiMenu`)**:
    -   宽度走 `--caomei-dialog-width` 钩子（默认 576px / compact 544px / wide 608px）。
    -   表单弹窗的 `.field` 排版由项目样式承担，颜色取 `--caomei-color-text`。
-   **Badges / Tags (`CaomeiBadge` / `CaomeiTag`)**: 语义由 `tone` 表达；尺寸差异（如翻译徽标高 24px / 最小宽 32px）通过 `--caomei-badge-height` / `--caomei-badge-min-width` 等钩子对齐，不直接改 `height`。

### 3.2 布局 (Layout)

-   **响应式**: Mobile First。
-   **最大宽度**: 列表页 `max-w-4xl`（约 900px）以内，管理端按内容密度放宽到容器满宽。
-   **栅格**: 使用 Flexbox 或 Grid 布局；分组靠间距，边框只用于输入框、表格分隔与确有语义的边界。

### 3.3 管理后台组件 (Admin Components)

针对管理后台场景，抽象出的通用组件：

-   **AdminPageHeader**: 统一的页面头部，包含标题与主操作按钮，可选语言切换器。
-   **AdminListShell**: 列表页外壳，统一标题、筛选区与内容区排布。
-   **ConfirmDeleteDialog**: 基于 caomei-ui `CaomeiDialog` 封装的删除确认弹窗，统一交互体验。
-   **AppEmptyState**: 共享空态（图标 + 说明 + 主操作），由各页面传入对象化文案；确实无需操作时省略 `action` 插槽并写明理由。管理端表格空态统一使用它，`AdminTableEmptyState` 仅保留给尚未迁移的广告位 / 广告活动列表。
-   **AdminTable**:（规划中）封装了分页、搜索、排序逻辑的 DataTable。
-   **UnifiedTranslationEditor**:（规划中）支持在单个对话框内通过标签页 (Tabs) 切换编辑多语言内容的统一编辑器，降低管理员管理翻译簇的认知负载。

### 3.4 状态三态 (Empty / Loading / Error)

列表与卡片流必须同时具备空态、加载态与错误态，判据见 [界面自检清单 U1](./ui-review-checklist.md)：

-   **空态**：图标 + 说明 + 主操作；文案描述当前对象，不复用其他模块的 key；空表不渲染分页。
-   **加载态**：超过 300ms 用骨架屏（`CaomeiSkeleton`），不用裸 spinner + 文本。
-   **错误态**：`CaomeiMessage tone="danger"` 给出原因，并提供「重试」入口（调用 `refresh`）。
-   **当前覆盖范围**：`/admin/{posts,comments,subscribers,waitlist,categories,tags}` 与公开 `/posts`、`/categories|tags/[slug]`。其余管理端列表（外链、用户、稿件、广告位、广告活动、链接治理）的分页与空态随后续迁移批次补齐，不按本节的通用规则判定。

### 3.5 移动端适配 (Mobile Adaptation)

-   **导航**:
    -   移动端使用 **汉堡菜单 (Hamburger Menu)** 或底部导航栏。
    -   侧边栏 (Sidebar) 在移动端应默认隐藏，通过手势或按钮触发。
-   **排版**:
    -   适当增大正文字号 (16px -> 17px/18px) 和行高，提升可读性。
    -   增加点击区域 (Touch Targets)，按钮和链接的高度/宽度至少 44px。-   **文章详情页优化**:
    -   **标题响应式**: 使用 Media Queries 动态减小移动端 $h1 - h6$ 的字号，避免超长标题导致的视觉重心割裂。
    -   **元数据重构**: 在移动端将作者、日期、阅读量等信息由单行水平排列调整为图标化或多行排版，解决窄屏折行不美观的问题。
    -   **阅读呼吸感**: 窄屏下内容区域的左右侧边距 (Padding) 统一调整为 `1rem - 1.25rem`，确保文字不紧贴边缘的同时最大化阅读空间。
    -   **溢出治理**: 强制为代码块 (`pre`)、复杂表格 (`table`) 开启横向滚动，并确保图片具备良好的缩放或全屏预览体验。-   **交互**:
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

-   **[认证模块 (Auth)](modules/auth.md)**: 登录、注册、密码找回等。
-   **[用户中心 (User)](modules/user.md)**: 个人设置、资料管理。
-   **[博客前台 (Blog)](modules/blog.md)**: 文章列表、详情、归档。
-   **[管理后台 (Admin)](modules/admin.md)**: 内容管理、用户管理。
-   **[系统服务 (System)](modules/system.md)**: 通用服务、文件上传。

## 7. 实施计划 (Implementation Plan)

1.  **接入 caomei-ui**: 通过 `caomei-ui/nuxt` 模块接入（`caomeiUI` 配置项，`darkMode: 'class'`）。
2.  **定制主题**: 以 `--caomei-*` 语义 token 与 `--m-*` 调色板覆盖默认颜色，匹配"墨梅"色调。
3.  **全局样式**: 在 `styles/main.scss` 中定义基础字体、重置样式和动画类。
4.  **组件开发**: 逐步替换/开发 Header, Footer, ArticleCard 等核心组件。

## 8. 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [项目计划](../plan/roadmap.md)
-   [开发规范](../standards/development.md)
-   [API 设计](./api.md)
-   [测试规范](../standards/testing.md)
