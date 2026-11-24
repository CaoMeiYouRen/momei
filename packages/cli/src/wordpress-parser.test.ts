import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { convertWxrItemToMomeiPost, WordPressParser, type WxrItem } from './wordpress-parser'

// 让 WxrItem 在测试文件中可用
export type { WxrItem } from './wordpress-parser'

function createWxrItem(overrides: Partial<WxrItem> = {}): WxrItem {
    return {
        title: 'Test Post',
        'dc:date': '2024-06-15T10:00:00Z',
        'content:encoded': 'Post content here',
        'wp:post_name': 'test-post',
        'wp:status': 'publish',
        'wp:post_type': 'post',
        ...overrides,
    }
}

describe('WordPress Parser - convertWxrItemToMomeiPost: Basic Conversion', () => {
    it('should convert basic WXR item to Momei post', () => {
        const item = createWxrItem()
        const result = convertWxrItemToMomeiPost(item, 'test-post.xml')

        expect(result.title).toBe('Test Post')
        expect(result.content).toBe('Post content here')
        expect(result.slug).toBe('test-post')
        expect(result.status).toBe('published')
        expect(result.createdAt).toBe('2024-06-15T10:00:00.000Z')
        expect(result.publishedAt).toBe('2024-06-15T10:00:00.000Z')
    })

    it('should extract tags from categories with post_tag domain', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'post_tag', '@_nicename': 'javascript', '#text': 'JavaScript' },
                { '@_domain': 'post_tag', '@_nicename': 'vue', '#text': 'Vue.js' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'tags.xml')

        expect(result.tags).toEqual(['JavaScript', 'Vue.js'])
    })

    it('should extract primary category from categories with category domain', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'category', '@_nicename': 'tech', '#text': 'Tech' },
                { '@_domain': 'category', '@_nicename': 'programming', '#text': 'Programming' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'category.xml')

        expect(result.category).toBe('Tech')
    })

    it('should extract both categories and tags simultaneously', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'category', '@_nicename': 'tech', '#text': 'Tech' },
                { '@_domain': 'post_tag', '@_nicename': 'javascript', '#text': 'JavaScript' },
                { '@_domain': 'post_tag', '@_nicename': 'nodejs', '#text': 'Node.js' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'both.xml')

        expect(result.category).toBe('Tech')
        expect(result.tags).toEqual(['JavaScript', 'Node.js'])
    })

    it('should mark draft items correctly', () => {
        const item = createWxrItem({
            'wp:status': 'draft',
            'wp:post_name': 'draft-post',
        })
        const result = convertWxrItemToMomeiPost(item, 'draft.xml')

        expect(result.status).toBe('draft')
    })

    it('should map "publish" status to "published"', () => {
        const item = createWxrItem({
            'wp:status': 'publish',
        })
        const result = convertWxrItemToMomeiPost(item, 'published.xml')

        expect(result.status).toBe('published')
    })

    it('should map "pending" and "private" statuses to "draft"', () => {
        const pendingItem = createWxrItem({
            'wp:status': 'pending',
            'dc:date': undefined,
        })
        const privateItem = createWxrItem({
            'wp:status': 'private',
            'dc:date': undefined,
        })

        expect(convertWxrItemToMomeiPost(pendingItem, 'pending.xml').status).toBe('draft')
        expect(convertWxrItemToMomeiPost(privateItem, 'private.xml').status).toBe('draft')
    })

    it('should use wp:post_name as slug', () => {
        const item = createWxrItem({
            'wp:post_name': 'my-custom-slug',
        })
        const result = convertWxrItemToMomeiPost(item, 'slug.xml')

        expect(result.slug).toBe('my-custom-slug')
    })

    it('should derive slug from title when wp:post_name is missing', () => {
        const item = createWxrItem({
            'wp:post_name': undefined,
            title: 'My Awesome Post Title!',
        })
        const result = convertWxrItemToMomeiPost(item, 'no-slug.xml')

        expect(result.slug).toBe('my-awesome-post-title')
    })

    it('should use excerpt:encoded as summary', () => {
        const item = createWxrItem({
            'excerpt:encoded': 'This is an excerpt for the post',
        })
        const result = convertWxrItemToMomeiPost(item, 'excerpt.xml')

        expect(result.summary).toBe('This is an excerpt for the post')
    })

    it('should set summary to null when excerpt is empty', () => {
        const item = createWxrItem({
            'excerpt:encoded': '',
        })
        const result = convertWxrItemToMomeiPost(item, 'no-excerpt.xml')

        expect(result.summary).toBeNull()
    })

    it('should handle dc:date as primary date source', () => {
        const item = createWxrItem({
            'dc:date': '2023-01-01T00:00:00Z',
            pubDate: 'Mon, 01 Jan 2024 00:00:00 +0000',
            'wp:post_date': '2025-01-01 00:00:00',
        })
        const result = convertWxrItemToMomeiPost(item, 'date-priority.xml')

        // dc:date 应优先
        expect(result.createdAt).toBe('2023-01-01T00:00:00.000Z')
    })

    it('should fall back to pubDate when dc:date is missing', () => {
        const item = createWxrItem({
            'dc:date': undefined,
            pubDate: 'Mon, 01 Jan 2024 00:00:00 +0000',
        })
        const result = convertWxrItemToMomeiPost(item, 'pubdate.xml')

        expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })

    it('should fall back to wp:post_date_gmt when dc:date and pubDate are missing', () => {
        const item = createWxrItem({
            'dc:date': undefined,
            pubDate: undefined,
            'wp:post_date_gmt': '2024-06-15 00:00:00',
        })
        const result = convertWxrItemToMomeiPost(item, 'wp-date.xml')

        expect(result.createdAt).toBe('2024-06-15T00:00:00.000Z')
    })

    it('should set status to draft when published but no date is available', () => {
        const item = createWxrItem({
            'dc:date': undefined,
            pubDate: undefined,
            'wp:post_date': undefined,
            'wp:post_date_gmt': undefined,
            'wp:status': 'publish',
        })
        const result = convertWxrItemToMomeiPost(item, 'no-date.xml')

        expect(result.status).toBe('draft')
        expect(result.createdAt).toBeUndefined()
    })

    it('should set updatedAt from wp:post_modified_gmt', () => {
        const item = createWxrItem({
            'wp:post_modified_gmt': '2024-07-01 12:00:00',
        })
        const result = convertWxrItemToMomeiPost(item, 'updated.xml')

        expect(result.updatedAt).toBe('2024-07-01T12:00:00.000Z')
    })

    it('should use nicename as fallback when category text is missing', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'category', '@_nicename': 'uncategorized', '#text': '' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'cat-fallback.xml')

        expect(result.category).toBe('uncategorized')
    })

    it('should handle untitled posts', () => {
        const item = createWxrItem({
            title: undefined,
            'wp:post_name': 'post-1',
        })
        const result = convertWxrItemToMomeiPost(item, 'untitled.xml')

        expect(result.title).toBe('Untitled')
    })

    it('should set default language from channelLanguage', () => {
        const item = createWxrItem()
        const result = convertWxrItemToMomeiPost(item, 'lang.xml', 'en-US')

        expect(result.language).toBe('en-US')
    })

    it('should default language to zh-CN when not provided', () => {
        const item = createWxrItem()
        const result = convertWxrItemToMomeiPost(item, 'default-lang.xml')

        expect(result.language).toBe('zh-CN')
    })

    it('should set visibility to public', () => {
        const item = createWxrItem()
        const result = convertWxrItemToMomeiPost(item, 'public.xml')

        expect(result.visibility).toBe('public')
    })

    it('should handle empty content:encoded', () => {
        const item = createWxrItem({
            'content:encoded': '',
        })
        const result = convertWxrItemToMomeiPost(item, 'empty-content.xml')

        expect(result.content).toBe('')
    })

    it('should skip post_format categories (not treated as tags)', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'category', '@_nicename': 'tech', '#text': 'Tech' },
                { '@_domain': 'post_tag', '@_nicename': 'javascript', '#text': 'JavaScript' },
                { '@_domain': 'post_format', '@_nicename': 'post-format-gallery', '#text': 'Gallery' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'format.xml')

        expect(result.category).toBe('Tech')
        expect(result.tags).toEqual(['JavaScript'])
        // post_format 不应出现在任何字段中
    })

    it('should derive Chinese slug from Chinese title', () => {
        const item = createWxrItem({
            'wp:post_name': undefined,
            title: '我的第一篇博客文章',
        })
        const result = convertWxrItemToMomeiPost(item, 'chinese.xml')

        expect(result.slug).toBe('我的第一篇博客文章')
    })

    it('should handle category without text content using nicename', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'category', '@_nicename': 'tech' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'cat-nicename.xml')

        expect(result.category).toBe('tech')
    })

    it('should return null category when no category domain exists', () => {
        const item = createWxrItem({
            category: [
                { '@_domain': 'post_tag', '@_nicename': 'javascript', '#text': 'JavaScript' },
            ],
        })
        const result = convertWxrItemToMomeiPost(item, 'no-cat.xml')

        expect(result.category).toBeNull()
    })
})

