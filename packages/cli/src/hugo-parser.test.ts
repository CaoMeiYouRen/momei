import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { convertHugoToMomeiPost, parseHugoMarkdown, type HugoFrontMatter } from './hugo-parser'

async function withHugoTempFile(content: string, run: (filePath: string) => Promise<void>) {
    const directory = await mkdtemp(join(tmpdir(), 'momei-hugo-'))
    const filePath = join(directory, 'post.md')

    await writeFile(filePath, content)

    try {
        await run(filePath)
    } finally {
        await unlink(filePath)
        await rmdir(directory)
    }
}

describe('Hugo Parser - parseHugoMarkdown: YAML frontmatter', () => {
    it('frontmatter 无时区日期按 YAML 时间戳语义解析，避免本地时区偏移', async () => {
        await withHugoTempFile('---\ntitle: TZ\ndate: 2024-01-01T10:00:00\n---\n\nbody', async (filePath) => {
            const { frontMatter } = await parseHugoMarkdown(filePath)

            expect(frontMatter.date).toBeInstanceOf(Date)
            expect((frontMatter.date as Date).toISOString()).toBe('2024-01-01T10:00:00.000Z')
        })
    })

    it('空 frontmatter 返回空对象而不抛错', async () => {
        await withHugoTempFile('---\n\n---\n\nbody', async (filePath) => {
            const { frontMatter, content } = await parseHugoMarkdown(filePath)

            expect(frontMatter).toEqual({})
            expect(content.trim()).toBe('body')
        })
    })
})

describe('Hugo Parser - convertHugoToMomeiPost: Basic Conversion', () => {
    it('should convert basic YAML front-matter to Momei post', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Hugo Post',
            date: '2024-06-15T10:00:00Z',
            tags: ['blog', 'hugo'],
            categories: ['tech'],
        }
        const content = 'This is Hugo content'
        const filePath = 'hugo-post.md'

        const result = convertHugoToMomeiPost(frontMatter, content, filePath)

        expect(result.title).toBe('Hugo Post')
        expect(result.content).toBe(content)
        expect(result.tags).toEqual(['blog', 'hugo'])
        expect(result.category).toBe('tech')
        expect(result.status).toBe('published')
        expect(result.createdAt).toBe('2024-06-15T10:00:00.000Z')
        expect(result.publishedAt).toBe('2024-06-15T10:00:00.000Z')
    })

    it('should handle string tags and categories', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Single Tag Post',
            tags: 'python',
            categories: 'tutorial',
        }
        const content = 'Content'

        const result = convertHugoToMomeiPost(frontMatter, content, 'test.md')

        expect(result.tags).toEqual(['python'])
        expect(result.category).toBe('tutorial')
    })

    it('should mark draft posts correctly', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Draft Post',
            draft: true,
            date: '2024-01-01',
        }
        const content = 'Draft content'

        const result = convertHugoToMomeiPost(frontMatter, content, 'draft.md')

        expect(result.status).toBe('draft')
    })

    it('should mark posts without date as draft', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Undated Post',
            draft: false,
        }
        const content = 'No date'

        const result = convertHugoToMomeiPost(frontMatter, content, 'nodate.md')

        expect(result.status).toBe('draft')
    })

    it('should pick slug from front-matter', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Custom Slug',
            slug: 'my-custom-slug',
            date: '2024-01-01',
        }
        const content = 'Content'

        const result = convertHugoToMomeiPost(frontMatter, content, 'original-name.md')

        expect(result.slug).toBe('my-custom-slug')
    })

    it('should derive slug from filename when not specified', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'No Slug',
            date: '2024-01-01',
        }
        const content = 'Content'

        const result = convertHugoToMomeiPost(frontMatter, content, 'my-post/index.md')

        expect(result.slug).toBe('my-post')
    })

    it('should handle lastmod as updated date', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Updated Post',
            date: '2024-01-01',
            lastmod: '2024-06-15',
        }
        const content = 'Content'

        const result = convertHugoToMomeiPost(frontMatter, content, 'updated.md')

        expect(result.updatedAt).toBe('2024-06-15T00:00:00.000Z')
    })

    it('should pick cover image from various Hugo fields', () => {
        const withImage: HugoFrontMatter = {
            title: 'Cover Test',
            date: '2024-01-01',
            image: '/images/cover.jpg',
        }
        const withFeatured: HugoFrontMatter = {
            title: 'Featured',
            date: '2024-01-01',
            featured_image: '/img/featured.png',
        }
        const withImagesArray: HugoFrontMatter = {
            title: 'Images Array',
            date: '2024-01-01',
            images: ['/gallery/photo1.jpg', '/gallery/photo2.jpg'],
        }

        expect(convertHugoToMomeiPost(withImage, 'c', 't.md').coverImage).toBe('/images/cover.jpg')
        expect(convertHugoToMomeiPost(withFeatured, 'c', 't.md').coverImage).toBe('/img/featured.png')
        expect(convertHugoToMomeiPost(withImagesArray, 'c', 't.md').coverImage).toBe('/gallery/photo1.jpg')
    })

    it('should handle description and summary', () => {
        const withDesc: HugoFrontMatter = {
            title: 'With Description',
            date: '2024-01-01',
            description: 'A description',
        }
        const withSummary: HugoFrontMatter = {
            title: 'With Summary',
            date: '2024-01-01',
            summary: 'A summary',
        }

        expect(convertHugoToMomeiPost(withDesc, 'c', 't.md').summary).toBe('A description')
        expect(convertHugoToMomeiPost(withSummary, 'c', 't.md').summary).toBe('A summary')
    })

    it('should set default language', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Default Lang',
            date: '2024-01-01',
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.language).toBe('zh-CN')
    })

    it('should set visibility to public', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Public Post',
            date: '2024-01-01',
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.visibility).toBe('public')
    })

    it('should handle untitled posts', () => {
        const frontMatter: HugoFrontMatter = {}
        const content = 'Some content'

        const result = convertHugoToMomeiPost(frontMatter, content, 'untitled.md')
        expect(result.title).toBe('Untitled')
    })

    it('should handle keywords as tags fallback', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Keywords Test',
            date: '2024-01-01',
            keywords: ['key1', 'key2'],
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.tags).toEqual(['key1', 'key2'])
    })

    it('should handle TOML-style tag tables (inline tables)', () => {
        // Simulate TOML tags like [[tags]] or tags = [{tag = "value"}]
        const frontMatter: HugoFrontMatter = {
            title: 'TOML Tags',
            date: '2024-01-01',
            tags: [{ tag: 'golang' }, { tag: 'hugo' }] as unknown as string[],
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.tags).toEqual(['golang', 'hugo'])
    })

    it('should ignore author field (not in MomeiPostMetadata)', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Author Test',
            date: '2024-01-01',
            author: 'John Doe',
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.metadata).toBeUndefined()
    })

    it('should handle empty tags array', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'No Tags',
            date: '2024-01-01',
            tags: [],
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.tags).toBeUndefined()
    })

    it('should parse nested categories array', () => {
        const frontMatter: HugoFrontMatter = {
            title: 'Nested Cat',
            date: '2024-01-01',
            categories: ['parent', 'child'],
        }

        const result = convertHugoToMomeiPost(frontMatter, 'c', 't.md')
        expect(result.category).toBe('parent')
    })
})
