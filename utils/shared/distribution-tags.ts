import type { WechatSyncAccount } from './wechatsync'

export interface DistributionTagSource {
    id?: string | number | null
    slug?: string | null
    name?: string | null
    translationId?: string | null
    language?: string | null
}

export interface NormalizedDistributionTag {
    clusterKey: string
    rawName: string
    sanitizedName: string
}

export type DistributionTagRenderMode = 'leading' | 'wrapped' | 'none'

const DEFAULT_MAX_TAG_COUNT = 5
const DEFAULT_MAX_TAG_LENGTH = 24

function normalizeToken(value: unknown) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return null
    }

    const normalizedValue = String(value).trim()
    return normalizedValue || null
}

export function sanitizeDistributionTagName(name: string | null | undefined, maxLength = DEFAULT_MAX_TAG_LENGTH) {
    if (!name) {
        return ''
    }

    const sanitizedName = name
        .trim()
        .replace(/^[#＃]+/u, '')
        .replace(/[#＃]+$/u, '')
        .replace(/[\r\n\t\f\v]+/gu, ' ')
        .replace(/["'“”‘’()（）<>《》`/\\|]+/gu, ' ')
        .replace(/[\s_-]+/gu, '-')
        .replace(/^[._-]+/u, '')
        .replace(/[._-]+$/u, '')
        .trim()

    if (!sanitizedName) {
        return ''
    }

    return sanitizedName.slice(0, maxLength).replace(/[._-]+$/u, '')
}

export function resolveDistributionTagClusterKey(tag: DistributionTagSource) {
    return normalizeToken(tag.translationId)
        || normalizeToken(tag.slug)
        || normalizeToken(tag.id)
        || sanitizeDistributionTagName(tag.name)
        || null
}

export function normalizeDistributionTags(
    tags: readonly DistributionTagSource[] | null | undefined,
    options?: {
        maxCount?: number
        maxLength?: number
    },
) {
    const maxCount = options?.maxCount ?? DEFAULT_MAX_TAG_COUNT
    const maxLength = options?.maxLength ?? DEFAULT_MAX_TAG_LENGTH
    const normalizedTags: NormalizedDistributionTag[] = []
    const seenClusters = new Set<string>()

    for (const tag of tags || []) {
        const clusterKey = resolveDistributionTagClusterKey(tag)
        const rawName = normalizeToken(tag.name)
        const sanitizedName = sanitizeDistributionTagName(rawName, maxLength)

        if (!clusterKey || !rawName || !sanitizedName || seenClusters.has(clusterKey)) {
            continue
        }

        seenClusters.add(clusterKey)
        normalizedTags.push({
            clusterKey,
            rawName,
            sanitizedName,
        })

        if (normalizedTags.length >= maxCount) {
            break
        }
    }

    return normalizedTags
}

export function renderDistributionTags(
    tags: readonly NormalizedDistributionTag[],
    mode: DistributionTagRenderMode,
) {
    if (mode === 'none') {
        return ''
    }

    return tags
        .map((tag) => mode === 'wrapped'
            ? `#${tag.sanitizedName}#`
            : `#${tag.sanitizedName}`)
        .join(' ')
        .trim()
}

function normalizePlatformType(value: string | null | undefined) {
    return value?.trim().toLowerCase().replace(/[\s-]+/gu, '_') || ''
}

export function resolveWechatSyncTagRenderMode(platformType: string | null | undefined): DistributionTagRenderMode {
    const normalizedType = normalizePlatformType(platformType)

    if (!normalizedType) {
        return 'none'
    }

    if (normalizedType === 'x' || normalizedType.includes('twitter') || normalizedType.includes('xiaohongshu') || normalizedType.includes('memos')) {
        return 'leading'
    }

    if (normalizedType.includes('bilibili')) {
        return 'wrapped'
    }

    if (normalizedType.includes('weibo')) {
        return 'none'
    }

    return 'none'
}

export function groupWechatSyncAccountsByTagRenderMode(accounts: readonly WechatSyncAccount[]) {
    const groupedAccounts = new Map<DistributionTagRenderMode, WechatSyncAccount[]>()

    for (const account of accounts) {
        const renderMode = resolveWechatSyncTagRenderMode(account.type || account.id)
        const currentGroup = groupedAccounts.get(renderMode)
        if (currentGroup) {
            currentGroup.push(account)
        } else {
            groupedAccounts.set(renderMode, [account])
        }
    }

    return Array.from(groupedAccounts.entries()).map(([renderMode, groupedWechatSyncAccounts]) => ({
        renderMode,
        accounts: groupedWechatSyncAccounts,
    }))
}
