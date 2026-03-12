export const LOCALE_MESSAGE_MODULE_GROUPS = {
    common: ['app', 'common', 'error', 'redirect'],
    components: ['components', 'comments'],
    public: ['pages.submit', 'pages.posts', 'pages.error', 'pages.user_agreement', 'pages.privacy_policy', 'pages.about', 'pages.links', 'pages.categories_index', 'pages.tags_index', 'pages.archives'],
    settings: ['pages.settings'],
    legal: ['legal'],
    auth: ['pages.login', 'pages.register', 'pages.forgot_password', 'pages.reset_password'],
    admin: ['pages.admin'],
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

const OPTIONAL_ROUTE_MODULES = new Set<LocaleMessageModule>(['auth', 'admin', 'home', 'demo', 'installation'])

function normalizeLocaleRoutePath(path: string): string {
    const pathname = path.split('?')[0]?.split('#')[0] || '/'
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    const localePrefixedPath = normalizedPath.replace(/^\/(?:[a-z]{2}(?:-[a-z]{2,4})?)(?=\/|$)/iu, '')

    return localePrefixedPath || '/'
}

export function resolveLocaleMessageModulesForRoute(path: string, options?: { demoMode?: boolean }): LocaleMessageModule[] {
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
    }

    if (/^\/installation(?:\/|$)/u.test(normalizedPath)) {
        modules.add('installation')
        modules.add('admin')
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