describe('WordPress Parser - convertWxrItemToMomeiPost: Edge Cases', () => {
    it('should handle undefined category field', () => {
        const item = createWxrItem({
            category: undefined,
        })
        const result = convertWxrItemToMomeiPost(item, 'no-cats.xml')

        expect(result.category).toBeNull()
        expect(result.tags).toBeUndefined()
    })

    it('should handle single category object (not array)', () => {
        // fast-xml-parser 使用 isArray 确保 category 始终为数组，
        // 但为了防御性编程仍处理单对象 case
        const item = createWxrItem({
            category: { '@_domain': 'category', '@_nicename': 'tech', '#text': 'Tech' },
        })
        const result = convertWxrItemToMomeiPost(item, 'single-cat.xml')

        expect(result.category).toBe('Tech')
    })

    it('should handle undefined wp:post_type (assume post)', () => {
        const item = createWxrItem({
            'wp:post_type': undefined,
        })
        const result = convertWxrItemToMomeiPost(item, 'no-type.xml')

        expect(result.title).toBe('Test Post')
        // 不应报错，应正常解析
    })

    it('should derive slug from title when both wp:post_name and title are available', () => {
        const item = createWxrItem({
            'wp:post_name': 'explicit-slug',
        })
        const result = convertWxrItemToMomeiPost(item, 'slug-priority.xml')

        // wp:post_name 应优先于标题派生
        expect(result.slug).toBe('explicit-slug')
    })

    it('should use translationId as null for all WordPress posts', () => {
        const item = createWxrItem()
        const result = convertWxrItemToMomeiPost(item, 'translation.xml')

        expect(result.translationId).toBeNull()
    })
})

