import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { LinkGovernanceReport } from '@/server/entities/link-governance-report'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { getSettings } from '@/server/services/setting'
import { getUploadStorageContext, resolveUploadedFileUrl } from '@/server/services/upload'
import { SettingKey } from '@/types/setting'
import {
    LINK_GOVERNANCE_CONTENT_TYPES,
    STATIC_PAGE_ROUTE_MAP,
    type LinkGovernanceContentType,
    type LinkGovernanceDiffItem,
    type LinkGovernanceIssue,
    type LinkGovernanceMappingSeed,
    type LinkGovernancePageKey,
    type LinkGovernanceRedirectSeed,
    type LinkGovernanceRequest,
    type LinkGovernanceRequestFilters,
    type LinkGovernanceRequestOptions,
    type LinkGovernanceScope,
    type LinkGovernanceSourceKind,
    type LinkGovernanceTargetRef,
} from '@/types/migration-link-governance'

type PostTarget = Pick<Post, 'id' | 'slug' | 'language' | 'translationId'>
type CategoryTarget = Pick<Category, 'id' | 'slug' | 'language' | 'translationId'>
type TagTarget = Pick<Tag, 'id' | 'slug' | 'language' | 'translationId'>

interface GovernanceEntityMaps {
    posts: PostTarget[]
    categories: CategoryTarget[]
    tags: TagTarget[]
    postById: Map<string, PostTarget>
    postBySlug: Map<string, PostTarget>
    postByTranslationId: Map<string, PostTarget>
    categoryById: Map<string, CategoryTarget>
    categoryBySlug: Map<string, CategoryTarget>
    categoryByTranslationId: Map<string, CategoryTarget>
    tagById: Map<string, TagTarget>
    tagBySlug: Map<string, TagTarget>
    tagByTranslationId: Map<string, TagTarget>
}

export interface GovernanceRuntimeContext {
    entityMaps: GovernanceEntityMaps
    defaultSeeds: LinkGovernanceMappingSeed[]
    siteUrl: string
    managedDomains: string[]
    storageContext: Awaited<ReturnType<typeof getUploadStorageContext>>
    reportRepo: ReturnType<typeof dataSource.getRepository<LinkGovernanceReport>>
}

export interface LinkCandidate {
    value: string
    sourceKind: LinkGovernanceSourceKind
    field: 'content' | 'coverImage' | 'metadata.audio.url'
}

export interface CandidateResolution {
    targetValue: string | null
    scope: LinkGovernanceScope
    status: LinkGovernanceDiffItem['status']
    issues?: LinkGovernanceIssue[]
    matchedBy?: LinkGovernanceDiffItem['matchedBy']
    redirectSeed?: LinkGovernanceRedirectSeed
    objectKey?: string | null
    domain?: string | null
}

export function normalizeContentTypes(contentTypes?: LinkGovernanceContentType[]) {
    if (!contentTypes || contentTypes.length === 0) {
        return ['post'] as LinkGovernanceContentType[]
    }

    return Array.from(new Set(contentTypes.filter((item) => LINK_GOVERNANCE_CONTENT_TYPES.includes(item))))
}

function normalizeDomain(domain: string) {
    return domain.trim().toLowerCase()
}

function normalizePath(pathname: string) {
    const normalized = pathname.replace(/\\/g, '/').trim()
    if (!normalized) {
        return '/'
    }

    const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
    return withLeadingSlash.replace(/\/+/g, '/')
}

function stripQueryAndHash(value: string) {
    return value.split('#')[0]?.split('?')[0] || value
}

export function getSourceKind(value: string): LinkGovernanceSourceKind {
    if (/^https?:\/\//i.test(value)) {
        return 'absolute'
    }

    if (value.startsWith('/')) {
        return 'root-relative'
    }

    return 'relative'
}

export function getCandidateDomain(value: string) {
    if (!/^https?:\/\//i.test(value)) {
        return null
    }

    try {
        return new URL(value).hostname.toLowerCase()
    } catch {
        return null
    }
}

