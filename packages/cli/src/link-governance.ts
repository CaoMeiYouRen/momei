import { basename } from 'node:path'
import type {
    CliLinkGovernanceMappingSeed,
    CliLinkGovernanceRequest,
    CliLinkGovernanceScope,
    CliLinkGovernanceValidationMode,
    ParsedHexoPost,
} from './types'

function normalizeLegacySegment(value: string) {
    return value
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
}

function slugifyLegacySegment(value: string) {
    return normalizeLegacySegment(value)
        .toLowerCase()
        .replace(/[^a-z0-9/_-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/(^-|-$)/g, '')
}

function renderLegacyPermalink(entry: ParsedHexoPost) {
    const permalink = entry.frontMatter.permalink?.trim()
    if (!permalink) {
        return null
    }

    if (/^https?:\/\//i.test(permalink)) {
        return permalink
    }

    let dateValue: Date | null = null
    if (entry.frontMatter.date) {
        dateValue = typeof entry.frontMatter.date === 'string'
            ? new Date(entry.frontMatter.date)
            : entry.frontMatter.date
    }
    const fileBasename = basename(entry.relativeFile).replace(/\.md$/i, '')
    const slug = entry.post.slug || fileBasename
    const categoryValue = Array.isArray(entry.frontMatter.categories)
        ? entry.frontMatter.categories[0]
        : entry.frontMatter.categories
    const replacements: Record<string, string> = {
        ':title': slugifyLegacySegment(slug),
        ':slug': slugifyLegacySegment(slug),
        ':category': categoryValue ? slugifyLegacySegment(String(categoryValue)) : '',
        ':lang': slugifyLegacySegment(entry.post.language || 'zh-cn'),
    }

    if (dateValue && !Number.isNaN(dateValue.getTime())) {
        replacements[':year'] = String(dateValue.getUTCFullYear())
        replacements[':month'] = String(dateValue.getUTCMonth() + 1).padStart(2, '0')
        replacements[':day'] = String(dateValue.getUTCDate()).padStart(2, '0')
    }

    let rendered = permalink
    for (const [token, value] of Object.entries(replacements)) {
        rendered = rendered.replaceAll(token, value)
    }

    if (/:[a-z]/i.test(rendered)) {
        return null
    }

    return rendered.startsWith('/') ? rendered : `/${rendered}`
}

function toSeedSourceKind(source: string): CliLinkGovernanceMappingSeed['sourceKind'] {
    if (/^https?:\/\//i.test(source)) {
        return 'absolute'
    }

    if (source.startsWith('/')) {
        return 'root-relative'
    }

    return 'relative'
}

function joinOriginAndPath(origin: string, path: string) {
    return `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export function buildLinkGovernanceSeeds(entries: ParsedHexoPost[], options: { legacyOrigin?: string } = {}) {
    const seeds: CliLinkGovernanceMappingSeed[] = []

    for (const entry of entries) {
        const renderedPermalink = renderLegacyPermalink(entry)
        if (!renderedPermalink || !entry.post.slug) {
            continue
        }

        const normalizedSource = /^https?:\/\//i.test(renderedPermalink)
            ? renderedPermalink
            : `/${normalizeLegacySegment(renderedPermalink)}`

        seeds.push({
            source: normalizedSource,
            sourceKind: toSeedSourceKind(normalizedSource),
            matchMode: 'exact',
            scope: 'post-link',
            targetType: 'post',
            targetRef: {
                slug: entry.post.slug,
            },
            redirectMode: 'redirect-seed',
            notes: entry.relativeFile,
        })

        if (options.legacyOrigin && !/^https?:\/\//i.test(normalizedSource)) {
            seeds.push({
                source: joinOriginAndPath(options.legacyOrigin, normalizedSource),
                sourceKind: 'absolute',
                matchMode: 'exact',
                scope: 'post-link',
                targetType: 'post',
                targetRef: {
                    slug: entry.post.slug,
                },
                redirectMode: 'redirect-seed',
                notes: entry.relativeFile,
            })
        }
    }

    return seeds
}

export function buildLinkGovernanceRequest(entries: ParsedHexoPost[], options: {
    scopes?: CliLinkGovernanceScope[]
    domains?: string[]
    pathPrefixes?: string[]
    validationMode?: CliLinkGovernanceValidationMode
    allowRelativeLinks?: boolean
    retryFailuresFromReportId?: string
    skipConfirmation?: boolean
    legacyOrigin?: string
    reportFormat?: 'json' | 'markdown'
} = {}): CliLinkGovernanceRequest {
    const scopes = options.scopes && options.scopes.length > 0
        ? options.scopes
        : ['asset-url', 'post-link', 'permalink-rule']

    return {
        scopes,
        filters: {
            domains: options.domains?.filter(Boolean),
            pathPrefixes: options.pathPrefixes?.filter(Boolean),
            contentTypes: ['post'],
        },
        seeds: buildLinkGovernanceSeeds(entries, {
            legacyOrigin: options.legacyOrigin,
        }),
        options: {
            reportFormat: options.reportFormat || 'json',
            validationMode: options.validationMode || 'static',
            allowRelativeLinks: options.allowRelativeLinks || false,
            retryFailuresFromReportId: options.retryFailuresFromReportId,
            skipConfirmation: options.skipConfirmation || false,
        },
    }
}
