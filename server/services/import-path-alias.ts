import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { isSnowflakeId } from '@/utils/shared/validate'

const CANONICAL_ALIAS_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_PERMALINK_TOKENS = new Set([
    'year',
    'month',
    'day',
    'slug',
    'title',
    'abbrlink',
    'category',
    'lang',
    'language',
])

const RESERVED_CANONICAL_ALIASES = new Set([
    'admin',
    'api',
    'about',
    'archives',
    'categories',
    'feedback',
    'friend-links',
    'forgot-password',
    'installation',
    'login',
    'privacy-policy',
    'posts',
    'register',
    'reset-password',
    'settings',
    'submit',
    'tags',
    'user-agreement',
])

const RESERVED_PERMALINK_PATHS = new Set([
    '/about',
    '/feedback',
    '/friend-links',
    '/forgot-password',
    '/installation',
    '/login',
    '/privacy-policy',
    '/register',
    '/reset-password',
    '/settings',
    '/submit',
    '/user-agreement',
])

const RESERVED_PERMALINK_PREFIXES = ['/admin', '/api']

export type ImportPathAliasField = 'slug' | 'abbrlink' | 'permalink' | 'canonical'
export type ImportPathAliasStatus = 'accepted' | 'fallback' | 'repaired' | 'invalid' | 'conflict' | 'needs-confirmation' | 'skipped'

export interface ImportPathAliasValidationInput {
    title?: string | null
    slug?: string | null
    abbrlink?: string | null
    permalink?: string | null
    language?: string | null
    category?: string | null
    createdAt?: Date | string | null
    sourceFile?: string | null
}

export interface ImportPathAliasReportItem {
    field: ImportPathAliasField
    status: ImportPathAliasStatus
    originalValue: string | null
    resolvedValue: string | null
    reason:
        | 'accepted'
        | 'derived-from-source-file'
        | 'fallback-to-abbrlink'
        | 'fallback-to-derived-slug'
        | 'normalized-slug'
        | 'invalid-format'
        | 'reserved-word'
        | 'language-conflict'
        | 'snowflake-id'
        | 'unknown-permalink-token'
        | 'missing-permalink-token'
        | 'reserved-permalink-path'
    message: string
}

export interface ImportPathAliasValidationReport {
    language: string
    canonicalSlug: string | null
    canonicalSource: 'slug' | 'abbrlink' | 'source-file' | 'title' | 'repair' | 'fallback' | null
    canImport: boolean
    requiresConfirmation: boolean
    hasBlockingIssues: boolean
    summary: Record<ImportPathAliasStatus, number>
    items: ImportPathAliasReportItem[]
}

interface CanonicalCandidateResult {
    item: ImportPathAliasReportItem
    usableValue: string | null
    requiresConfirmation: boolean
}

function normalizeOptionalString(value: string | null | undefined) {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed || null
}

function slugifyAlias(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/['"`]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
}

function getSourceStem(sourceFile?: string | null) {
    const normalized = normalizeOptionalString(sourceFile)
    if (!normalized) {
        return null
    }

    const segments = normalized.split(/[\\/]/)
    const fileName = segments.at(-1) || normalized
    return fileName.replace(/\.[^.]+$/u, '') || null
}

function normalizePermalinkPath(pathValue: string) {
    const segments = pathValue
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean)

    if (segments.length === 0) {
        return null
    }

    const normalizedSegments: string[] = []
    for (const segment of segments) {
        const normalizedSegment = /^\d+$/u.test(segment) ? segment : slugifyAlias(segment)
        if (!normalizedSegment) {
            return null
        }
        normalizedSegments.push(normalizedSegment)
    }

    return `/${normalizedSegments.join('/')}`
}

function extractPermalinkValue(value: string) {
    try {
        if (/^https?:\/\//iu.test(value)) {
            const url = new URL(value)
            return `${url.pathname}${url.search}`.trim() || '/'
        }
    } catch {
        return null
    }

    return value.trim()
}

function collectPermalinkTokens(permalink: string) {
    return [...permalink.matchAll(/:([a-zA-Z_]+)/gu)].map((match) => match[1]).filter(Boolean)
}

