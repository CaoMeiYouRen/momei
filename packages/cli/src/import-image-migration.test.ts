import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MomeiPost } from '@momei-blog/api-client'
import { migrateImportEntriesLocalImages } from './import-image-migration'
import type { ParsedHexoPost } from './types'

const tempDirectories: string[] = []

afterEach(async () => {
    await Promise.all(tempDirectories.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true })
    }))
})

async function createTempSourceDir() {
    const directory = await mkdtemp(join(tmpdir(), 'momei-cli-image-migration-'))
    tempDirectories.push(directory)
    return directory
}

function createParsedEntry(params: {
    sourceDir: string
    relativeFile: string
    content: string
    coverImage?: string | null
    slug?: string
}): ParsedHexoPost {
    const file = join(params.sourceDir, params.relativeFile)
    const post: MomeiPost = {
        title: 'Imported Post',
        content: params.content,
        slug: params.slug,
        coverImage: params.coverImage,
    }

    return {
        file,
        relativeFile: params.relativeFile,
        frontMatter: {},
        content: params.content,
        post,
    }
}

describe('migrateImportEntriesLocalImages', () => {
    it('uploads local images and rewrites markdown/html/cover references', async () => {
        const sourceDir = await createTempSourceDir()
        const postsDir = join(sourceDir, 'posts')
        const imagesDir = join(sourceDir, 'images')
        await mkdir(postsDir, { recursive: true })
        await mkdir(imagesDir, { recursive: true })

        await writeFile(join(imagesDir, 'cover.png'), 'cover')
        await writeFile(join(postsDir, 'inline.jpg'), 'inline')

        const entry = createParsedEntry({
            sourceDir,
            relativeFile: 'posts/hello.md',
            content: [
                '![Cover](../images/cover.png)',
                '<img src="./inline.jpg" alt="inline">',
                '![Remote](https://example.com/remote.png)',
            ].join('\n'),
            coverImage: '/images/cover.png',
            slug: 'hello',
        })

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
            sourceDir,
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

    it('scans local references and marks them as skipped in dry-run mode', async () => {
        const sourceDir = await createTempSourceDir()
        const postsDir = join(sourceDir, 'posts')
        const imagesDir = join(sourceDir, 'images')
        await mkdir(postsDir, { recursive: true })
        await mkdir(imagesDir, { recursive: true })
        await writeFile(join(imagesDir, 'cover.png'), 'cover')

        const entry = createParsedEntry({
            sourceDir,
            relativeFile: 'posts/dry-run.md',
            content: '![Cover](../images/cover.png)',
            coverImage: null,
        })

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir,
            dryRun: true,
        })

        expect(entry.post.content).toBe('![Cover](../images/cover.png)')
        expect(report.summary).toEqual({
            scanned: 1,
            replaced: 0,
            failed: 0,
            skipped: 1,
            uploaded: 0,
        })
    })

    it('records missing local images as failures without throwing', async () => {
        const sourceDir = await createTempSourceDir()
        const postsDir = join(sourceDir, 'posts')
        await mkdir(postsDir, { recursive: true })

        const entry = createParsedEntry({
            sourceDir,
            relativeFile: 'posts/missing.md',
            content: '![Missing](../images/missing.png)',
            coverImage: null,
        })

        const authorizeDirectUpload = vi.fn()

        const report = await migrateImportEntriesLocalImages([entry], {
            sourceDir,
            dryRun: false,
            authorizeDirectUpload,
        })

        expect(authorizeDirectUpload).not.toHaveBeenCalled()
        expect(entry.post.content).toBe('![Missing](../images/missing.png)')
        expect(report.summary).toEqual({
            scanned: 1,
            replaced: 0,
            failed: 1,
            skipped: 0,
            uploaded: 0,
        })
        expect(report.items[0]?.reason).toContain('does not exist')
    })
})
