export const LOCALE_MESSAGE_MODULE_GROUPS = {
    common: ['app', 'common', 'error', 'redirect'],
    components: ['components', 'comments'],
    pages: ['pages', 'home', 'demo', 'installation', 'legal'],
    feed: ['feed'],
} as const

export const LOCALE_MESSAGE_MODULE_ORDER = Object.keys(LOCALE_MESSAGE_MODULE_GROUPS) as (keyof typeof LOCALE_MESSAGE_MODULE_GROUPS)[]

export type LocaleMessageModule = (typeof LOCALE_MESSAGE_MODULE_ORDER)[number]

export function getLocaleMessageFilePaths(localeCode: string): string[] {
    return LOCALE_MESSAGE_MODULE_ORDER.map((moduleName) => `${localeCode}/${moduleName}.json`)
}
