import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetRepository = vi.fn()
const mockFind = vi.fn()
const mockStorageGet = vi.fn()
const mockStorageSet = vi.fn()
const mockLoggerWarn = vi.fn()

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: (...args: any[]) => mockGetRepository(...args),
    },
}))

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        get: (...args: any[]) => mockStorageGet(...args),
        set: (...args: any[]) => mockStorageSet(...args),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        warn: (...args: any[]) => mockLoggerWarn(...args),
        error: vi.fn(),
    },
}))

// We import after mocks are set up
const { getFriendLinkFeeds } = await vi.importActual<typeof import('@/server/services/friend-link-feed')>('@/server/services/friend-link-feed')

// Helper: create a minimal mock FriendLink entity
function mockLink(overrides: Partial<{
    id: string
    name: string
    url: string
    rssUrl: string
    status: string
    showRssFeed: boolean
}> = {}) {
    return {
        id: overrides.id || 'link-1',
        name: overrides.name || 'Test Blog',
        url: overrides.url || 'https://test.example.com',
        rssUrl: overrides.rssUrl ?? 'https://test.example.com/feed.xml',
        status: overrides.status ?? 'active',
        showRssFeed: overrides.showRssFeed ?? true,
    }
}

// Valid RSS 2.0 XML with 2 items
const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <link>https://test.example.com</link>
    <item>
      <title>Post One</title>
      <link>https://test.example.com/post-1</link>
      <pubDate>Mon, 02 Jun 2025 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Post Two</title>
      <link>https://test.example.com/post-2</link>
      <pubDate>Mon, 01 Jun 2025 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

// Valid RSS 2.0 with single item (not array)
const rssSingleItemXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Solo Blog</title>
    <link>https://solo.example.com</link>
    <item>
      <title>Only Post</title>
      <link>https://solo.example.com/only</link>
      <pubDate>Wed, 04 Jun 2025 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

// Valid Atom XML with 2 entries
const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <title>Atom Blog</title>
  <entry>
    <title>Atom Post One</title>
    <link href="https://atom.example.com/post-1"/>
    <published>2025-06-02T10:00:00Z</published>
  </entry>
  <entry>
    <title>Atom Post Two</title>
    <link href="https://atom.example.com/post-2"/>
    <published>2025-06-01T10:00:00Z</published>
  </entry>
