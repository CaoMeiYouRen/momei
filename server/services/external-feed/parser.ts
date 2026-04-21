import { createHash } from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'
import { convert } from 'html-to-text'
import type { ExternalFeedItem, ExternalFeedSourceConfig } from '@/types/external-feed'
import { normalizeOptionalString } from '@/utils/shared/coerce'

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    parseTagValue: false,
    stopNodes: ['*.description', '*.content:encoded', '*.summary', '*.content'],
})

const DEFAULT_SOURCE_MAX_ITEMS = 10
const SUMMARY_SOURCE_SLICE_LIMIT = 12000

function unwrapCdata(value: string) {
    if (value.startsWith('<![CDATA[') && value.endsWith(']]>')) {
        return value.slice(9, -3)
    }

    return value
}

function decodeBasicXmlEntities(value: string) {
    let decodedValue = value

    for (let index = 0; index < 2; index += 1) {
        const nextValue = decodedValue
            .replace(/&#x([0-9a-fA-F]{1,6});/g, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
            .replace(/&#([0-9]{1,7});/g, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 10)))
            .replace(/&(lt|gt|quot|apos|amp);/g, (entity) => {
                switch (entity) {
                    case '&lt;':
                        return '<'
                    case '&gt;':
                        return '>'
                    case '&quot;':
                        return '"'
                    case '&apos;':
                        return '\''
                    case '&amp;':
                        return '&'
                    default:
                        return entity
                }
            })

        if (nextValue === decodedValue) {
            return nextValue
        }

        decodedValue = nextValue
    }

    return decodedValue
}

function ensureArray<T>(value: T | T[] | undefined | null) {
    if (!value) {
        return []
    }

    return Array.isArray(value) ? value : [value]
}

function createStableHash(value: string) {
    return createHash('sha1').update(value).digest('hex')
}

function resolveTextValue(value: unknown): string | null {
    if (typeof value === 'string') {
        return normalizeOptionalString(unwrapCdata(value))
    }

    if (typeof value === 'number') {
        return String(value)
    }

    if (value && typeof value === 'object') {
        if ('#text' in value && typeof value['#text'] === 'string') {
            return normalizeOptionalString(unwrapCdata(value['#text']))
        }

        if ('__cdata' in value && typeof value.__cdata === 'string') {
            return normalizeOptionalString(unwrapCdata(value.__cdata))
        }
    }

    return null
}

function resolveFeedLink(rawLink: unknown, baseUrl: string) {
    if (typeof rawLink === 'string') {
        try {
            return new URL(rawLink, baseUrl).toString()
        } catch {
            return normalizeOptionalString(rawLink)
        }
    }

    const firstLink = ensureArray(rawLink)[0]
    if (firstLink && typeof firstLink === 'object' && '@_href' in firstLink && typeof firstLink['@_href'] === 'string') {
        try {
            return new URL(firstLink['@_href'], baseUrl).toString()
        } catch {
            return normalizeOptionalString(firstLink['@_href'])
        }
    }

    return null
}

function resolveCoverImage(entry: Record<string, unknown>) {
    const mediaContent = ensureArray(entry['media:content'])
    const mediaThumbnail = ensureArray(entry['media:thumbnail'])

    for (const candidate of [...mediaContent, ...mediaThumbnail]) {
        if (candidate && typeof candidate === 'object' && '@_url' in candidate && typeof candidate['@_url'] === 'string') {
            return candidate['@_url']
        }
    }

    const itunesImage = entry['itunes:image']
    if (itunesImage && typeof itunesImage === 'object' && '@_href' in itunesImage && typeof itunesImage['@_href'] === 'string') {
        return itunesImage['@_href']
    }

    return null
}

function extractSummary(...candidates: unknown[]) {
    for (const candidate of candidates) {
        const textValue = resolveTextValue(candidate)

        if (!textValue) {
            continue
        }

        const plainText = convert(decodeBasicXmlEntities(textValue.slice(0, SUMMARY_SOURCE_SLICE_LIMIT)), {
            wordwrap: false,
            selectors: [
                { selector: 'img', format: 'skip' },
                { selector: 'a', options: { ignoreHref: true } },
            ],
        }).replace(/\s+/g, ' ').trim()

        if (plainText) {
            return plainText.slice(0, 240)
        }
    }

    return null
}

function normalizeRssItems(channel: Record<string, unknown>, source: ExternalFeedSourceConfig): ExternalFeedItem[] {
    const items = ensureArray(channel.item).slice(0, source.maxItems ?? DEFAULT_SOURCE_MAX_ITEMS)
    const channelLanguage = resolveTextValue(channel.language)
    const baseUrl = source.siteUrl ?? source.sourceUrl

    return items.map((item, index) => {
        const entry = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
        const url = resolveFeedLink(entry.link, baseUrl) ?? source.sourceUrl
        const canonicalUrl = url
        const title = resolveTextValue(entry.title) ?? ''
        const publishedRaw = resolveTextValue(entry.pubDate) ?? resolveTextValue(entry.published)
        const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null
        const summary = extractSummary(entry.description, entry['content:encoded'], entry.summary)
        const guid = resolveTextValue(entry.guid)
        const entryLanguage = resolveTextValue(entry['dc:language']) ?? channelLanguage

        return {
            id: guid ?? createStableHash(`${source.id}:${canonicalUrl}:${index}`),
            sourceId: source.id,
            title,
            summary,
            url,
            canonicalUrl,
            publishedAt,
            authorName: resolveTextValue(entry['dc:creator']) ?? resolveTextValue(entry.author),
            language: entryLanguage,
            coverImage: resolveCoverImage(entry),
            sourceTitle: source.title,
            sourceSiteUrl: source.siteUrl,
            sourceBadge: source.badgeLabel ?? (source.provider === 'rsshub' ? 'RSSHub' : 'RSS'),
            dedupeKey: canonicalUrl || guid || createStableHash(`${title}:${publishedAt ?? ''}`),
            priority: source.priority,
        }
    })
}

function normalizeAtomItems(feed: Record<string, unknown>, source: ExternalFeedSourceConfig): ExternalFeedItem[] {
    const entries = ensureArray(feed.entry).slice(0, source.maxItems ?? DEFAULT_SOURCE_MAX_ITEMS)
    const feedLanguage = resolveTextValue(feed['@_xml:lang'])
    const baseUrl = source.siteUrl ?? source.sourceUrl

    return entries.map((entry, index) => {
        const item = typeof entry === 'object' && entry !== null ? entry as Record<string, unknown> : {}
        const url = resolveFeedLink(item.link, baseUrl) ?? source.sourceUrl
        const canonicalUrl = url
        const title = resolveTextValue(item.title) ?? ''
        const publishedRaw = resolveTextValue(item.published) ?? resolveTextValue(item.updated)
        const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null
        const author = item.author && typeof item.author === 'object'
            ? resolveTextValue((item.author as Record<string, unknown>).name)
            : null

        return {
            id: resolveTextValue(item.id) ?? createStableHash(`${source.id}:${canonicalUrl}:${index}`),
            sourceId: source.id,
            title,
            summary: extractSummary(item.summary, item.content),
            url,
            canonicalUrl,
            publishedAt,
            authorName: author,
            language: resolveTextValue(item['@_xml:lang']) ?? feedLanguage,
            coverImage: resolveCoverImage(item),
            sourceTitle: source.title,
            sourceSiteUrl: source.siteUrl,
            sourceBadge: source.badgeLabel ?? (source.provider === 'rsshub' ? 'RSSHub' : 'RSS'),
            dedupeKey: canonicalUrl || createStableHash(`${title}:${publishedAt ?? ''}`),
            priority: source.priority,
        }
    })
}

export function parseExternalFeedXml(xml: string, source: ExternalFeedSourceConfig): ExternalFeedItem[] {
    try {
        const parsed = xmlParser.parse(xml) as Record<string, unknown>

        if (parsed.rss && typeof parsed.rss === 'object' && parsed.rss !== null) {
            const channel = (parsed.rss as Record<string, unknown>).channel
            if (channel && typeof channel === 'object') {
                return normalizeRssItems(channel as Record<string, unknown>, source)
            }
        }

        if (parsed.feed && typeof parsed.feed === 'object' && parsed.feed !== null) {
            return normalizeAtomItems(parsed.feed as Record<string, unknown>, source)
        }

        throw new Error('Unsupported external feed format')
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error instanceof Error ? error.message : 'Failed to parse external feed XML',
        })
    }
}
