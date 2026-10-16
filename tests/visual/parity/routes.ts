import type { ParityTier } from './helpers'

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
     * `/admin/marketing` 的「创建活动」弹窗（表单承载本批迁移面）。角色名在两套组件库上都
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
        /* 同路由的第二个对照面：表单在 PrimeVue `Dialog` 内（浮层豁免），先激活「创建推送」
         * （`create_btn`）打开弹窗再截图——表单承载本批的在册族迁移面。
         * 不声明 `readyResponse`：弹窗内表单的 `/api/categories` 与 `/api/tags` 请求只在**点击之后**发出，
         * 而就绪等待发生在激活之前（注册即等满超时后被吞），语义与成本都不成立；
         * 就绪由 `activate.expect`（`[role="dialog"]`）与激活后的稳定等待承担。 */
        activate: { role: 'button', name: '创建推送', expect: '[role="dialog"]' },
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
 * 待迁移路由层：当前离线（无待迁移路由）。
 *
 * 语义：登记在此的路由**当前仍是 PrimeVue 实现**，参考态即当前渲染（HEAD 采集）；
 * 其迁移到 caomei-ui 后把条目移入 `MIGRATED_ROUTES`、保持参考态不变，由门禁强制
 * 「与迁移前原貌」的偏差逐项归因。文件与其中的就绪口径（`stable` / `readyResponse` /
 * `readySelector`）保留为后续批次（B3 设置族 / 组件型目标剩余路由）的模板。
 */
export const PENDING_ROUTES: ParityRoute[] = []
