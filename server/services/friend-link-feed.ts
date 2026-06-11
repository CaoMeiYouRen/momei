import { XMLParser } from 'fast-xml-parser'
import { dataSource } from '@/server/database'
import { FriendLink } from '@/server/entities/friend-link'
import { type FeedItem, FriendLinkStatus } from '@/types/friend-link'
import logger from '@/server/utils/logger'
import { limiterStorage } from '@/server/database/storage'

const FEED_CACHE_NAMESPACE = 'friend-link-feed'
const FEED_CACHE_TTL_SECONDS = 3600 // 1 hour
const FETCH_TIMEOUT_MS = 8000

interface RssChannel {
    title?: string
    link?: string
    item?: {
        title?: string
        link?: string
        pubDate?: string
        'atom:updated'?: string
        published?: string
    }[] | { title?: string, link?: string, pubDate?: string, 'atom:updated'?: string, published?: string }
}

interface AtomFeed {
    feed?: {
        title?: string
        link?: ({ '@_href'?: string } | string)[]
        entry?: {
            title?: string | { '#text'?: string }
            link?: ({ '@_href'?: string } | string)[]
            published?: string
            updated?: string
        }[]
    }
}

async function fetchXml(url: string): Promise<string | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
        })
        if (!response.ok) {
            return null
        }
        return await response.text()
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

function parseDate(value: string | undefined): string | null {
    if (!value) {
        return null
    }
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function extractAtomLink(link: ({ '@_href'?: string } | string)[] | string | undefined): string | null {
    if (!link) {
        return null
    }
    if (typeof link === 'string') {
        return link
    }
    if (Array.isArray(link)) {
        const first = link[0]
        if (typeof first === 'string') {
            return first
        }
        return first?.['@_href'] ?? null
    }
    // fast-xml-parser may return a single object (not array) when only one <link> element
    if (typeof link === 'object' && '@_href' in link) {
        return link['@_href'] ?? null
    }
    return null
}

function parseRssFeed(xml: string): FeedItem[] {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const doc = parser.parse(xml) as Record<string, any>

    // RSS 2.0 format
    const rss = doc?.rss
    if (rss) {
        const channel: RssChannel = rss.channel || {}
        const siteName = channel.title || ''
        const siteUrl = channel.link || ''
        let items: any[] = []
        if (Array.isArray(channel.item)) {
            items = channel.item
        } else if (channel.item) {
            items = [channel.item]
        }
        return items.slice(0, 5).map((item) => ({
            title: item.title || 'Untitled',
            url: item.link || siteUrl,
            publishedAt: parseDate(item.pubDate || item['atom:updated'] || item.published),
            siteName,
            siteUrl,
        }))
    }

    // Atom format
    const feed: AtomFeed = doc?.feed ? { feed: doc.feed } : {}
    const atom = feed.feed
    if (atom) {
        const siteName = atom.title || ''
        let entries: any[] = []
        if (Array.isArray(atom.entry)) {
            entries = atom.entry
        } else if (atom.entry) {
            entries = [atom.entry]
        }
        return entries.slice(0, 5).map((entry) => ({
            title: typeof entry.title === 'string' ? entry.title : (entry.title?.['#text'] || 'Untitled'),
            url: extractAtomLink(entry.link) || '',
            publishedAt: parseDate(entry.published || entry.updated),
            siteName,
            siteUrl: '',
        }))
    }

    return []
}

export async function getFriendLinkFeeds(): Promise<FeedItem[]> {
    const cacheKey = `${FEED_CACHE_NAMESPACE}:all`

    // Try cache first
    const cached = await limiterStorage.get(cacheKey)
    if (cached) {
        try {
            return JSON.parse(cached)
        } catch {
            /* fall through */
        }
    }

    const repo = dataSource.getRepository(FriendLink)
    const links = await repo.find({
        where: { status: FriendLinkStatus.ACTIVE, showRssFeed: true },
    })

    if (!links.length) {
        await limiterStorage.set(cacheKey, JSON.stringify([]), FEED_CACHE_TTL_SECONDS)
        return []
    }

    const allItems: FeedItem[] = []
    for (const link of links) {
        if (!link.rssUrl) {
            continue
        }
        try {
            const xml = await fetchXml(link.rssUrl)
            if (!xml) {
                continue
            }
            const items = parseRssFeed(xml)
            allItems.push(...items)
        } catch (e) {
            logger.warn(`[FriendLinkFeed] Failed to fetch feed for ${link.name}: ${link.rssUrl}`, e instanceof Error ? e.message : String(e))
        }
    }

    // Sort by publishedAt descending
    allItems.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))

    // Cache result
    await limiterStorage.set(cacheKey, JSON.stringify(allItems), FEED_CACHE_TTL_SECONDS)

    return allItems
}