export function getCandidatePath(value: string, sourceKind: LinkGovernanceSourceKind) {
    const normalizedValue = stripQueryAndHash(value)

    if (sourceKind === 'absolute') {
        try {
            return normalizePath(new URL(normalizedValue).pathname)
        } catch {
            return normalizePath(normalizedValue)
        }
    }

    if (sourceKind === 'root-relative') {
        return normalizePath(normalizedValue)
    }

    return normalizedValue.replace(/\\/g, '/').trim()
}

function trimTrailingSlash(pathname: string) {
    if (pathname === '/') {
        return pathname
    }

    return pathname.replace(/\/+$/, '') || '/'
}

export function domainMatches(domain: string | null, filters?: LinkGovernanceRequestFilters, managedDomains: string[] = []) {
    if (!domain) {
        return true
    }

    const allowed = new Set((filters?.domains || []).map(normalizeDomain))
    managedDomains.forEach((item) => allowed.add(normalizeDomain(item)))

    if (allowed.size === 0) {
        return true
    }

    return allowed.has(normalizeDomain(domain))
}

export function pathPrefixMatches(pathname: string, filters?: LinkGovernanceRequestFilters) {
    if (!filters?.pathPrefixes || filters.pathPrefixes.length === 0) {
        return true
    }

    const targetPath = trimTrailingSlash(pathname)
    return filters.pathPrefixes.some((prefix) => targetPath.startsWith(trimTrailingSlash(normalizePath(prefix))))
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPatternRegExp(source: string, sourceKind: LinkGovernanceSourceKind) {
    const input = sourceKind === 'absolute' ? stripQueryAndHash(source) : source
    let pattern = escapeRegExp(input)
        .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName: string) => `(?<${paramName}>[^/]+)`)
        .replace(/\\\*/g, '.*')

    if (sourceKind !== 'relative') {
        pattern = `${pattern}/?`
    }

    return new RegExp(`^${pattern}$`, 'i')
}

export function buildIssue(code: LinkGovernanceIssue['code'], message: string): LinkGovernanceIssue {
    return { code, message }
}

export function looksLikeManagedAssetPath(pathname: string) {
    const normalized = pathname.replace(/^\/+/, '')
    return normalized.startsWith('avatars/')
        || normalized.startsWith('uploads/')
        || /^posts\/[^/]+\/(image|audio|video|file)\//.test(normalized)
        || /\.(png|jpe?g|gif|svg|webp|mp3|wav|ogg|m4a|mp4|webm|pdf|zip|txt|json|xml)$/i.test(normalized)
}

function stripAssetPrefix(pathname: string, pathPrefixes?: string[]) {
    const normalizedPath = normalizePath(pathname)
    const prefixes = (pathPrefixes || []).map((prefix) => trimTrailingSlash(normalizePath(prefix)))

    for (const prefix of prefixes) {
        if (prefix !== '/' && normalizedPath.startsWith(prefix)) {
            const stripped = normalizedPath.slice(prefix.length)
            return stripped.replace(/^\/+/, '')
        }
    }

    return normalizedPath.replace(/^\/+/, '')
}

function getManagedBaseUrls(storageContext: Awaited<ReturnType<typeof getUploadStorageContext>>) {
    return [storageContext.assetPublicBaseUrl, storageContext.driverBaseUrl]
        .filter(Boolean)
        .map((url) => url.trim())
}