function buildPermalinkTokenContext(input: ImportPathAliasValidationInput, canonicalSlug: string | null) {
    const normalizedDate = input.createdAt ? new Date(input.createdAt) : null
    const titleAlias = normalizeOptionalString(input.title) ? slugifyAlias(input.title!) : null
    const categoryAlias = normalizeOptionalString(input.category) ? slugifyAlias(input.category!) : null

    return {
        year: normalizedDate && !Number.isNaN(normalizedDate.getTime()) ? String(normalizedDate.getUTCFullYear()) : null,
        month: normalizedDate && !Number.isNaN(normalizedDate.getTime()) ? String(normalizedDate.getUTCMonth() + 1).padStart(2, '0') : null,
        day: normalizedDate && !Number.isNaN(normalizedDate.getTime()) ? String(normalizedDate.getUTCDate()).padStart(2, '0') : null,
        slug: canonicalSlug,
        title: titleAlias,
        abbrlink: normalizeOptionalString(input.abbrlink),
        category: categoryAlias,
        lang: normalizeOptionalString(input.language),
        language: normalizeOptionalString(input.language),
    }
}

function createSummary(items: ImportPathAliasReportItem[]) {
    return items.reduce<Record<ImportPathAliasStatus, number>>((summary, item) => {
        summary[item.status] += 1
        return summary
    }, {
        accepted: 0,
        fallback: 0,
        repaired: 0,
        invalid: 0,
        conflict: 0,
        'needs-confirmation': 0,
        skipped: 0,
    })
}

async function checkSlugConflict(slug: string, language: string) {
    const postRepo = dataSource.getRepository(Post)
    const existing = await postRepo.findOne({
        where: {
            slug,
            language,
        },
    })

    return Boolean(existing)
}

async function inspectCanonicalCandidate(field: 'slug' | 'abbrlink', rawValue: string | null, language: string): Promise<CanonicalCandidateResult | null> {
    if (!rawValue) {
        return null
    }

    const normalizedValue = normalizeOptionalString(rawValue)
    if (!normalizedValue) {
        return null
    }

    if (isSnowflakeId(normalizedValue)) {
        return {
            item: {
                field,
                status: 'invalid',
                originalValue: normalizedValue,
                resolvedValue: null,
                reason: 'snowflake-id',
                message: `${field} 不能使用 Snowflake ID 格式。`,
            },
            usableValue: null,
            requiresConfirmation: false,
        }
    }

    if (CANONICAL_ALIAS_PATTERN.test(normalizedValue) && !RESERVED_CANONICAL_ALIASES.has(normalizedValue)) {
        const hasConflict = await checkSlugConflict(normalizedValue, language)
        if (hasConflict) {
            return {
                item: {
                    field,
                    status: 'conflict',
                    originalValue: normalizedValue,
                    resolvedValue: null,
                    reason: 'language-conflict',
                    message: `${field} 在当前语言下已存在。`,
                },
                usableValue: null,
                requiresConfirmation: false,
            }
        }

        return {
            item: {
                field,
                status: 'accepted',
                originalValue: normalizedValue,
                resolvedValue: normalizedValue,
                reason: 'accepted',
                message: `${field} 可直接沿用。`,
            },
            usableValue: normalizedValue,
            requiresConfirmation: false,
        }
    }

    if (RESERVED_CANONICAL_ALIASES.has(normalizedValue)) {
        return {
            item: {
                field,
                status: 'conflict',
                originalValue: normalizedValue,
                resolvedValue: null,
                reason: 'reserved-word',
                message: `${field} 命中了保留字。`,
            },
            usableValue: null,
            requiresConfirmation: false,
        }
    }

    const repairedValue = slugifyAlias(normalizedValue)
    if (!repairedValue || RESERVED_CANONICAL_ALIASES.has(repairedValue) || isSnowflakeId(repairedValue) || !CANONICAL_ALIAS_PATTERN.test(repairedValue)) {
        return {
            item: {
                field,
                status: 'invalid',
                originalValue: normalizedValue,
                resolvedValue: null,
                reason: 'invalid-format',
                message: `${field} 格式不合法。`,
            },
            usableValue: null,
            requiresConfirmation: false,
        }
    }

    const hasConflict = await checkSlugConflict(repairedValue, language)
    if (hasConflict) {
        return {
            item: {
                field,
                status: 'conflict',
                originalValue: normalizedValue,
                resolvedValue: repairedValue,
                reason: 'language-conflict',
                message: `${field} 修正后在当前语言下仍然冲突。`,
            },
            usableValue: null,
            requiresConfirmation: false,
        }
    }

    return {
        item: {
            field,
            status: 'repaired',
            originalValue: normalizedValue,
            resolvedValue: repairedValue,
            reason: 'normalized-slug',
            message: `${field} 需要规范化后才能使用。`,
        },
        usableValue: repairedValue,
        requiresConfirmation: true,
    }
}

