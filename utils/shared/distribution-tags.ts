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
export type WechatSyncContentProfile = 'default' | 'weibo' | 'xiaohongshu'

type WechatSyncPlatformSource = string | null | undefined

type WechatSyncAccountPlatformSource = Pick<WechatSyncAccount, 'id' | 'type' | 'title' | 'displayName' | 'supportTypes'>

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

function matchesWechatSyncPlatform(value: string, platform: 'weibo' | 'bilibili' | 'xiaohongshu' | 'twitter' | 'memos') {
    switch (platform) {
        case 'weibo':
            return /weibo|微博/iu.test(value)
        case 'bilibili':
            return /bilibili|哔哩|b站/iu.test(value)
        case 'xiaohongshu':
            return /xiaohongshu|小红书/iu.test(value)
        case 'twitter':
            return /twitter|(?:^|[_\s-])x(?:$|[_\s-])/iu.test(value)
        case 'memos':
            return /memos/iu.test(value)
    }
}

function resolveWechatSyncPlatformCandidates(source: WechatSyncPlatformSource | WechatSyncAccountPlatformSource) {
    if (typeof source === 'string' || source === null || source === undefined) {
        return source ? [source] : []
    }

    return [
        source.type,
        source.id,
        ...(source.supportTypes || []),
        source.title,
        source.displayName,
    ].filter((value): value is string => Boolean(value?.trim()))
}

function resolveWechatSyncPlatformFamily(source: WechatSyncPlatformSource | WechatSyncAccountPlatformSource) {
    const candidates = resolveWechatSyncPlatformCandidates(source)

    for (const candidate of candidates) {
        if (matchesWechatSyncPlatform(candidate, 'weibo')) {
            return 'weibo'
        }
        if (matchesWechatSyncPlatform(candidate, 'bilibili')) {
            return 'bilibili'
        }
        if (matchesWechatSyncPlatform(candidate, 'xiaohongshu')) {
            return 'xiaohongshu'
        }
        if (matchesWechatSyncPlatform(candidate, 'twitter')) {
            return 'twitter'
        }
        if (matchesWechatSyncPlatform(candidate, 'memos')) {
            return 'memos'
        }
    }

    return normalizePlatformType(candidates[0])
}

export function resolveWechatSyncTagRenderMode(platformType: string | null | undefined): DistributionTagRenderMode {
    const normalizedType = resolveWechatSyncPlatformFamily(platformType)

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

export function resolveWechatSyncContentProfile(platformType: string | null | undefined): WechatSyncContentProfile {
    const normalizedType = resolveWechatSyncPlatformFamily(platformType)

    if (normalizedType.includes('weibo')) {
        return 'weibo'
    }

    if (normalizedType.includes('xiaohongshu')) {
        return 'xiaohongshu'
    }

    return 'default'
}

export function resolveWechatSyncAccountTagRenderMode(account: WechatSyncAccountPlatformSource) {
    return resolveWechatSyncTagRenderMode(resolveWechatSyncPlatformFamily(account))
}

export function resolveWechatSyncAccountContentProfile(account: WechatSyncAccountPlatformSource) {
    return resolveWechatSyncContentProfile(resolveWechatSyncPlatformFamily(account))
}

export function groupWechatSyncAccountsByTagRenderMode(accounts: readonly WechatSyncAccount[]) {
    const groupedAccounts = new Map<string, {
        renderMode: DistributionTagRenderMode
        contentProfile: WechatSyncContentProfile
        accounts: WechatSyncAccount[]
    }>()

    for (const account of accounts) {
        const renderMode = resolveWechatSyncAccountTagRenderMode(account)
        const contentProfile = resolveWechatSyncAccountContentProfile(account)
        const groupKey = `${renderMode}:${contentProfile}`
        const currentGroup = groupedAccounts.get(groupKey)
        if (currentGroup) {
            currentGroup.accounts.push(account)
        } else {
            groupedAccounts.set(groupKey, {
                renderMode,
                contentProfile,
                accounts: [account],
            })
        }
    }

    return Array.from(groupedAccounts.values())
}