export function deriveObjectKeyFromAssetUrl(params: {
    value: string
    sourceKind: LinkGovernanceSourceKind
    runtime: GovernanceRuntimeContext
    options: LinkGovernanceRequestOptions | undefined
    field: LinkCandidate['field']
    filters?: LinkGovernanceRequestFilters
}) {
    const { value, sourceKind, runtime, options, field, filters } = params
    const candidatePath = getCandidatePath(value, sourceKind)
    const candidateDomain = getCandidateDomain(value)
    const managedBaseUrls = getManagedBaseUrls(runtime.storageContext)

    if (sourceKind === 'absolute') {
        for (const baseUrl of managedBaseUrls) {
            try {
                const base = new URL(baseUrl)
                const target = new URL(value)
                if (base.hostname === target.hostname && trimTrailingSlash(target.pathname).startsWith(trimTrailingSlash(base.pathname))) {
                    const objectKey = target.pathname.slice(trimTrailingSlash(base.pathname).length).replace(/^\/+/, '')
                    if (objectKey) {
                        return objectKey
                    }
                }
            } catch {
                continue
            }
        }
    }

    if (field !== 'content' || sourceKind !== 'relative' || options?.allowRelativeLinks) {
        if (sourceKind === 'root-relative' || sourceKind === 'relative') {
            if (looksLikeManagedAssetPath(candidatePath)) {
                return stripAssetPrefix(candidatePath, filters?.pathPrefixes)
            }
        }
    }

    if (sourceKind === 'absolute' && candidateDomain && domainMatches(candidateDomain, filters, runtime.managedDomains) && looksLikeManagedAssetPath(candidatePath)) {
        return stripAssetPrefix(candidatePath, filters?.pathPrefixes)
    }

    return null
}

function buildRedirectReason(scope: LinkGovernanceScope): LinkGovernanceRedirectSeed['reason'] {
    if (scope === 'asset-url') {
        return 'asset-domain-migration'
    }

    if (scope === 'permalink-rule') {
        return 'path-rule'
    }

    return 'legacy-permalink'
}

export function buildRedirectSeed(source: string, target: string, scope: LinkGovernanceScope): LinkGovernanceRedirectSeed | undefined {
    if (!source || !target || source === target) {
        return undefined
    }

    return {
        source,
        target,
        statusCode: 301,
        reason: buildRedirectReason(scope),
    }
}

function getStaticPagePath(pageKey: LinkGovernancePageKey | undefined) {
    return pageKey ? STATIC_PAGE_ROUTE_MAP[pageKey] : null
}

function resolvePostTarget(targetRef: LinkGovernanceTargetRef, runtime: GovernanceRuntimeContext, fallbackSlug?: string | null) {
    if (targetRef.id) {
        return runtime.entityMaps.postById.get(targetRef.id)
    }

    if (targetRef.translationId) {
        return runtime.entityMaps.postByTranslationId.get(targetRef.translationId)
    }

    if (fallbackSlug) {
        return runtime.entityMaps.postBySlug.get(fallbackSlug)
    }

    return undefined
}

function resolveCategoryTarget(targetRef: LinkGovernanceTargetRef, runtime: GovernanceRuntimeContext, fallbackSlug?: string | null) {
    if (targetRef.id) {
        return runtime.entityMaps.categoryById.get(targetRef.id)
    }

    if (targetRef.translationId) {
        return runtime.entityMaps.categoryByTranslationId.get(targetRef.translationId)
    }

    if (fallbackSlug) {
        return runtime.entityMaps.categoryBySlug.get(fallbackSlug)
    }

    return undefined
}

function resolveTagTarget(targetRef: LinkGovernanceTargetRef, runtime: GovernanceRuntimeContext, fallbackSlug?: string | null) {
    if (targetRef.id) {
        return runtime.entityMaps.tagById.get(targetRef.id)
    }

    if (targetRef.translationId) {
        return runtime.entityMaps.tagByTranslationId.get(targetRef.translationId)
    }

    if (fallbackSlug) {
        return runtime.entityMaps.tagBySlug.get(fallbackSlug)
    }

    return undefined
}

function getSeedComparableSource(seed: LinkGovernanceMappingSeed) {
    if (seed.sourceKind === 'absolute') {
        return stripQueryAndHash(seed.source)
    }

    if (seed.sourceKind === 'relative') {
        return seed.source.replace(/\\/g, '/').trim()
    }

    return normalizePath(seed.source)
}

