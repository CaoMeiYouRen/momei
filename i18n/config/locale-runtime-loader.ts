import { getLocaleRegistryItem, resolveAppLocaleCode, type AppLocaleCode } from './locale-registry'
import { LOCALE_CORE_MODULES, resolveLocaleMessageModulesForRoute, type LocaleMessageModule } from './locale-modules'

type LocaleMessages = Record<string, unknown>

interface ComposerLike {
    mergeLocaleMessage: (locale: string, message: LocaleMessages) => void
}

interface I18nLike {
    global?: ComposerLike
    mergeLocaleMessage?: ComposerLike['mergeLocaleMessage']
}

const localeModuleImporters = import.meta.glob('../locales/**/*.json', {
    import: 'default',
}) as Record<string, () => Promise<LocaleMessages>>

// 以 i18n 实例作为 key 做弱引用缓存：实例销毁后自动释放，
// 防止路由切换和热更新期间的模块加载状态泄漏到其他实例。
const loadedModulesRegistry = new WeakMap<object, Map<AppLocaleCode, Set<LocaleMessageModule>>>()

function resolveComposer(i18n: I18nLike | null | undefined): ComposerLike | null {
    if (!i18n) {
        return null
    }

    if (typeof i18n.mergeLocaleMessage === 'function') {
        return i18n as ComposerLike
    }

    if (i18n.global && typeof i18n.global.mergeLocaleMessage === 'function') {
        return i18n.global
    }

    return null
}

function getLoadedModules(i18n: object, locale: AppLocaleCode): Set<LocaleMessageModule> {
    let localeMap = loadedModulesRegistry.get(i18n)

    if (!localeMap) {
        localeMap = new Map<AppLocaleCode, Set<LocaleMessageModule>>()
        loadedModulesRegistry.set(i18n, localeMap)
    }

    const existing = localeMap.get(locale)
    if (existing) {
        return existing
    }

    // core 模块在 Nuxt i18n 初始化阶段已预装，运行时只追踪增量模块。
    const loadedModules = new Set<LocaleMessageModule>(LOCALE_CORE_MODULES)
    localeMap.set(locale, loadedModules)
    return loadedModules
}

async function loadLocaleModule(locale: AppLocaleCode, moduleName: LocaleMessageModule): Promise<LocaleMessages | null> {
    const importer = localeModuleImporters[`../locales/${locale}/${moduleName}.json`]
    if (!importer) {
        return null
    }

    return importer()
}

async function ensureLocaleModules(i18n: object, locale: AppLocaleCode, modules: readonly LocaleMessageModule[]) {
    const composer = resolveComposer(i18n)
    if (!composer) {
        return
    }

    const loadedModules = getLoadedModules(i18n, locale)

    for (const moduleName of modules) {
        if (loadedModules.has(moduleName)) {
            continue
        }

        const messages = await loadLocaleModule(locale, moduleName)
        if (!messages) {
            continue
        }

        composer.mergeLocaleMessage(locale, messages)
        loadedModules.add(moduleName)
    }
}

export async function ensureLocaleMessageModules(options: {
    i18n: object
    locale: string
    modules: readonly LocaleMessageModule[]
}) {
    const locale = resolveAppLocaleCode(options.locale)
    // 先请求语言，再按 fallbackChain 逐级补齐，确保缺 key 时沿同一条链路降级，
    // 避免客户端与服务端出现不同的语言回退结果。
    const localesToLoad = getLocaleRegistryItem(locale).fallbackChain

    for (const localeCode of localesToLoad) {
        await ensureLocaleModules(options.i18n, localeCode, options.modules)
    }
}

export async function ensureRouteLocaleMessages(options: {
    i18n: object
    locale: string
    path: string
    demoMode?: boolean
}) {
    // 路由只加载所需模块，避免一次性注入全部 locale 包导致首屏与切路由抖动。
    const modules = resolveLocaleMessageModulesForRoute(options.path, {
        demoMode: options.demoMode,
    })

    await ensureLocaleMessageModules({
        i18n: options.i18n,
        locale: options.locale,
        modules,
    })
}
