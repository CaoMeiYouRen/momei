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
     * 截图前需要激活的标签页（按可访问角色名匹配）。
     *
     * 用途：默认标签页之外的分区也需要纳入对照时（如 `/admin/ai` 的「任务记录」页签承载了
     * 本批的主要迁移面）。角色名在两套组件库上都稳定（两端均渲染 `role="tab"`），故同一段
     * 准备逻辑在「参考态采集」与「当前态比对」两侧行为一致。
     */
    selectTab?: string
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
        name: 'admin-ai-tasks-list',
        path: '/admin/ai',
        heading: 'AI 任务与统计',
        tier: 'admin',
        migrated: true,
        /* 同路由的第二个对照面：截图前激活「任务记录」页签（承载本批主要迁移面）。
         * 任务列表为服务端分页，数据由 `/api/admin/ai/tasks` 返回。 */
        readyResponse: '/api/admin/ai/tasks',
        selectTab: '任务记录',
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