</feed>`

describe('getFriendLinkFeeds', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetRepository.mockReturnValue({ find: mockFind })
        mockStorageGet.mockResolvedValue(null)
        mockStorageSet.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('cache behavior', () => {
        it('returns cached result when cache is valid', async () => {
            const cachedItems = [
                { title: 'Cached Post', url: 'https://cached.example.com/post', publishedAt: '2025-06-01T00:00:00.000Z', siteName: 'Cached Blog', siteUrl: 'https://cached.example.com' },
            ]
            mockStorageGet.mockResolvedValue(JSON.stringify(cachedItems))

            const result = await getFriendLinkFeeds()

            expect(result).toEqual(cachedItems)
            expect(mockGetRepository).not.toHaveBeenCalled()
        })

        it('fetches fresh when cache is null', async () => {
            mockStorageGet.mockResolvedValue(null)
            mockFind.mockResolvedValue([])

            const result = await getFriendLinkFeeds()

            expect(result).toEqual([])
            expect(mockGetRepository).toHaveBeenCalled()
        })

        it('fetches fresh when cache JSON is invalid (parse error)', async () => {
            mockStorageGet.mockResolvedValue('not valid json {')
            mockFind.mockResolvedValue([])

            const result = await getFriendLinkFeeds()

            expect(result).toEqual([])
            expect(mockGetRepository).toHaveBeenCalled()
        })
    })

    describe('empty link list', () => {
        it('returns empty array and caches empty result when no active links', async () => {
            mockFind.mockResolvedValue([])

            const result = await getFriendLinkFeeds()

            expect(result).toEqual([])
            expect(mockStorageSet).toHaveBeenCalledWith(
                expect.stringContaining('friend-link-feed'),
                JSON.stringify([]),
                expect.any(Number),
            )
        })
    })

    describe('RSS feed fetching', () => {
        it('parses RSS 2.0 feed with multiple items', async () => {
            mockFind.mockResolvedValue([mockLink()])
            // Mock fetch to return RSS XML
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(rssXml),
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({
                title: 'Post One',
                url: 'https://test.example.com/post-1',
                siteName: 'Test Blog',
                siteUrl: 'https://test.example.com',
            })
            expect(result[1]).toMatchObject({
                title: 'Post Two',
                url: 'https://test.example.com/post-2',
            })
            // Sorted by publishedAt descending
            expect(new Date(result[0].publishedAt!).getTime())
                .toBeGreaterThanOrEqual(new Date(result[1].publishedAt!).getTime())
        })

        it('parses RSS feed with single item (not wrapped in array)', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(rssSingleItemXml),
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                title: 'Only Post',
                siteName: 'Solo Blog',
            })
        })

        it('parses Atom feed with multiple entries', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(atomXml),
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({
                title: 'Atom Post One',
                url: 'https://atom.example.com/post-1',
                siteName: 'Atom Blog',
            })
        })

        it('truncates to 5 items when feed has more', async () => {
            const manyItems = Array.from({ length: 10 }, (_, i) => `
              <item>
                <title>Post ${i}</title>
                <link>https://test.example.com/post-${i}</link>
                <pubDate>Mon, 0${(i % 9) + 1} Jun 2025 10:00:00 GMT</pubDate>
              </item>`).join('\n')

            const largeRssXml = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Big Blog</title><link>https://big.example.com</link>
${manyItems}
</channel></rss>`

            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(largeRssXml),
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result).toHaveLength(5)
        })
    })

    describe('error handling and graceful degradation', () => {
        it('skips links without rssUrl', async () => {
            mockFind.mockResolvedValue([
                { ...mockLink({ id: 'link-1' }), rssUrl: null },
                { ...mockLink({ id: 'link-2' }), rssUrl: '' },
                mockLink({ id: 'link-3' }),
            ])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(rssXml),
            } as Response)

            const result = await getFriendLinkFeeds()

            // Only link-3 with valid rssUrl contributed items
            expect(result).toHaveLength(2)
        })

        it('gracefully handles fetch returning non-ok status', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: false,
                status: 404,
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result).toEqual([])
            // Result should be cached as empty
            expect(mockStorageSet).toHaveBeenCalledWith(
                expect.stringContaining('friend-link-feed'),
                JSON.stringify([]),
                expect.any(Number),
            )
        })

        it('gracefully handles fetch throwing network error (fetchXml catches internally)', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

            const result = await getFriendLinkFeeds()

            // fetchXml catches errors internally, returns null, so loop skips this link
            expect(result).toEqual([])
        })

        it('gracefully handles empty XML response', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('<empty/>'),
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result).toEqual([])
        })

        it('continues fetching remaining links after one fails (fetchXml catches internally)', async () => {
            mockFind.mockResolvedValue([
                mockLink({ id: 'bad', rssUrl: 'https://bad.example.com/feed.xml' }),
                mockLink({ id: 'good', rssUrl: 'https://good.example.com/feed.xml' }),
            ])

            let callCount = 0
            vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
                callCount++
                if ((url as unknown as string).includes('bad')) {
                    return Promise.reject(new Error('Bad link'))
                }
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(rssXml),
                } as Response)
            })

            const result = await getFriendLinkFeeds()

            // Only good link contributed items (2 from rssXml)
            expect(result).toHaveLength(2)
            // Both links were attempted
            expect(callCount).toBe(2)
        })
    })

    describe('sorting', () => {
        it('sorts results by publishedAt descending', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(rssXml), // Post One: 02 Jun, Post Two: 01 Jun
            } as Response)

            const result = await getFriendLinkFeeds()

            expect(result[0].publishedAt).toBeDefined()
            expect(result[1].publishedAt).toBeDefined()
            // Post One (Jun 02) should come before Post Two (Jun 01)
            expect(new Date(result[0].publishedAt!).getTime())
                .toBeGreaterThan(new Date(result[1].publishedAt!).getTime())
        })

        it('handles null publishedAt in sorting', async () => {
            const noDateXml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>NoDate Blog</title>
    <link>https://nodate.example.com</link>
    <item>
      <title>No Date Post</title>
      <link>https://nodate.example.com/1</link>
    </item>
    <item>
      <title>Dated Post</title>
      <link>https://nodate.example.com/2</link>
      <pubDate>Mon, 02 Jun 2025 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(noDateXml),
            } as Response)

            const result = await getFriendLinkFeeds()

            // Should not crash on null dates
            expect(result).toHaveLength(2)
        })
    })

    describe('caching', () => {
        it('caches aggregated result after successful fetch', async () => {
            mockFind.mockResolvedValue([mockLink()])
            vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(rssXml),
            } as Response)

            await getFriendLinkFeeds()

            expect(mockStorageSet).toHaveBeenCalledWith(
                expect.stringContaining('friend-link-feed'),
                expect.stringContaining('Post One'),
                expect.any(Number),
            )
        })
    })
})