function inspectDerivedCandidate(input: ImportPathAliasValidationInput) {
    const sourceStem = getSourceStem(input.sourceFile)
    const sourceValue = sourceStem || normalizeOptionalString(input.title)
    if (!sourceValue) {
        return null
    }

    const derivedSlug = slugifyAlias(sourceValue)
    if (!derivedSlug || RESERVED_CANONICAL_ALIASES.has(derivedSlug) || isSnowflakeId(derivedSlug) || !CANONICAL_ALIAS_PATTERN.test(derivedSlug)) {
        return null
    }

    return {
        source: sourceStem ? 'source-file' as const : 'title' as const,
        value: derivedSlug,
        originalValue: sourceValue,
    }
}

function inspectPermalink(input: ImportPathAliasValidationInput, canonicalSlug: string | null) {
    const permalink = normalizeOptionalString(input.permalink)
    if (!permalink) {
        return null
    }

    const extractedPermalink = extractPermalinkValue(permalink)
    if (!extractedPermalink) {
        return {
            field: 'permalink',
            status: 'invalid',
            originalValue: permalink,
            resolvedValue: null,
            reason: 'invalid-format',
            message: 'permalink 无法解析为合法路径。',
        } satisfies ImportPathAliasReportItem
    }

    const tokens = collectPermalinkTokens(extractedPermalink)
    const unknownTokens = tokens.filter((token) => !ALLOWED_PERMALINK_TOKENS.has(token))
    if (unknownTokens.length > 0) {
        return {
            field: 'permalink',
            status: 'needs-confirmation',
            originalValue: permalink,
            resolvedValue: null,
            reason: 'unknown-permalink-token',
            message: `permalink 包含当前导入链路无法解析的占位符：${unknownTokens.join(', ')}`,
        } satisfies ImportPathAliasReportItem
    }

    let renderedPermalink = extractedPermalink
    const tokenContext = buildPermalinkTokenContext(input, canonicalSlug)
    const missingTokens = tokens.filter((token) => !tokenContext[token as keyof typeof tokenContext])
    if (missingTokens.length > 0) {
        return {
            field: 'permalink',
            status: 'needs-confirmation',
            originalValue: permalink,
            resolvedValue: null,
            reason: 'missing-permalink-token',
            message: `permalink 缺少必要上下文：${missingTokens.join(', ')}`,
        } satisfies ImportPathAliasReportItem
    }

    for (const token of tokens) {
        const tokenValue = tokenContext[token as keyof typeof tokenContext]
        renderedPermalink = renderedPermalink.replaceAll(`:${token}`, tokenValue || '')
    }

    const normalizedPath = normalizePermalinkPath(renderedPermalink)
    if (!normalizedPath) {
        return {
            field: 'permalink',
            status: 'invalid',
            originalValue: permalink,
            resolvedValue: null,
            reason: 'invalid-format',
            message: 'permalink 规范化后为空或包含非法路径段。',
        } satisfies ImportPathAliasReportItem
    }

    const canonicalPath = canonicalSlug ? `/posts/${canonicalSlug}` : null
    if (canonicalPath && normalizedPath === canonicalPath) {
        return {
            field: 'permalink',
            status: 'accepted',
            originalValue: permalink,
            resolvedValue: normalizedPath,
            reason: 'accepted',
            message: 'permalink 与当前 canonical 路径一致。',
        } satisfies ImportPathAliasReportItem
    }

    const reservedConflict = RESERVED_PERMALINK_PATHS.has(normalizedPath)
        || RESERVED_PERMALINK_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))

    if (reservedConflict) {
        return {
            field: 'permalink',
            status: 'needs-confirmation',
            originalValue: permalink,
            resolvedValue: normalizedPath,
            reason: 'reserved-permalink-path',
            message: 'permalink 命中了当前站点的固定公开路径，导入前需要人工确认。',
        } satisfies ImportPathAliasReportItem
    }

    return {
        field: 'permalink',
        status: 'accepted',
        originalValue: permalink,
        resolvedValue: normalizedPath,
        reason: 'accepted',
        message: 'permalink 可作为历史路径别名继续治理。',
    } satisfies ImportPathAliasReportItem
}

