/**
 * 移动端视觉基线覆盖的公开页路由清单。
 *
 * 选点原则（见 `docs/plan/roadmap.md` 第八十五阶段条目 1）：覆盖 reader 面主要页面类型，并控制单次运行时长。
 * - 12 条路由 × 明暗两套主题 = 24 条基线；
 * - 类型覆盖：首页 / 列表 / 详情 / 归档 / 分类 / 标签 / 友链 / 关于 / 投稿 / 登录 / 注册 / 个人中心；
 * - `/privacy-policy`、`/user-agreement`、`/benefits`、`/feedback`、找回 / 重置密码
 *   为纯文案或表单页，桌面 parity 已覆盖组件面，暂不重复占移动基线预算，后续按需增量补入。
 *
 * 就绪口径与桌面 parity 一致：`lenient` 用于 `networkidle` 永不达成的路由（SSE 长连接、
 * 外部资源），`gotoWaitUntil: domcontentloaded` 用于外部头像等第三方资源阻塞 `load` 的路由。
 */
export interface MobileReaderRoute {
    /** 与快照文件名、失败归因行对应。 */
    name: string
    path: string
    /** zh-CN 主标题，用于等待页面渲染完成。 */
    heading: string
    stable?: 'networkidle' | 'lenient'
    gotoWaitUntil?: 'load' | 'domcontentloaded'
}

export const MOBILE_READER_ROUTES: MobileReaderRoute[] = [
    {
        name: 'mobile-home',
        path: '/',
        heading: '最新文章',
        stable: 'lenient',
        gotoWaitUntil: 'domcontentloaded',
    },
    {
        name: 'mobile-posts-list',
        path: '/posts',
        heading: '文章列表',
        stable: 'lenient',
    },
    {
        name: 'mobile-post-detail',
        path: '/posts/hello-momei-test',
        heading: 'Hello Momei Test',
        stable: 'lenient',
        gotoWaitUntil: 'domcontentloaded',
    },
    {
        name: 'mobile-archives',
        path: '/archives',
        heading: '归档',
        stable: 'lenient',
    },
    {
        name: 'mobile-categories',
        path: '/categories',
        heading: '分类',
        stable: 'lenient',
    },
    {
        name: 'mobile-tags',
        path: '/tags',
        heading: '标签',
        stable: 'lenient',
    },
    {
        name: 'mobile-friend-links',
        path: '/friend-links',
        heading: '友链',
        stable: 'lenient',
    },
    {
        name: 'mobile-about',
        path: '/about',
        heading: '墨梅',
        stable: 'lenient',
    },
    {
        name: 'mobile-submit',
        path: '/submit',
        heading: '访客投稿',
    },
    {
        name: 'mobile-login',
        path: '/login',
        heading: '欢迎回来，请登录',
    },
    {
        name: 'mobile-register',
        path: '/register',
        heading: '创建新账号',
    },
    {
        name: 'mobile-user-settings',
        path: '/settings',
        heading: '个人中心',
        stable: 'lenient',
    },
]

/** 列表空态的独立视觉基线；骨架屏见 backlog #6。 */
export const MOBILE_LIST_STATE_CASES = [
    'mobile-posts-empty-light',
    'mobile-posts-empty-dark',
] as const
