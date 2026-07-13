import { basename } from 'node:path'
import type {
    MomeiLinkGovernanceMappingSeed,
    MomeiLinkGovernanceRequest,
    MomeiLinkGovernanceScope,
    MomeiLinkGovernanceValidationMode,
} from '@momei-blog/api-client'
import { normalizeAsciiSlug } from './slug'
import type { ParsedHexoPost } from './types'

const DEFAULT_GOVERNANCE_SCOPES: MomeiLinkGovernanceScope[] = ['asset-url', 'post-link', 'permalink-rule']
const SUPPORTED_GOVERNANCE_SCOPES = new Set<MomeiLinkGovernanceScope>([
    'asset-url',
    'post-link',
    'category-link',
    'tag-link',
    'archive-link',
    'page-link',
    'permalink-rule',
])

function normalizeLegacySegment(value: string) {
    return value
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '')
}

function slugifyLegacySegment(value: string) {
    return normalizeAsciiSlug(normalizeLegacySegment(value), {
        allowSlash: true,
        allowUnderscore: true,
    })
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
    const categoryValue = resolvePrimaryCategory(entry)
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

function toSeedSourceKind(source: string): MomeiLinkGovernanceMappingSeed['sourceKind'] {
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

function resolvePrimaryCategory(entry: ParsedHexoPost) {
    const rawCategory = entry.frontMatter.categories ?? entry.frontMatter.category

    if (Array.isArray(rawCategory)) {
        return rawCategory[0]
    }

    return rawCategory
}

export function parseCliLinkGovernanceScopes(scopes?: string[]): MomeiLinkGovernanceScope[] {
    if (!scopes || scopes.length === 0) {
        return [...DEFAULT_GOVERNANCE_SCOPES]
    }

    const invalidScopes = scopes.filter((scope) => !SUPPORTED_GOVERNANCE_SCOPES.has(scope as MomeiLinkGovernanceScope))
    if (invalidScopes.length > 0) {
        throw new Error(`Unsupported scopes: ${invalidScopes.join(', ')}`)
    }

    return scopes as MomeiLinkGovernanceScope[]
}

export function buildLinkGovernanceSeeds(entries: ParsedHexoPost[], options: { legacyOrigin?: string } = {}) {
    const seeds: MomeiLinkGovernanceMappingSeed[] = []

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
    scopes?: MomeiLinkGovernanceScope[]
    domains?: string[]
    pathPrefixes?: string[]
    validationMode?: MomeiLinkGovernanceValidationMode
    allowRelativeLinks?: boolean
    retryFailuresFromReportId?: string
    skipConfirmation?: boolean
    legacyOrigin?: string
    reportFormat?: 'json' | 'markdown'
} = {}): MomeiLinkGovernanceRequest {
    const scopes: MomeiLinkGovernanceScope[] = options.scopes && options.scopes.length > 0
        ? options.scopes
        : [...DEFAULT_GOVERNANCE_SCOPES]

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