const WXR_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
    <title>Demo</title>
    <language>en-US</language>
    <item>
        <title>Published Post</title>
        <dc:date>2024-06-15T10:00:00Z</dc:date>
        <content:encoded><![CDATA[Hello world]]></content:encoded>
        <wp:post_name>published-post</wp:post_name>
        <wp:status>publish</wp:status>
        <wp:post_type>post</wp:post_type>
    </item>
    <item>
        <title>About Page</title>
        <wp:post_name>about</wp:post_name>
        <wp:status>publish</wp:status>
        <wp:post_type>page</wp:post_type>
    </item>
    <item>
        <title>No Slug</title>
        <dc:date>2024-06-16T00:00:00Z</dc:date>
        <wp:post_id>42</wp:post_id>
        <wp:status>draft</wp:status>
        <wp:post_type>post</wp:post_type>
    </item>
</channel>
</rss>`

async function withWxrDir(files: Record<string, string>, run: (directory: string) => Promise<void>) {
    const directory = await mkdtemp(join(tmpdir(), 'momei-wxr-'))

    try {
        for (const [name, content] of Object.entries(files)) {
            await writeFile(join(directory, name), content, 'utf8')
        }

        await run(directory)
    } finally {
        await rm(directory, { force: true, recursive: true })
    }
}

describe('WordPressParser - parse: 文件与目录入口', () => {
    it('直接传入 WXR 文件时解析并跳过非 post 条目', async () => {
        await withWxrDir({ 'export.xml': WXR_FIXTURE }, async (directory) => {
            const results = await new WordPressParser().parse(join(directory, 'export.xml'))

            expect(results).toHaveLength(2)
            expect(results.map((entry) => entry.post.title)).toEqual(['Published Post', 'No Slug'])
            expect(results[0]?.relativeFile).toBe('published-post.xml')
            expect(results[1]?.relativeFile).toBe('post-42.xml')
        })
    })

    it('传入目录时取第一个 XML 文件并输出 verbose 日志', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

        try {
            await withWxrDir({ 'a.xml': WXR_FIXTURE }, async (directory) => {
                const results = await new WordPressParser().parse(directory, true)

                expect(results).toHaveLength(2)
                expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 XML file(s)'))
                expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping non-post item'))
            })
        } finally {
            logSpy.mockRestore()
        }
    })

    it('目录中没有 XML 文件时报错', async () => {
        await withWxrDir({ 'readme.txt': 'no xml here' }, async (directory) => {
            await expect(new WordPressParser().parse(directory)).rejects.toThrow(/No XML files found in directory/)
        })
    })

    it('路径既不是文件也不是目录时报错', async () => {
        await expect(new WordPressParser().parse(join(tmpdir(), 'momei-missing-wxr-entry'))).rejects.toThrow(/neither a valid WXR XML file nor a directory/)
    })

    it('缺少 rss/channel 时报错', async () => {
        await withWxrDir({ 'broken.xml': '<?xml version="1.0"?><html></html>' }, async (directory) => {
            await expect(new WordPressParser().parse(directory)).rejects.toThrow(/missing <rss><channel> structure/)
        })
    })

    it('channel 无 item 时返回空数组并输出 verbose 提示', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

        try {
            await withWxrDir({ 'empty.xml': '<rss><channel><title>Empty</title></channel></rss>' }, async (directory) => {
                const results = await new WordPressParser().parse(join(directory, 'empty.xml'), true)

                expect(results).toEqual([])
                expect(logSpy).toHaveBeenCalledWith('No items found in WXR file')
            })
        } finally {
            logSpy.mockRestore()
        }
    })

    it('单个 item 且无 post_type 时按 post 处理，缺 wp:status 落 draft', async () => {
        await withWxrDir({
            'single.xml': '<rss><channel><item><title>Solo</title><dc:date>2024-01-01T00:00:00Z</dc:date></item></channel></rss>',
        }, async (directory) => {
            const results = await new WordPressParser().parse(join(directory, 'single.xml'))

            expect(results).toHaveLength(1)
            expect(results[0]?.post.status).toBe('draft')
        })
    })
})
