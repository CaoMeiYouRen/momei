import { readFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'
import type { HexoFrontMatter, MomeiPost, MomeiPostAudioMetadata, MomeiPostMetadata, ParsedHexoPost } from './types'

function pickFirstString(...values: unknown[]) {
    for (const value of values) {
        if (typeof value !== 'string') {
            continue
        }

        const trimmed = value.trim()
        if (trimmed) {
            return trimmed
        }
    }

    return undefined
}

function normalizeStringArray(value?: string | string[]) {
    if (Array.isArray(value)) {
        return value
            .map((item) => typeof item === 'string' ? item.trim() : '')
            .filter(Boolean)
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed ? [trimmed] : []
    }

    return undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : undefined
}

function resolveCategory(frontMatter: HexoFrontMatter) {
    const rawCategory = frontMatter.categories ?? frontMatter.category
    if (Array.isArray(rawCategory)) {
        return pickFirstString(rawCategory[0]) || null
    }

    return pickFirstString(rawCategory) || null
}

function resolveSlug(frontMatter: HexoFrontMatter, filePath: string) {
    const explicitSlug = pickFirstString(frontMatter.slug, frontMatter.abbrlink)
    if (explicitSlug) {
        return explicitSlug
    }

    const fileName = filePath.split(/[/\\]/).pop() || ''
    return fileName.replace(/\.md$/i, '')
}

function toIsoDateString(value: unknown) {
    if (!value) {
        return undefined
    }

    if (typeof value !== 'string' && !(value instanceof Date)) {
        return undefined
    }

    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) {
        return undefined
    }

    return date.toISOString()
}

function toInteger(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value)
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }

    const parsed = Number.parseInt(trimmed, 10)
    return Number.isNaN(parsed) ? undefined : parsed
}

function toDurationSeconds(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value)
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }

    if (!trimmed.includes(':')) {
        return toInteger(trimmed)
    }

    const segments = trimmed.split(':').map((segment) => Number.parseInt(segment, 10))
    if (segments.some((segment) => Number.isNaN(segment))) {
        return undefined
    }

    if (segments.length === 2) {
        const [minutes = 0, seconds = 0] = segments
        return minutes * 60 + seconds
    }

    if (segments.length === 3) {
        const [hours = 0, minutes = 0, seconds = 0] = segments
        return hours * 3600 + minutes * 60 + seconds
    }

    return undefined
}

function buildAudioMetadata(frontMatter: HexoFrontMatter): MomeiPostAudioMetadata | undefined {
    const metadataAudio = frontMatter.metadata?.audio ?? asRecord(frontMatter.audio)
    const url = pickFirstString(metadataAudio?.url, frontMatter.audio, frontMatter.audio_url, frontMatter.media)
    const duration = toDurationSeconds(metadataAudio?.duration ?? frontMatter.audio_duration ?? frontMatter.duration)
    const size = toInteger(metadataAudio?.size ?? frontMatter.audio_size ?? frontMatter.medialength ?? frontMatter.mediaLength)
    const mimeType = pickFirstString(metadataAudio?.mimeType, frontMatter.audio_mime_type, frontMatter.mediatype, frontMatter.mediaType)
    const language = pickFirstString(metadataAudio?.language, frontMatter.audio_language, frontMatter.audio_locale, frontMatter.language, frontMatter.lang)

    if (
        url === undefined
        && duration === undefined
        && size === undefined
        && mimeType === undefined
        && language === undefined
    ) {
        return undefined
    }

    const audio: MomeiPostAudioMetadata = {}

    if (url !== undefined) {
        audio.url = url
    }
    if (duration !== undefined) {
        audio.duration = duration
    }
    if (size !== undefined) {
        audio.size = size
    }
    if (mimeType !== undefined) {
        audio.mimeType = mimeType
    }
    if (language !== undefined) {
        audio.language = language
    }

    return audio
}

function buildMetadata(frontMatter: HexoFrontMatter): MomeiPostMetadata | undefined {
    const audio = buildAudioMetadata(frontMatter)

    if (!audio) {
        return undefined
    }

    return {
        audio,
    }
}

/**
 * 解析 Hexo Markdown 文件
 */
export async function parseHexoMarkdown(filePath: string): Promise<{ frontMatter: HexoFrontMatter, content: string }> {
    const fileContent = await readFile(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    return {
        frontMatter: data as HexoFrontMatter,
        content: content.trim(),
    }
}

/**
 * 扫描目录中的所有 Markdown 文件
 */
export async function scanMarkdownFiles(sourceDir: string): Promise<string[]> {
    const pattern = resolve(sourceDir, '**/*.md')
    const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        absolute: true,
    })

    return files
}

/**
 * 转换 Hexo Front-matter 到 Momei Post 格式
 */
export function convertToMomeiPost(frontMatter: HexoFrontMatter, content: string, filePath: string): MomeiPost {
    const tags = normalizeStringArray(frontMatter.tags)
    const category = resolveCategory(frontMatter)
    const slug = resolveSlug(frontMatter, filePath)
    const importedAt = toIsoDateString(frontMatter.date)
    const summary = pickFirstString(frontMatter.description, frontMatter.desc, frontMatter.excerpt) || null
    const language = pickFirstString(frontMatter.language, frontMatter.lang) || 'zh-CN'
    const translationId = pickFirstString(frontMatter.translationId, frontMatter.translation_id) || null
    const coverImage = pickFirstString(frontMatter.image, frontMatter.cover, frontMatter.thumb) || null
    const copyright = pickFirstString(frontMatter.copyright, frontMatter.license) || null
    const metadata = buildMetadata(frontMatter)
    const status = importedAt ? 'published' : 'draft'

    const post: MomeiPost = {
        title: pickFirstString(frontMatter.title) || 'Untitled',
        content,
        slug,
        summary,
        coverImage,
        metadata,
        language,
        translationId,
        category,
        tags,
        status,
        visibility: 'public',
        copyright,
        createdAt: importedAt,
        publishedAt: importedAt,
    }

    return post
}

/**
 * 批量解析 Hexo 文件
 */
export async function parseHexoFiles(sourceDir: string, verbose = false): Promise<ParsedHexoPost[]> {
    const files = await scanMarkdownFiles(sourceDir)

    if (verbose) {
        console.log(`Found ${files.length} markdown files in ${sourceDir}`)
    }

    const results: ParsedHexoPost[] = []

    for (const file of files) {
        try {
            const { frontMatter, content } = await parseHexoMarkdown(file)
            const relativeFile = relative(sourceDir, file)
            const post = convertToMomeiPost(frontMatter, content, relativeFile)
            results.push({ file, relativeFile, frontMatter, content, post })

            if (verbose) {
                console.log(`✓ Parsed: ${relativeFile}`)
            }
        } catch (error) {
            if (verbose) {
                console.error(`✗ Failed to parse ${relative(sourceDir, file)}:`, error)
            }
        }
    }

    return results
}
