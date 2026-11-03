import type { ParityTier } from './budget'

/**
 * 视觉一致性门禁覆盖的路由清单。
 *
 * - `migrated`：已迁移到 caomei-ui 的路由，参考态取自各自「迁移前提交」；
 * - 未迁移（`migrated: false`）：参考态取自当前 PrimeVue 实现（HEAD），
 *   迁移落地后该路由的 parity 用例即开始反映漂移。
 *
 * `name` 与 `tests/visual/parity-budget.json` 的 key、参考快照
 * `tests/visual/parity/reference/<name>-<theme>.reference.png` 一一对应。
 */
export interface ParityRoute {
    name: string
    path: string
    /** zh-CN 主标题，用于等待页面渲染完成。 */
    heading: string
    tier: ParityTier
    migrated: boolean
    /** 稳定等待口径：`networkidle`（默认）或 `lenient`（该路由网络永不空闲）。 */
    stable?: 'networkidle' | 'lenient'
    /**
     * 截图前需要激活的目标元素（页签 / 按钮），按可访问角色名匹配。
     *
     * 用途：默认视图之外的分区也需要纳入对照时——如 `/admin/ai` 的「任务记录」页签、
     * `/admin/marketing` 的「创建推送」弹窗（表单承载本批迁移面）。角色名在两套组件库上都
     * 稳定（页签两端均渲染 `role="tab"`；弹窗触发器两端均为 `button`），故同一段准备逻辑在
     * 「参考态采集」与「当前态比对」两侧行为一致。
     *
     * `expect` 为激活后必须出现的就绪锚点：把「点击未生效」（SSR 首屏可见但未水合时会静默
     * 失效）变成**响亮失败**，而不是静默截到默认视图后与参考态比出误导性差异。
     */
    activate?: {
        role: 'tab' | 'button'
        name: string
        expect?: string
    }
    /**
     * 渲染就绪锚点：等待匹配该 URL 子串的响应完成后才截图，替代固定超时。
     * 用于列表数据异步加载的路由，避免「数据未就绪即截图」造成参考态/当前态抖动。
     */
    readyResponse?: string
    /**
     * 渲染就绪锚点：等待首个匹配元素可见后再截图（元素缺失时按有界超时放弃）。
     * 与 `readyResponse` 组合使用，确保响应回来后 DOM 已渲染。
     */
    readySelector?: string
    /**
     * 该路由只能在**独立 server 实例**下渲染。
     *
     * - 缺省：主实例（`MOMEI_INSTALLED=true`，端口 3001）；
     * - `installation`：`MOMEI_INSTALLED=false` 的第二实例（端口 3002）。已安装态的主实例会对
     *   `/installation` 直接 302，前端 mock 无法补救，故必须由 server 环境区分。
     *
     * 由 `playwright.visual-parity.config.ts` 的 project `testMatch` 分流：默认 project 忽略
     * `*.installation.visual-parity.test.ts`，安装向导 project 只运行该文件。
     */
    server?: 'installation'
}

export const MIGRATED_ROUTES: ParityRoute[] = [
    {
        name: 'admin-comments-list',
        path: '/admin/comments',
        heading: '评论管理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-submissions-list',
        path: '/admin/submissions',
        heading: '稿件审核',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-external-links-list',
        path: '/admin/external-links',
        heading: '外链管理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-waitlist-list',
        path: '/admin/waitlist',
        heading: '候补名单',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-ad-campaigns-list',
        path: '/admin/ad/campaigns',
        heading: '广告活动',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-ad-placements-list',
        path: '/admin/ad/placements',
        heading: '广告位管理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-link-governance',
        path: '/admin/migrations/link-governance',
        heading: '迁移链接治理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-subscribers-list',
        path: '/admin/subscribers',
        heading: '订阅管理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-friend-links-list',
        path: '/admin/friend-links',
        heading: '友链管理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-users-list',
        path: '/admin/users',
        heading: '用户管理',
        tier: 'admin',
        migrated: true,
        stable: 'lenient',
        /* 用户列表数据由 better-auth admin 接口异步返回：锚定该响应 + 首个数据行，
         * 避免固定超时下「空表 ↔ 1 行」导致参考态不可复现。
         * 迁移后数据行选择器改为 caomei `DataTable` 的行类（迁移前为 `.p-datatable-tbody tr`）。 */
        readyResponse: '/api/auth/admin/list-users',
        readySelector: '.caomei-data-table__row',
    },
    {
        name: 'admin-posts-list',
        path: '/admin/posts',
        heading: '文章管理',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-categories-list',
        path: '/admin/categories',
        heading: '分类管理',
        tier: 'admin',
        migrated: true,
        /* 服务端分页列表：数据由 `/api/categories` 异步返回。parity 环境种子数据不含分类 / 标签，
         * 故参考态为**空表 + 空态**；弹窗内组件不在本层覆盖范围（参考态不打开弹窗），
         * 由基线层用例 `admin-taxonomy-dialog.visual.test.ts` 覆盖。 */
        readyResponse: '/api/categories',
    },
    {
        name: 'admin-tags-list',
        path: '/admin/tags',
        heading: '标签管理',
        tier: 'admin',
        migrated: true,
        readyResponse: '/api/tags',
    },
    {
        name: 'admin-ai-stats',
        path: '/admin/ai',
        heading: 'AI 任务与统计',
        tier: 'admin',
        migrated: true,
        /* 默认页签「使用统计」：AI 统计由 `/api/admin/ai/stats` 异步返回。 */
        readyResponse: '/api/admin/ai/stats',
    },
    {
        name: 'admin-marketing-overview',
        path: '/admin/marketing',
        heading: '营销中心',
        tier: 'admin',
        migrated: true,
        /* 默认视图：统计卡片（PrimeVue `Card`，未迁移族）+ 推送历史列表（本批迁移面）。
         * 由 `/api/admin/marketing/campaigns` 决定列表就绪。 */
        readyResponse: '/api/admin/marketing/campaigns',
    },
    {
        name: 'admin-marketing-form-dialog',
        path: '/admin/marketing',
        heading: '营销中心',
        tier: 'admin',
        migrated: true,
        /* 同路由的第二个对照面：表单在 `CaomeiDialog` 内，先激活「创建推送」（`create_btn`）
         * 打开弹窗再截图——表单承载本批的在册族迁移面。
         * 不声明 `readyResponse`：弹窗内表单的 `/api/categories` 与 `/api/tags` 请求只在**点击之后**发出，
         * 而就绪等待发生在激活之前（注册即等满超时后被吞），语义与成本都不成立；
         * 就绪由 `activate.expect`（`[role="dialog"]`）与激活后的稳定等待承担。 */
        activate: { role: 'button', name: '创建推送', expect: '[role="dialog"]' },
    },
    {
        /* 第七十阶段条目 2a：设置页已整路由迁到 caomei-ui；参考态保持迁移前 HEAD 采集。 */
        name: 'admin-settings-form',
        path: '/admin/settings',
        heading: '系统设置',
        tier: 'admin',
        migrated: true,
    },
    {
        name: 'admin-ai-tasks-list',
        path: '/admin/ai',
        heading: 'AI 任务与统计',
        tier: 'admin',
        migrated: true,
        /* 同路由的第二个对照面：截图前激活「任务记录」页签（承载本批主要迁移面）。
         * 任务列表为服务端分页，数据由 `/api/admin/ai/tasks` 返回。 */
        readyResponse: '/api/admin/ai/tasks',
        activate: { role: 'tab', name: '任务记录' },
    },
]

