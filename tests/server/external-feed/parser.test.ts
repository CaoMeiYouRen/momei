import { describe, expect, it } from 'vitest'
import { parseExternalFeedXml } from '@/server/services/external-feed/parser'

const baseSource = {
    id: 'memo-feed',
    enabled: true,
    provider: 'rss',
    title: 'Memo Feed',
    sourceUrl: 'https://example.com/rss.xml',
    siteUrl: 'https://example.com',
    siteName: null,
    defaultLocale: 'zh-CN',
    localeStrategy: 'inherit-current',
    includeInHome: true,
    badgeLabel: null,
    priority: 0,
    timeoutMs: null,
    cacheTtlSeconds: null,
    staleWhileErrorSeconds: null,
    maxItems: 10,
} as const

describe('parseExternalFeedXml', () => {
    it('parses entity-heavy description nodes without hitting expansion limits', () => {
        const encodedDescription = Array.from({ length: 1200 }, (_, index) => `&lt;p&gt;entry ${index}&lt;/p&gt;`).join('')
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Entity heavy feed</title>
                    <item>
                        <title>Weekly memo</title>
                        <link>https://example.com/posts/1</link>
                        <description>${encodedDescription}</description>
                        <pubDate>Tue, 21 Apr 2026 10:00:00 GMT</pubDate>
                    </item>
                    <item>
                        <title>Later item</title>
                        <link>https://example.com/posts/2</link>
                        <description>&lt;p&gt;later&lt;/p&gt;</description>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, {
            id: 'memo-feed',
            enabled: true,
            provider: 'rss',
            title: 'Memo Feed',
            sourceUrl: 'https://example.com/rss.xml',
            siteUrl: 'https://example.com',
            siteName: null,
            defaultLocale: 'zh-CN',
            localeStrategy: 'inherit-current',
            includeInHome: true,
            badgeLabel: null,
            priority: 0,
            timeoutMs: null,
            cacheTtlSeconds: null,
            staleWhileErrorSeconds: null,
            maxItems: 1,
        })

        expect(items).toHaveLength(1)
        expect(items[0]?.title).toBe('Weekly memo')
        expect(items[0]?.summary).toContain('entry 0')
        expect(items[0]?.summary?.length).toBeLessThanOrEqual(240)
    })

    it('keeps title empty when feed item does not provide one', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Untitled feed</title>
                    <item>
                        <link>https://example.com/posts/untitled</link>
                        <description>Untitled entry</description>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, {
            id: 'untitled-feed',
            enabled: true,
            provider: 'rss',
            title: 'Untitled Feed',
            sourceUrl: 'https://example.com/rss.xml',
            siteUrl: 'https://example.com',
            siteName: null,
            defaultLocale: 'zh-CN',
            localeStrategy: 'inherit-current',
            includeInHome: true,
            badgeLabel: null,
            priority: 0,
            timeoutMs: null,
            cacheTtlSeconds: null,
            staleWhileErrorSeconds: null,
            maxItems: 1,
        })

        expect(items).toHaveLength(1)
        expect(items[0]?.title).toBe('')
        expect(items[0]?.url).toBe('https://example.com/posts/untitled')
    })

    it('decodes numeric character references and named entities in descriptions', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Numeric feed</title>
                    <item>
                        <title>Numeric item</title>
                        <link>https://example.com/posts/numeric</link>
                        <description>&#x41;&#66;&amp;lt;GT&amp;gt;</description>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]?.summary).toBe('AB')
    })

    it('resolves relative links against source site URL', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Relative feed</title>
                    <item>
                        <title>Relative item</title>
                        <link>/posts/relative</link>
                        <description>desc</description>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]?.url).toBe('https://example.com/posts/relative')
    })

    it('keeps raw link when URL resolution fails', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Bad link feed</title>
                    <item>
                        <title>Bad link item</title>
                        <link>http://</link>
                        <description>desc</description>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]?.url).toBe('http://')
    })

    it('extracts cover image from media:content and media:thumbnail', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Media feed</title>
                    <item>
                        <title>Media item</title>
                        <link>https://example.com/posts/media</link>
                        <description>desc</description>
                        <media:content url="https://example.com/media.jpg" xmlns:media="http://search.yahoo.com/mrss/"/>
                        <media:thumbnail url="https://example.com/thumb.jpg" xmlns:media="http://search.yahoo.com/mrss/"/>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]?.coverImage).toBe('https://example.com/media.jpg')
    })

    it('falls back to itunes:image when no media content is present', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>iTunes feed</title>
                    <item>
                        <title>Podcast item</title>
                        <link>https://example.com/posts/podcast</link>
                        <description>desc</description>
                        <itunes:image href="https://example.com/podcast.jpg" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"/>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]?.coverImage).toBe('https://example.com/podcast.jpg')
    })

    it('keeps cover image null when no image candidates exist', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Plain feed</title>
                    <item>
                        <title>Plain item</title>
                        <link>https://example.com/posts/plain</link>
                        <description>desc</description>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]?.coverImage).toBeNull()
    })

    it('parses atom feeds with author objects and xml:lang metadata', () => {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-US">
                <title>Atom feed</title>
                <entry>
                    <title>Atom entry</title>
                    <link href="https://example.com/atom/1"/>
                    <id>tag:example.com,2026:1</id>
                    <published>2026-04-01T10:00:00Z</published>
                    <updated>2026-04-02T10:00:00Z</updated>
                    <author>
                        <name>Atom Author</name>
                    </author>
                    <summary type="html">&lt;p&gt;Atom summary&lt;/p&gt;</summary>
                </entry>
            </feed>`

        const items = parseExternalFeedXml(xml, {
            ...baseSource,
            provider: 'rss',
            sourceUrl: 'https://example.com/atom.xml',
            siteUrl: 'https://example.com',
        })

        expect(items).toHaveLength(1)
        expect(items[0]).toMatchObject({
            title: 'Atom entry',
            url: 'https://example.com/atom/1',
            authorName: 'Atom Author',
            language: 'en-US',
            summary: 'Atom summary',
            id: 'tag:example.com,2026:1',
        })
        expect(items[0]?.publishedAt).toBe('2026-04-01T10:00:00.000Z')
    })

    it('falls back to updated time and empty summary for atom entries without published', () => {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom">
                <title>Minimal atom</title>
                <entry>
                    <title>Minimal entry</title>
                    <link href="https://example.com/atom/2"/>
                    <updated>2026-05-01T10:00:00Z</updated>
                </entry>
            </feed>`

        const items = parseExternalFeedXml(xml, {
            ...baseSource,
            provider: 'rss',
            sourceUrl: 'https://example.com/atom.xml',
            siteUrl: 'https://example.com',
        })

        expect(items[0]?.publishedAt).toBe('2026-05-01T10:00:00.000Z')
        expect(items[0]?.summary).toBeNull()
        expect(items[0]?.authorName).toBeNull()
        expect(items[0]?.id).toMatch(/^[a-f0-9]{40}$/u)
    })

    it('throws a 500 error for unsupported feed formats', () => {
        const xml = '<root><not-a-feed/></root>'

        expect(() => parseExternalFeedXml(xml, baseSource)).toThrow(
            expect.objectContaining({
                statusCode: 500,
                statusMessage: 'Unsupported external feed format',
            }),
        )
    })

    it('tolerates malformed XML by returning empty item list', () => {
        const xml = '<rss><channel><item>unclosed'

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items).toEqual([])
    })

    it('normalizes CDATA objects and object-form text values', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>CDATA feed</title>
                    <language>en</language>
                    <item>
                        <title><![CDATA[CDATA Title]]></title>
                        <link>https://example.com/posts/cdata</link>
                        <description><![CDATA[<p>CDATA summary</p>]]></description>
                        <guid isPermaLink="false">cdata-guid</guid>
                        <author>example@example.com (CDATA Author)</author>
                    </item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, baseSource)

        expect(items[0]).toMatchObject({
            title: 'CDATA Title',
            summary: 'CDATA summary',
            id: 'cdata-guid',
            language: 'en',
            authorName: 'example@example.com (CDATA Author)',
        })
    })

    it('uses channel language and maxItems slice for rss items', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Sliced feed</title>
                    <language>ja-JP</language>
                    <item><title>One</title><link>https://example.com/1</link></item>
                    <item><title>Two</title><link>https://example.com/2</link></item>
                    <item><title>Three</title><link>https://example.com/3</link></item>
                </channel>
            </rss>`

        const items = parseExternalFeedXml(xml, {
            ...baseSource,
            maxItems: 2,
        })

        expect(items).toHaveLength(2)
        expect(items[0]?.language).toBe('ja-JP')
    })
})
