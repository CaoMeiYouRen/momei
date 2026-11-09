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
     * 导航等待口径，缺省 `load`。
     *
     * 外部头像等第三方资源会阻塞 `load`，无外网时可能长时间不达成；这类路由显式改为
     * `domcontentloaded`，再由 `waitForVisualStableLenient` 做有界稳定等待（与 E2E 的 SEO
     * 用例口径一致）。登录态通知 SSE 不阻塞 `load`，只使 `networkidle` 不达成，由 `stable:
     * 'lenient'` 的有界等待吸收。
     */
    gotoWaitUntil?: 'load' | 'domcontentloaded'
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
         * 迁移后数据行选择器改为 caomei `DataTable` 的行类。 */
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
        /* 安装向导整路由迁移（Stepper / Accordion 族首次生产迁移）；参考态保持迁移前 HEAD 采集。
         * 默认实例在已安装态对该路由直接 302，故仍由 `MOMEI_INSTALLED=false` 的第二 webServer +
         * 独立 project 承载，状态响应在 spec 内固定 mock。 */
        name: 'installation-wizard',
        path: '/installation',
        heading: '墨梅博客安装向导',
        tier: 'admin',
        migrated: true,
        server: 'installation',
    },
    {
        /* 用户设置（首次 reader 档）；SSE 长连接使 networkidle 不达成，沿用 lenient 稳定窗口。 */
        name: 'user-settings',
        path: '/settings',
        heading: '个人中心',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'auth-login',
        path: '/login',
        heading: '欢迎回来，请登录',
        tier: 'reader',
        migrated: true,
    },
    {
        name: 'auth-register',
        path: '/register',
        heading: '创建新账号',
        tier: 'reader',
        migrated: true,
    },
    {
        name: 'auth-forgot-password',
        path: '/forgot-password',
        heading: '找回密码',
        tier: 'reader',
        migrated: true,
    },
    {
        name: 'auth-reset-password',
        path: '/reset-password',
        heading: '重置密码',
        tier: 'reader',
        migrated: true,
    },
    {
        name: 'submit-page',
        path: '/submit',
        heading: '访客投稿',
        tier: 'reader',
        migrated: true,
    },
    {
        /* 通知管理整路由迁移；参考态保持迁移前 HEAD 采集。 */
        name: 'admin-notifications-list',
        path: '/admin/notifications',
        heading: '通知管理',
        tier: 'admin',
        migrated: true,
    },
    {
        /* 主题工作台随设置路由迁移；参考态保持迁移前 HEAD 采集。 */
        name: 'admin-settings-theme',
        path: '/admin/settings/theme',
        heading: '主题定制',
        tier: 'admin',
        migrated: true,
    },
    {
        /* 设置页已整路由迁到 caomei-ui；参考态保持迁移前 HEAD 采集。 */
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
    {
        name: 'admin-snippets-list',
        path: '/admin/snippets',
        heading: '灵感收纳箱',
        tier: 'admin',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'admin-snippets-capture',
        path: '/admin/snippets/capture',
        heading: '极简采集模式',
        tier: 'admin',
        migrated: true,
        stable: 'lenient',
    },
    /* 公开列表页与法务协议页（第七十一阶段条目 3）：参考态保持迁移前 HEAD 采集。 */
    {
        name: 'archives',
        path: '/archives',
        heading: '归档',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'categories-index',
        path: '/categories',
        heading: '分类',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'tags-index',
        path: '/tags',
        heading: '标签',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'privacy-policy',
        path: '/privacy-policy',
        heading: '隐私政策',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'user-agreement',
        path: '/user-agreement',
        heading: '用户协议',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    /* 纯布局 / 文案页：页面本体无组件迁移面，随全局布局壳完成迁移。 */
    {
        name: 'about',
        path: '/about',
        heading: '墨梅',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'benefits',
        path: '/benefits',
        heading: '让你的技术内容自动触达全球读者',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'feedback',
        path: '/feedback',
        heading: '问题反馈与支持',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    /* 公开首页 / 文章列表与详情 / 友链（第七十一阶段条目 3）：参考态保持迁移前 HEAD 采集。 */
    {
        name: 'home',
        path: '/',
        heading: '最新文章',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
        gotoWaitUntil: 'domcontentloaded',
    },
    {
        name: 'posts-list',
        path: '/posts',
        heading: '文章列表',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
    {
        name: 'post-detail',
        path: '/posts/hello-momei-test',
        heading: 'Hello Momei Test',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
        gotoWaitUntil: 'domcontentloaded',
    },
    {
        name: 'friend-links',
        path: '/friend-links',
        heading: '友链',
        tier: 'reader',
        migrated: true,
        stable: 'lenient',
    },
]

/**
 * 待迁移路由层：B4 未迁移面重新登记，参考态在**任何页面改动前**以 HEAD（PrimeVue 原貌）就地采集。
 *
 * 语义：登记在此的路由**当前仍是 PrimeVue 实现**，参考态即当前渲染（HEAD 采集）；
 * 其迁移到 caomei-ui 后把条目移入 `MIGRATED_ROUTES`、保持参考态不变，由门禁强制
 * 「与迁移前原貌」的偏差逐项归因。
 *
 * 档位（`tier`）由本清单**显式声明**并透传到预算解析：不再依赖「testName 含 reader」的
 * 名字启发式，避免 `auth-login` / `submit-page` 这类命名静默落到 admin 档。
 *
 * `server: 'installation'` 的条目由独立 project 运行（见 `ParityRoute.server`）。
 *
 * **未纳入本节点的路由与理由**（详见
 * `docs/design/governance/2026-11-06-b4-migration-inventory.md` §3）：
 * `/admin` 与 `/admin/calendar` 含运行时日期窗口 / 「今天」高亮，参考态不可跨日复现；
 * `/admin/posts/[id]`、`/admin/ai/tasks/[id]` 无稳定可用 id 且页面无 heading；
 * `/categories/[slug]`、`/tags/[slug]`、`/goto/[code]` 在 TEST_MODE 种子下无对应数据。
 * 以上路由的迁移由 E2E + 组件单测覆盖，待条目开工时按需补采。
 */
export const PENDING_ROUTES: ParityRoute[] = [
    /* 第七十一阶段条目 3 收口后已无待迁移路由；机制保留，供后续新增页面在迁移前登记。 */
]