/**
 * 待迁移路由层：第七十阶段（B3 表单与设置）登记的 10 条路由，当前仍是 PrimeVue 实现。
 *
 * 语义：登记在此的路由**当前仍是 PrimeVue 实现**，参考态即当前渲染（HEAD 采集，条目 1c）；
 * 其迁移到 caomei-ui 后把条目移入 `MIGRATED_ROUTES`、保持参考态不变，由门禁强制
 * 「与迁移前原貌」的偏差逐项归因。
 *
 * 档位（`tier`）由本清单**显式声明**并透传到预算解析：不再依赖「testName 含 reader」的
 * 名字启发式，避免 `auth-login` / `submit-page` 这类命名静默落到 admin 档。
 *
 * `server: 'installation'` 的条目由独立 project 运行（见 `ParityRoute.server`）。
 */
export const PENDING_ROUTES: ParityRoute[] = [
    /* B3-A 管理端设置与通知（tier=admin）：2a 设置主体 / 2b 主题工作台 / 2c 通知管理。
     * 三者的参考态在第七十阶段条目 1c 以 HEAD（PrimeVue）采集；迁移后逐项归因。 */
    {
        name: 'admin-settings-theme',
        path: '/admin/settings/theme',
        heading: '主题定制',
        tier: 'admin',
        migrated: false,
    },
    {
        name: 'admin-notifications-list',
        path: '/admin/notifications',
        heading: '通知管理',
        tier: 'admin',
        migrated: false,
    },
    /* B3-C 安装向导：默认实例在已安装态对该路由直接 302（server/middleware/0-installation.ts），
     * 故必须由 `MOMEI_INSTALLED=false` 的第二 webServer + 独立 project 承载；
     * 状态响应在 spec 内固定 mock，避免 DB 安装态与机器信息（node / OS / DB 版本）进入截图。 */
    {
        name: 'installation-wizard',
        path: '/installation',
        heading: '墨梅博客安装向导',
        tier: 'admin',
        migrated: false,
        server: 'installation',
    },
    /* B3-D 用户设置与 5 个认证 / 提交页（tier=reader）：首次启用 reader 档。
     * 这些路由名不含 `reader` 字样，档位由 `tier` 显式传入（不再依赖名字启发式）。 */
    {
        name: 'user-settings',
        path: '/settings',
        heading: '个人中心',
        tier: 'reader',
        migrated: false,
        /* 登录态的 AppHeader 会打开 `/api/notifications/stream`（SSE 长连接），
         * `networkidle` 可能永不达成（与 `/admin/users` 同源），改用有界稳定窗口。 */
        stable: 'lenient',
    },
    {
        name: 'auth-login',
        path: '/login',
        heading: '欢迎回来，请登录',
        tier: 'reader',
        migrated: false,
    },
    {
        name: 'auth-register',
        path: '/register',
        heading: '创建新账号',
        tier: 'reader',
        migrated: false,
    },
    {
        name: 'auth-forgot-password',
        path: '/forgot-password',
        heading: '找回密码',
        tier: 'reader',
        migrated: false,
    },
    {
        name: 'auth-reset-password',
        path: '/reset-password',
        heading: '重置密码',
        tier: 'reader',
        migrated: false,
    },
    {
        name: 'submit-page',
        path: '/submit',
        heading: '访客投稿',
        tier: 'reader',
        migrated: false,
    },
]
