import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { convertJekyllToMomeiPost, JekyllParser, parseJekyllMarkdown, type JekyllFrontMatter } from './jekyll-parser'

async function withJekyllTempDir(files: Record<string, string>, run: (directory: string) => Promise<void>) {
    const directory = await mkdtemp(join(tmpdir(), 'momei-jekyll-'))

    try {
        for (const [name, content] of Object.entries(files)) {
            await writeFile(join(directory, name), content)
        }
        await run(directory)
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
}

describe('Jekyll Parser - parseJekyllMarkdown', () => {
    it('解析 YAML front-matter 并裁剪正文', async () => {
        await withJekyllTempDir({
            'post.md': '---\ntitle: Hello Jekyll\ndate: 2024-01-02T03:04:05Z\n---\n\n  body text  \n',
        }, async (directory) => {
            const { frontMatter, content } = await parseJekyllMarkdown(join(directory, 'post.md'))

            expect(frontMatter.title).toBe('Hello Jekyll')
            expect(frontMatter.date).toBeInstanceOf(Date)
            expect(content).toBe('body text')
        })
    })

    it('空 front-matter 返回空对象而不抛错', async () => {
        await withJekyllTempDir({ 'post.md': '---\n\n---\n\nbody' }, async (directory) => {
            const { frontMatter, content } = await parseJekyllMarkdown(join(directory, 'post.md'))

            expect(frontMatter).toEqual({})
            expect(content).toBe('body')
        })
    })
})

describe('Jekyll Parser - convertJekyllToMomeiPost', () => {
    it('映射 title / date / tags / categories / content 五字段', () => {
        const frontMatter: JekyllFrontMatter = {
            title: 'Jekyll Post',
            date: '2024-06-15T10:00:00Z',
            tags: ['blog', 'jekyll'],
            categories: ['tech', 'notes'],
        }

        const post = convertJekyllToMomeiPost(frontMatter, 'Jekyll content', '2024-06-15-jekyll-post.md')

        expect(post.title).toBe('Jekyll Post')
        expect(post.content).toBe('Jekyll content')
        expect(post.tags).toEqual(['blog', 'jekyll'])
        expect(post.category).toBe('tech')
        expect(post.slug).toBe('jekyll-post')
        expect(post.status).toBe('published')
        expect(post.createdAt).toBe('2024-06-15T10:00:00.000Z')
        expect(post.publishedAt).toBe('2024-06-15T10:00:00.000Z')
    })

    it('支持字符串形式的 tags / categories，并按 Jekyll 空白拆分', () => {
        const post = convertJekyllToMomeiPost({ tags: 'classic hollywood', categories: 'jekyll update' }, 'body', 'post.md')

        expect(post.tags).toEqual(['classic', 'hollywood'])
        expect(post.category).toBe('jekyll')
    })

    it('兼容单数键 tag / category', () => {
        const post = convertJekyllToMomeiPost({ tag: 'solo', category: 'single category' }, 'body', 'post.md')

        expect(post.tags).toEqual(['solo'])
        expect(post.category).toBe('single category')
    })

    it('单数键与复数键同时存在时单数键优先（Jekyll 语义）', () => {
        const post = convertJekyllToMomeiPost({
            tag: 'solo',
            tags: 'classic hollywood',
            category: 'single',
            categories: 'tech notes',
        }, 'body', 'post.md')

        expect(post.tags).toEqual(['solo'])
        expect(post.category).toBe('single')
    })

    it('categories 为数组时取首项', () => {
        const post = convertJekyllToMomeiPost({ categories: ['tech', 'notes'] }, 'body', 'post.md')

        expect(post.category).toBe('tech')
    })

    it('front matter 无 date 时从文件名前缀推导并判为 published', () => {
        const post = convertJekyllToMomeiPost({ title: 'Filename date only' }, 'body', '_posts/2019-05-21-bride-of-chucky.md')

        expect(post.status).toBe('published')
        expect(post.createdAt).toBe('2019-05-21T00:00:00.000Z')
        expect(post.publishedAt).toBe('2019-05-21T00:00:00.000Z')
        expect(post.slug).toBe('bride-of-chucky')
    })

    it('文件名日期非法时不推导日期，回落到 draft', () => {
        const post = convertJekyllToMomeiPost({ title: 'Invalid filename date' }, 'body', '2024-13-45-invalid.md')

        expect(post.status).toBe('draft')
        expect(post.createdAt).toBeUndefined()
    })

    it('published: false 与文件名日期组合时仍为 draft，但保留日期', () => {
        const post = convertJekyllToMomeiPost({ published: false }, 'body', '2024-05-21-hidden.md')

        expect(post.status).toBe('draft')
        expect(post.createdAt).toBe('2024-05-21T00:00:00.000Z')
    })

    it('front matter 的 date 优先于文件名日期', () => {
        const post = convertJekyllToMomeiPost({ date: '2024-06-15T10:00:00Z' }, 'body', '2019-05-21-bride-of-chucky.md')

        expect(post.createdAt).toBe('2024-06-15T10:00:00.000Z')
    })

    it('缺字段时回退到 Untitled / 文件名 slug / draft', () => {
        const post = convertJekyllToMomeiPost({}, 'body', 'untitled-post.md')

        expect(post.title).toBe('Untitled')
        expect(post.slug).toBe('untitled-post')
        expect(post.tags).toBeUndefined()
        expect(post.category).toBeNull()
        expect(post.status).toBe('draft')
        expect(post.createdAt).toBeUndefined()
    })

    it('published: false 时标记为 draft 并映射 last_modified_at', () => {
        const frontMatter: JekyllFrontMatter = {
            title: 'Hidden',
            date: '2024-06-15T10:00:00Z',
            last_modified_at: '2024-07-01T00:00:00Z',
            published: false,
        }

        const post = convertJekyllToMomeiPost(frontMatter, 'body', 'hidden.md')

        expect(post.status).toBe('draft')
        expect(post.updatedAt).toBe('2024-07-01T00:00:00.000Z')
    })

    it('excerpt / description 作为摘要，image 作为封面', () => {
        const post = convertJekyllToMomeiPost({
            description: 'desc',
            excerpt: 'excerpt',
            image: '/assets/cover.png',
        }, 'body', 'post.md')

        expect(post.summary).toBe('desc')
        expect(post.coverImage).toBe('/assets/cover.png')
    })
})

describe('JekyllParser - ContentParser 实现', () => {
    it('批量解析目录并跳过无法解析的文件', async () => {
        await withJekyllTempDir({
            '2024-02-03-first.md': '---\ntitle: First\n---\n\nfirst body',
            'second.md': '---\ntitle: Second\ndate: 2024-02-04T00:00:00Z\n---\n\nsecond body',
        }, async (directory) => {
            const results = await new JekyllParser().parse(directory)

            expect(results).toHaveLength(2)
            expect(results.map((entry) => entry.post.title).sort()).toEqual(['First', 'Second'])
            expect(results.every((entry) => entry.content.length > 0)).toBe(true)
        })
    })
})
