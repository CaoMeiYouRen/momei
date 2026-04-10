import type { InstallationDiagnosticIssue } from './installation-diagnostics'
import { getLocaleRoutePrefix, resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'

type InstallationDocsPage = InstallationDiagnosticIssue['docsPage']

interface InstallationDocResource {
    key: string
    href: string
    labelKey: string
    external: boolean
}

interface BuildInstallationDocResourcesInput {
    locale: string
    issues: InstallationDiagnosticIssue[]
}

const DOCS_BASE_URL = 'https://docs.momei.app'

const DOCS_PAGE_LABEL_KEY_MAP: Record<InstallationDocsPage, string> = {
    'quick-start': 'installation.healthCheck.resources.quickStart',
    deploy: 'installation.healthCheck.resources.deploy',
    variables: 'installation.healthCheck.resources.variables',
}

const DOCS_PAGE_ORDER: InstallationDocsPage[] = ['quick-start', 'deploy', 'variables']

const SUPPORTED_TRANSLATED_DOCS: Record<AppLocaleCode, InstallationDocsPage[]> = {
    'zh-CN': ['quick-start', 'deploy', 'variables'],
    'zh-TW': ['quick-start', 'deploy', 'variables'],
    'en-US': ['quick-start', 'deploy', 'variables'],
    'ja-JP': ['quick-start', 'deploy'],
    'ko-KR': ['quick-start', 'deploy', 'variables'],
}

function resolveDocsLocale(locale: string): AppLocaleCode {
    return resolveAppLocaleCode(locale)
}

function resolveSupportedDocsPages(locale: string): InstallationDocsPage[] {
    return SUPPORTED_TRANSLATED_DOCS[resolveDocsLocale(locale)] ?? SUPPORTED_TRANSLATED_DOCS['zh-CN']
}

function resolveDocsHref(locale: string, docsPage: InstallationDocsPage) {
    return `${DOCS_BASE_URL}${getLocaleRoutePrefix(resolveDocsLocale(locale))}/guide/${docsPage}`
}

export function buildInstallationDocResources(input: BuildInstallationDocResourcesInput): InstallationDocResource[] {
    const supportedPages = resolveSupportedDocsPages(input.locale)
    const prioritizedPages = input.issues
        .map((issue) => issue.docsPage)
        .filter((docsPage, index, pages) => supportedPages.includes(docsPage) && pages.indexOf(docsPage) === index)

    const defaultPages = DOCS_PAGE_ORDER.filter((docsPage) => supportedPages.includes(docsPage))
    const pages = [...prioritizedPages, ...defaultPages].filter((docsPage, index, allPages) => allPages.indexOf(docsPage) === index)

    return [
        ...pages.map((docsPage) => ({
            key: docsPage,
            href: resolveDocsHref(input.locale, docsPage),
            labelKey: DOCS_PAGE_LABEL_KEY_MAP[docsPage],
            external: true,
        })),
        {
            key: 'feedback',
            href: '/feedback',
            labelKey: 'installation.healthCheck.resources.feedback',
            external: false,
        },
    ]
}