export async function validateImportPathAliases(input: ImportPathAliasValidationInput): Promise<ImportPathAliasValidationReport> {
    const language = normalizeOptionalString(input.language) || 'zh-CN'
    const items: ImportPathAliasReportItem[] = []

    const slugCandidate = await inspectCanonicalCandidate('slug', normalizeOptionalString(input.slug), language)
    const abbrlinkCandidate = await inspectCanonicalCandidate('abbrlink', normalizeOptionalString(input.abbrlink), language)
    const derivedCandidate = inspectDerivedCandidate(input)

    if (slugCandidate) {
        items.push(slugCandidate.item)
    }
    if (abbrlinkCandidate) {
        items.push(abbrlinkCandidate.item)
    }

    let canonicalSlug: string | null = null
    let canonicalSource: ImportPathAliasValidationReport['canonicalSource'] = null
    let requiresConfirmation = false

    if (slugCandidate?.usableValue && slugCandidate.item.status === 'accepted') {
        canonicalSlug = slugCandidate.usableValue
        canonicalSource = 'slug'
        items.push({
            field: 'canonical',
            status: 'accepted',
            originalValue: slugCandidate.item.originalValue,
            resolvedValue: canonicalSlug,
            reason: 'accepted',
            message: 'canonical slug 沿用 source slug。',
        })
    } else if (abbrlinkCandidate?.usableValue && !normalizeOptionalString(input.slug) && abbrlinkCandidate.item.status === 'accepted') {
        canonicalSlug = abbrlinkCandidate.usableValue
        canonicalSource = 'abbrlink'
        items.push({
            field: 'canonical',
            status: 'accepted',
            originalValue: abbrlinkCandidate.item.originalValue,
            resolvedValue: canonicalSlug,
            reason: 'accepted',
            message: 'canonical slug 沿用 abbrlink。',
        })
    } else if (abbrlinkCandidate?.usableValue) {
        canonicalSlug = abbrlinkCandidate.usableValue
        canonicalSource = 'fallback'
        requiresConfirmation = true
        items.push({
            field: 'canonical',
            status: 'fallback',
            originalValue: slugCandidate?.item.originalValue || null,
            resolvedValue: canonicalSlug,
            reason: 'fallback-to-abbrlink',
            message: 'source slug 不可用，已切换为 abbrlink 作为 canonical slug。',
        })
    } else if (slugCandidate?.usableValue) {
        canonicalSlug = slugCandidate.usableValue
        canonicalSource = 'repair'
        requiresConfirmation = true
        items.push({
            field: 'canonical',
            status: 'repaired',
            originalValue: slugCandidate.item.originalValue,
            resolvedValue: canonicalSlug,
            reason: 'normalized-slug',
            message: 'source slug 需要规范化后才能作为 canonical slug。',
        })
    } else if (abbrlinkCandidate?.usableValue) {
        canonicalSlug = abbrlinkCandidate.usableValue
        canonicalSource = 'repair'
        requiresConfirmation = true
        items.push({
            field: 'canonical',
            status: 'repaired',
            originalValue: abbrlinkCandidate.item.originalValue,
            resolvedValue: canonicalSlug,
            reason: 'normalized-slug',
            message: 'abbrlink 需要规范化后才能作为 canonical slug。',
        })
    } else if (derivedCandidate) {
        const derivedConflict = await checkSlugConflict(derivedCandidate.value, language)
        if (!derivedConflict) {
            const explicitAliasProvided = Boolean(normalizeOptionalString(input.slug) || normalizeOptionalString(input.abbrlink))
            canonicalSlug = derivedCandidate.value
            canonicalSource = derivedCandidate.source
            requiresConfirmation = explicitAliasProvided
            items.push({
                field: 'canonical',
                status: explicitAliasProvided ? 'fallback' : 'accepted',
                originalValue: derivedCandidate.originalValue,
                resolvedValue: canonicalSlug,
                reason: explicitAliasProvided ? 'fallback-to-derived-slug' : 'derived-from-source-file',
                message: explicitAliasProvided
                    ? '显式别名不可用，已回退到文件名/标题推导的 slug。'
                    : '未提供显式别名，使用文件名/标题推导 slug。',
            })
        }
    }

    const permalinkItem = inspectPermalink(input, canonicalSlug)
    if (permalinkItem) {
        items.push(permalinkItem)
        if (permalinkItem.status === 'needs-confirmation') {
            requiresConfirmation = true
        }
    }

    const hasBlockingIssues = !canonicalSlug
    const summary = createSummary(items)

    return {
        language,
        canonicalSlug,
        canonicalSource,
        canImport: Boolean(canonicalSlug),
        requiresConfirmation,
        hasBlockingIssues,
        summary,
        items,
    }
}
