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
]

export const PENDING_ROUTES: ParityRoute[] = [
    {
        name: 'admin-posts-list',
        path: '/admin/posts',
        heading: '文章管理',
        tier: 'admin',
        migrated: false,
    },
    {
        name: 'admin-subscribers-list',
        path: '/admin/subscribers',
        heading: '订阅管理',
        tier: 'admin',
        migrated: false,
    },
    {
        name: 'admin-users-list',
        path: '/admin/users',
        heading: '用户管理',
        tier: 'admin',
        migrated: false,
        stable: 'lenient',
        /* 用户列表数据由 better-auth admin 接口异步返回：锚定该响应 + 首个数据行，
         * 避免固定超时下「空表 ↔ 1 行」导致参考态不可复现。 */
        readyResponse: '/api/auth/admin/list-users',
        readySelector: '.p-datatable-tbody tr',
    },
    {
        name: 'admin-friend-links-list',
        path: '/admin/friend-links',
        heading: '友链管理',
        tier: 'admin',
        migrated: false,
    },
]

export const ALL_PARITY_ROUTES: ParityRoute[] = [...MIGRATED_ROUTES, ...PENDING_ROUTES]
