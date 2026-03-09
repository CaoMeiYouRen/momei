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
    const composer = resolveComposer(i18n as I18nLike)
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
    const modules = resolveLocaleMessageModulesForRoute(options.path, {
        demoMode: options.demoMode,
    })

    await ensureLocaleMessageModules({
        i18n: options.i18n,
        locale: options.locale,
        modules,
    })
}