function buildEntityMaps(posts: PostTarget[], categories: CategoryTarget[], tags: TagTarget[]): GovernanceEntityMaps {
    const postById = new Map<string, PostTarget>()
    const postBySlug = new Map<string, PostTarget>()
    const postByTranslationId = new Map<string, PostTarget>()
    const categoryById = new Map<string, CategoryTarget>()
    const categoryBySlug = new Map<string, CategoryTarget>()
    const categoryByTranslationId = new Map<string, CategoryTarget>()
    const tagById = new Map<string, TagTarget>()
    const tagBySlug = new Map<string, TagTarget>()
    const tagByTranslationId = new Map<string, TagTarget>()

    posts.forEach((item) => {
        postById.set(item.id, item)
        postBySlug.set(item.slug, item)
        if (item.translationId && !postByTranslationId.has(item.translationId)) {
            postByTranslationId.set(item.translationId, item)
        }
    })

    categories.forEach((item) => {
        categoryById.set(item.id, item)
        categoryBySlug.set(item.slug, item)
        if (item.translationId && !categoryByTranslationId.has(item.translationId)) {
            categoryByTranslationId.set(item.translationId, item)
        }
    })

    tags.forEach((item) => {
        tagById.set(item.id, item)
        tagBySlug.set(item.slug, item)
        if (item.translationId && !tagByTranslationId.has(item.translationId)) {
            tagByTranslationId.set(item.translationId, item)
        }
    })

    return {
        posts,
        categories,
        tags,
        postById,
        postBySlug,
        postByTranslationId,
        categoryById,
        categoryBySlug,
        categoryByTranslationId,
        tagById,
        tagBySlug,
        tagByTranslationId,
    }
}

function buildDefaultSeeds(entityMaps: GovernanceEntityMaps): LinkGovernanceMappingSeed[] {
    const seeds: LinkGovernanceMappingSeed[] = []

    entityMaps.posts.forEach((post) => {
        seeds.push({
            source: `/posts/${post.slug}`,
            sourceKind: 'root-relative',
            matchMode: 'exact',
            scope: 'post-link',
            targetType: 'post',
            targetRef: { id: post.id, slug: post.slug, translationId: post.translationId || undefined },
            redirectMode: 'alias-only',
        })
        seeds.push({
            source: `/posts/${post.id}`,
            sourceKind: 'root-relative',
            matchMode: 'exact',
            scope: 'post-link',
            targetType: 'post',
            targetRef: { id: post.id, slug: post.slug, translationId: post.translationId || undefined },
            redirectMode: 'redirect-seed',
        })
    })

    entityMaps.categories.forEach((category) => {
        seeds.push({
            source: `/categories/${category.slug}`,
            sourceKind: 'root-relative',
            matchMode: 'exact',
            scope: 'category-link',
            targetType: 'category',
            targetRef: { id: category.id, slug: category.slug, translationId: category.translationId || undefined },
            redirectMode: 'alias-only',
        })
    })

    entityMaps.tags.forEach((tag) => {
        seeds.push({
            source: `/tags/${tag.slug}`,
            sourceKind: 'root-relative',
            matchMode: 'exact',
            scope: 'tag-link',
            targetType: 'tag',
            targetRef: { id: tag.id, slug: tag.slug, translationId: tag.translationId || undefined },
            redirectMode: 'alias-only',
        })
    })

    Object.entries(STATIC_PAGE_ROUTE_MAP).forEach(([pageKey, routePath]) => {
        seeds.push({
            source: routePath,
            sourceKind: 'root-relative',
            matchMode: 'exact',
            scope: 'page-link',
            targetType: 'page',
            targetRef: { pageKey: pageKey as LinkGovernancePageKey },
            redirectMode: 'alias-only',
        })
    })

    seeds.push({
        source: '/archives',
        sourceKind: 'root-relative',
        matchMode: 'exact',
        scope: 'archive-link',
        targetType: 'archive',
        targetRef: {},
        redirectMode: 'alias-only',
    })

    return seeds
}

