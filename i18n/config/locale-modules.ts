export const LOCALE_MESSAGE_MODULE_GROUPS = {
    common: ['app', 'common', 'error', 'redirect'],
    components: ['components', 'comments'],
    public: ['pages.submit', 'pages.posts', 'pages.error', 'pages.user_agreement', 'pages.privacy_policy', 'pages.about', 'pages.links', 'pages.categories_index', 'pages.tags_index', 'pages.archives'],
    settings: ['pages.settings'],
    legal: ['legal'],
    auth: ['pages.login', 'pages.register', 'pages.forgot_password', 'pages.reset_password'],
    admin: ['pages.admin'],
    'admin-posts': ['pages.admin.posts'],
    'admin-taxonomy': ['pages.admin.categories', 'pages.admin.tags', 'pages.admin.comments', 'pages.admin.subscribers'],
    'admin-submissions': ['pages.admin.submissions'],
    'admin-ai': ['pages.admin.ai'],
    'admin-users': ['pages.admin.users'],
    'admin-ad': ['pages.admin.ad'],
    'admin-external-links': ['pages.admin.external_links'],
    'admin-link-governance': ['pages.admin.link_governance'],
    'admin-friend-links': ['pages.admin.friend_links'],
    'admin-marketing': ['pages.admin.marketing'],
    'admin-notifications': ['pages.admin.notifications'],
    'admin-settings': ['pages.admin.settings'],
    'admin-email-templates': ['pages.admin.settings.system.email_templates'],
    'admin-snippets': ['pages.admin.snippets'],
    home: ['home'],
    demo: ['demo'],
    installation: ['installation'],
    feed: ['feed'],
} as const

export const LOCALE_MESSAGE_MODULE_ORDER = [
    'common',
    'components',
    'public',
    'settings',
    'legal',
    'auth',
    'admin',
    'admin-posts',
    'admin-taxonomy',
    'admin-submissions',
    'admin-ai',
    'admin-users',
    'admin-ad',
    'admin-external-links',
    'admin-link-governance',
    'admin-friend-links',
    'admin-marketing',
    'admin-notifications',
    'admin-settings',
    'admin-email-templates',
    'admin-snippets',
    'home',
    'demo',
    'installation',
    'feed',
] as const satisfies readonly (keyof typeof LOCALE_MESSAGE_MODULE_GROUPS)[]

export const LOCALE_CORE_MODULES = [
    'common',
    'components',
    'public',
    'settings',
    'legal',
    'auth',
] as const satisfies readonly (typeof LOCALE_MESSAGE_MODULE_ORDER)[number][]

export type LocaleMessageModule = (typeof LOCALE_MESSAGE_MODULE_ORDER)[number]

const OPTIONAL_ROUTE_MODULES = new Set<LocaleMessageModule>([
    'auth',
    'admin',
    'admin-posts',
    'admin-taxonomy',
    'admin-submissions',
    'admin-ai',
    'admin-users',
    'admin-ad',
    'admin-external-links',
    'admin-link-governance',
    'admin-friend-links',
    'admin-marketing',
    'admin-notifications',
    'admin-settings',
    'admin-email-templates',
    'admin-snippets',
    'home',
    'demo',
    'installation',
])

const ADMIN_ROUTE_MODULE_RULES: {
    pattern: RegExp
    modules: LocaleMessageModule[]
}[] = [
    {
        pattern: /^\/admin\/posts(?:\/|$)/u,
        modules: ['admin-posts'],
    },
    {
        pattern: /^\/admin\/(?:categories|tags|comments|subscribers)(?:\/|$)/u,
        modules: ['admin-taxonomy'],
    },
    {
        pattern: /^\/admin\/submissions(?:\/|$)/u,
        modules: ['admin-submissions'],
    },
    {
        pattern: /^\/admin\/ai(?:\/|$)/u,
        modules: ['admin-ai'],
    },
    {
        pattern: /^\/admin\/users(?:\/|$)/u,
        modules: ['admin-users'],
    },
    {
        pattern: /^\/admin\/ad(?:\/|$)/u,
        modules: ['admin-ad'],
    },
    {
        pattern: /^\/admin\/external-links(?:\/|$)/u,
        modules: ['admin-external-links'],
    },
    {
        pattern: /^\/admin\/migrations\/link-governance(?:\/|$)/u,
        modules: ['admin-link-governance'],
    },
    {
        pattern: /^\/admin\/friend-links(?:\/|$)/u,
        modules: ['admin-friend-links'],
    },
    {
        pattern: /^\/admin\/marketing(?:\/|$)/u,
        modules: ['admin-marketing'],
    },
    {
        pattern: /^\/admin\/notifications(?:\/|$)/u,
        modules: ['admin-notifications'],
    },
    {
        pattern: /^\/admin\/settings(?:\/|$)/u,
        modules: ['admin-settings', 'admin-email-templates'],
    },
    {
        pattern: /^\/admin\/snippets(?:\/|$)/u,
        modules: ['admin-snippets'],
    },
]

function normalizeLocaleRoutePath(path: string): string {
    const pathname = path.split('?')[0]?.split('#')[0] || '/'
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    // 先剥离 locale 前缀再匹配业务路由，确保 /en-US/admin 与 /admin 命中同一模块规则。
    const localePrefixedPath = normalizedPath.replace(/^\/(?:[a-z]{2}(?:-[a-z]{2,4})?)(?=\/|$)/iu, '')

    return localePrefixedPath || '/'
}

export function resolveLocaleMessageModulesForRoute(path: string, options?: { demoMode?: boolean }): LocaleMessageModule[] {
    // 以 core 模块为下限，再根据路由附加可选模块，避免页面渲染依赖的公共文案被误裁剪。
    const modules = new Set<LocaleMessageModule>(LOCALE_CORE_MODULES)
    const normalizedPath = normalizeLocaleRoutePath(path)

    if (normalizedPath === '/') {
        modules.add('home')
    }

    if (/^\/(login|register|forgot-password|reset-password)(?:\/|$)/u.test(normalizedPath)) {
        modules.add('auth')
    }

    if (/^\/admin(?:\/|$)/u.test(normalizedPath)) {
        modules.add('admin')

        for (const rule of ADMIN_ROUTE_MODULE_RULES) {
            if (!rule.pattern.test(normalizedPath)) {
                continue
            }

            for (const moduleName of rule.modules) {
                modules.add(moduleName)
            }
        }
    }

    if (/^\/installation(?:\/|$)/u.test(normalizedPath)) {
        modules.add('installation')
        modules.add('admin')
        modules.add('admin-settings')
    }

    if (options?.demoMode) {
        modules.add('demo')
    }

    return LOCALE_MESSAGE_MODULE_ORDER.filter((moduleName) => modules.has(moduleName))
}

export function getLocaleMessageFilePaths(localeCode: string, modules: readonly LocaleMessageModule[] = LOCALE_MESSAGE_MODULE_ORDER): string[] {
    return modules.map((moduleName) => `${localeCode}/${moduleName}.json`)
}

export function getNuxtLocaleMessageFilePaths(localeCode: string): string[] {
    return getLocaleMessageFilePaths(localeCode, LOCALE_CORE_MODULES)
}

export function isOptionalLocaleMessageModule(moduleName: LocaleMessageModule): boolean {
    return OPTIONAL_ROUTE_MODULES.has(moduleName)
}
