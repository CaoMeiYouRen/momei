import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { migrateImportEntriesLocalImages } from './import-image-migration'
import type { CliDirectUploadAuthorization, ParsedHexoPost } from './types'

const createdTempDirs: string[] = []

function createParsedEntry(filePath: string, content: string, coverImage?: string): ParsedHexoPost {
    return {
        file: filePath,
        relativeFile: 'posts/article.md',
        frontMatter: {},
        content,
        post: {
            title: 'Article',
            content,
            coverImage,
            language: 'zh-CN',
            status: 'draft',
            visibility: 'public',
        },
    }
}

async function createImageFixture(reference = './images/cover.png') {
    const root = await mkdtemp(join(tmpdir(), 'momei-cli-import-'))
    createdTempDirs.push(root)

    const postDir = join(root, 'posts')
    const imageDir = join(postDir, 'images')
    await mkdir(imageDir, { recursive: true })
    await writeFile(join(imageDir, 'cover.png'), 'fake-image-bytes', 'utf-8')

    const sourceFile = join(postDir, 'article.md')
    const content = `![cover](${reference})`

    return {
        root,
        content,
        entry: createParsedEntry(sourceFile, content),
    }
}

afterEach(async () => {
    await Promise.all(createdTempDirs.map((dir) => rm(dir, { recursive: true, force: true })))
    createdTempDirs.length = 0
})

describe('migrateImportEntriesLocalImages', () => {
    it('throws when direct upload authorization is missing outside dry-run mode', async () => {
        const entry = createParsedEntry('C:/fixture/posts/article.md', '![cover](./images/cover.png)')

        await expect(migrateImportEntriesLocalImages([entry], {
            sourceDir: 'C:/fixture',
            dryRun: false,
        })).rejects.toThrow('authorizeDirectUpload is required when local image upload is enabled outside dry-run mode')
    })

    it('uploads local images and rewrites markdown/html/cover references', async () => {
        const root = await mkdtemp(join(tmpdir(), 'momei-cli-import-'))
        createdTempDirs.push(root)

        const postDir = join(root, 'posts')
        const imageDir = join(postDir, 'images')
        await mkdir(imageDir, { recursive: true })

        await writeFile(join(imageDir, 'cover.png'), 'cover')
        await writeFile(join(imageDir, 'inline.jpg'), 'inline')

        const content = [
            '![Cover](./images/cover.png)',
            '<img src="./images/inline.jpg" alt="inline">',
            '![Remote](https://example.com/remote.png)',
        ].join('\n')

        const entry = createParsedEntry(join(postDir, 'article.md'), content, './images/cover.png')
        const authorizeDirectUpload = vi.fn(async ({ filename }: { filename: string }) => ({
            strategy: 'put-presign' as const,
            method: 'PUT' as const,
            url: `https://storage.example.com/${filename}`,
            headers: {
                'content-type': 'image/png',
                'content-length': '5',
            },
            publicUrl: `https://cdn.example.com/${filename}`,
            objectKey: `migrations/image/${filename}`,
            expiresIn: 300,
        }))

        const uploadWithPresign = vi.fn(async () => undefined)

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir: root,
            dryRun: false,
            authorizeDirectUpload,
            uploadWithPresign,
        })

        expect(authorizeDirectUpload).toHaveBeenCalledTimes(2)
        expect(uploadWithPresign).toHaveBeenCalledTimes(2)
        expect(entry.post.content).toContain('![Cover](https://cdn.example.com/cover.png)')
        expect(entry.post.content).toContain('<img src="https://cdn.example.com/inline.jpg" alt="inline">')
        expect(entry.post.content).toContain('![Remote](https://example.com/remote.png)')
        expect(entry.post.coverImage).toBe('https://cdn.example.com/cover.png')
        expect(report.summary).toEqual({
            scanned: 3,
            replaced: 3,
            failed: 0,
            skipped: 0,
            uploaded: 2,
        })
    })

    it('marks local references as skipped in dry-run mode', async () => {
        const { root, content, entry } = await createImageFixture()

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir: root,
            dryRun: true,
        })

        expect(entry.post.content).toBe(content)
        expect(report.summary).toEqual({
            scanned: 1,
            replaced: 0,
            failed: 0,
            skipped: 1,
            uploaded: 0,
        })
    })

    it('records missing local files as failed without calling authorizeDirectUpload', async () => {
        const root = await mkdtemp(join(tmpdir(), 'momei-cli-import-'))
        createdTempDirs.push(root)

        const entry = createParsedEntry(join(root, 'posts', 'article.md'), '![missing](./images/missing.png)')
        const authorizeDirectUpload = vi.fn()

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir: root,
            dryRun: false,
            authorizeDirectUpload,
        })

        expect(report.summary.scanned).toBe(1)
        expect(report.summary.failed).toBe(1)
        expect(report.summary.replaced).toBe(0)
        expect(report.items[0]?.status).toBe('failed')
        expect(report.items[0]?.reason).toContain('does not exist or is not readable')
        expect(authorizeDirectUpload).not.toHaveBeenCalled()
        expect(entry.post.content).toBe('![missing](./images/missing.png)')
    })

    it('records proxy upload strategy as failed and keeps original references', async () => {
        const { root, content, entry } = await createImageFixture()
        const authorizeDirectUpload = vi.fn(async () => ({ strategy: 'proxy' } satisfies CliDirectUploadAuthorization))

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir: root,
            dryRun: false,
            authorizeDirectUpload,
        })

        expect(report.summary.scanned).toBe(1)
        expect(report.summary.failed).toBe(1)
        expect(report.summary.replaced).toBe(0)
        expect(report.summary.uploaded).toBe(0)
        expect(report.items[0]?.status).toBe('failed')
        expect(report.items[0]?.reason).toContain('not supported')
        expect(entry.post.content).toBe(content)
    })

    it('records upload errors as failed when presigned upload throws', async () => {
        const { root, content, entry } = await createImageFixture()
        const authorizeDirectUpload = vi.fn(async () => ({
            strategy: 'put-presign',
            method: 'PUT',
            url: 'https://upload.example.com/object',
            headers: {},
            publicUrl: 'https://cdn.example.com/object',
            objectKey: 'migrations/image/object',
            expiresIn: 300,
        } satisfies CliDirectUploadAuthorization))

        const uploadWithPresign = vi.fn(async () => {
            throw new Error('s3 timeout')
        })

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir: root,
            dryRun: false,
            authorizeDirectUpload,
            uploadWithPresign,
        })

        expect(report.summary.scanned).toBe(1)
        expect(report.summary.failed).toBe(1)
        expect(report.summary.replaced).toBe(0)
        expect(report.summary.uploaded).toBe(0)
        expect(report.items[0]?.status).toBe('failed')
        expect(report.items[0]?.reason).toBe('s3 timeout')
        expect(entry.post.content).toBe(content)
    })
})