export async function buildRuntimeContext() {
    const postRepo = dataSource.getRepository(Post)
    const categoryRepo = dataSource.getRepository(Category)
    const tagRepo = dataSource.getRepository(Tag)
    const reportRepo = dataSource.getRepository(LinkGovernanceReport)

    const [posts, categories, tags, storageContext, settings] = await Promise.all([
        postRepo.find({
            select: ['id', 'slug', 'language', 'translationId'],
        }),
        categoryRepo.find({
            select: ['id', 'slug', 'language', 'translationId'],
        }),
        tagRepo.find({
            select: ['id', 'slug', 'language', 'translationId'],
        }),
        getUploadStorageContext(),
        getSettings([SettingKey.SITE_URL]),
    ])

    const entityMaps = buildEntityMaps(posts, categories, tags)
    const defaultSeeds = buildDefaultSeeds(entityMaps)
    const siteUrl = String(settings[SettingKey.SITE_URL] || '')
    const managedDomains = new Set<string>()

    for (const candidate of [siteUrl, storageContext.assetPublicBaseUrl, storageContext.driverBaseUrl]) {
        if (!candidate) {
            continue
        }

        try {
            managedDomains.add(new URL(candidate).hostname.toLowerCase())
        } catch {
            continue
        }
    }

    return {
        entityMaps,
        defaultSeeds,
        siteUrl,
        managedDomains: Array.from(managedDomains),
        storageContext,
        reportRepo,
    } satisfies GovernanceRuntimeContext
}

export function resolveTargetPath(targetType: LinkGovernanceMappingSeed['targetType'], targetRef: LinkGovernanceTargetRef, runtime: GovernanceRuntimeContext, fallbackSlug?: string | null) {
    const slugCandidate = fallbackSlug || targetRef.slug

    if (targetType === 'page') {
        return getStaticPagePath(targetRef.pageKey)
    }

    if (targetType === 'archive') {
        return '/archives'
    }

    if (targetType === 'asset') {
        if (!targetRef.objectKey) {
            return null
        }
        return resolveUploadedFileUrl(targetRef.objectKey, runtime.storageContext)
    }

    if (targetType === 'post') {
        const post = resolvePostTarget(targetRef, runtime, slugCandidate)
        return post ? `/posts/${post.slug}` : null
    }

    if (targetType === 'category') {
        const category = resolveCategoryTarget(targetRef, runtime, slugCandidate)
        return category ? `/categories/${category.slug}` : null
    }

    if (targetType === 'tag') {
        const tag = resolveTagTarget(targetRef, runtime, slugCandidate)
        return tag ? `/tags/${tag.slug}` : null
    }

    return null
}

function matchSeed(seed: LinkGovernanceMappingSeed, candidateValue: string, sourceKind: LinkGovernanceSourceKind) {
    const candidateComparable = seed.sourceKind === 'absolute'
        ? stripQueryAndHash(candidateValue)
        : getCandidatePath(candidateValue, sourceKind)
    const sourceComparable = getSeedComparableSource(seed)

    if (seed.sourceKind !== sourceKind && !(seed.sourceKind === 'path-rule' && sourceKind !== 'absolute')) {
        if (seed.sourceKind !== 'path-rule') {
            return null
        }
    }

    if (seed.matchMode === 'exact' && trimTrailingSlash(candidateComparable) === trimTrailingSlash(sourceComparable)) {
        return { params: {} as Record<string, string> }
    }

    if (seed.matchMode === 'prefix' && candidateComparable.startsWith(sourceComparable)) {
        return { params: {} as Record<string, string> }
    }

    if (seed.matchMode === 'pattern' || seed.sourceKind === 'path-rule') {
        const regex = buildPatternRegExp(sourceComparable, seed.sourceKind === 'path-rule' ? sourceKind : seed.sourceKind)
        const match = candidateComparable.match(regex)
        if (match) {
            return { params: (match.groups || {}) as Record<string, string> }
        }
    }

    return null
}

