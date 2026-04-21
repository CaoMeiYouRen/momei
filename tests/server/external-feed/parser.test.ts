import { describe, expect, it } from 'vitest'
import { parseExternalFeedXml } from '@/server/services/external-feed/parser'

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
})