export function collectMatchingSeeds(candidate: LinkCandidate, runtime: GovernanceRuntimeContext, request: LinkGovernanceRequest) {
    const seeds = [...(request.seeds || []), ...runtime.defaultSeeds].filter((seed) => request.scopes.includes(seed.scope))
    return seeds
        .map((seed) => ({ seed, matched: matchSeed(seed, candidate.value, candidate.sourceKind) }))
        .filter((item) => Boolean(item.matched)) as { seed: LinkGovernanceMappingSeed, matched: { params: Record<string, string> } }[]
}

export function resolveCanonicalRoute(pathname: string, runtime: GovernanceRuntimeContext): CandidateResolution | null {
    const normalized = trimTrailingSlash(normalizePath(pathname))

    if (normalized === '/archives') {
        return {
            targetValue: '/archives',
            scope: 'archive-link',
            status: 'unchanged',
            matchedBy: 'canonical',
        }
    }

    for (const routePath of Object.values(STATIC_PAGE_ROUTE_MAP)) {
        if (trimTrailingSlash(routePath) === normalized) {
            return {
                targetValue: routePath,
                scope: 'page-link',
                status: 'unchanged',
                matchedBy: 'page-key',
            }
        }
    }

    const postMatch = /^\/posts\/([^/]+)$/.exec(normalized)
    if (postMatch) {
        const key = postMatch[1]
        if (!key) {
            return null
        }

        const post = runtime.entityMaps.postBySlug.get(key) || runtime.entityMaps.postById.get(key)
        if (!post) {
            return null
        }

        const targetValue = `/posts/${post.slug}`
        return {
            targetValue,
            scope: 'post-link',
            status: trimTrailingSlash(targetValue) === normalized ? 'unchanged' : 'rewritten',
            matchedBy: runtime.entityMaps.postBySlug.has(key) ? 'slug' : 'id',
            redirectSeed: buildRedirectSeed(normalized, targetValue, 'post-link'),
        }
    }

    const categoryMatch = /^\/categories\/([^/]+)$/.exec(normalized)
    if (categoryMatch) {
        const categorySlug = categoryMatch[1]
        if (!categorySlug) {
            return null
        }

        const category = runtime.entityMaps.categoryBySlug.get(categorySlug)
        if (!category) {
            return null
        }

        return {
            targetValue: `/categories/${category.slug}`,
            scope: 'category-link',
            status: 'unchanged',
            matchedBy: 'slug',
        }
    }

    const tagMatch = /^\/tags\/([^/]+)$/.exec(normalized)
    if (tagMatch) {
        const tagSlug = tagMatch[1]
        if (!tagSlug) {
            return null
        }

        const tag = runtime.entityMaps.tagBySlug.get(tagSlug)
        if (!tag) {
            return null
        }

        return {
            targetValue: `/tags/${tag.slug}`,
            scope: 'tag-link',
            status: 'unchanged',
            matchedBy: 'slug',
        }
    }

    return null
}

export function collectContentCandidates(content: string): LinkCandidate[] {
    const markdownCandidates = Array.from(content.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g), (match) => match[1])
    const htmlCandidates = Array.from(content.matchAll(/\b(?:src|href)=['"]([^'"]+)['"]/gi), (match) => match[1])
    const values = Array.from(new Set([...markdownCandidates, ...htmlCandidates].filter(Boolean)))

    return values.filter((value): value is string => typeof value === 'string').map((value) => ({
        value,
        sourceKind: getSourceKind(value),
        field: 'content' as const,
    }))
}

export function applyContentCandidateRewrite(input: string, sourceValue: string, targetValue: string) {
    if (!sourceValue || sourceValue === targetValue) {
        return input
    }

    const escapedSource = escapeRegExp(sourceValue)
    const safeTarget = targetValue.replace(/\$/g, '$$$$')

    let output = input.replace(
        new RegExp(`(\\]\\()${escapedSource}(?=(?:\\s+"[^"]*")?\\))`, 'g'),
        `$1${safeTarget}`,
    )

    output = output.replace(
        new RegExp(`((?:href|src)=['"])${escapedSource}(?=['"])`, 'gi'),
        `$1${safeTarget}`,
    )

    return output
}
