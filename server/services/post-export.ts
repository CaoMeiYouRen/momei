import yaml from 'js-yaml'
import JSZip from 'jszip'
import type { Post } from '@/server/entities/post'
import { normalizeOptionalString } from '@/utils/shared/coerce'
import { buildAbsoluteUrl, isAbsoluteHttpUrl } from '@/utils/shared/url'

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export interface PostMarkdownExportOptions {
    siteUrl?: string | null
    absolutizeMediaUrls?: boolean
}

function rewriteMarkdownMediaUrlsInTextSegment(segment: string, siteUrl: string) {
    const inlineCodePlaceholders: string[] = []
    let protectedSegment = ''
    let index = 0

    while (index < segment.length) {
        if (segment[index] !== '`') {
            protectedSegment += segment[index]
            index += 1
            continue
        }

        let delimiterLength = 0
        while (segment[index + delimiterLength] === '`') {
            delimiterLength += 1
        }

        let cursor = index + delimiterLength
        let closingCursor = -1

        while (cursor < segment.length) {
            if (segment[cursor] !== '`') {
                cursor += 1
                continue
            }

            let closingLength = 0
            while (segment[cursor + closingLength] === '`') {
                closingLength += 1
            }

            if (closingLength === delimiterLength) {
                closingCursor = cursor + closingLength
                break
            }

            cursor += closingLength
        }

        if (closingCursor === -1) {
            protectedSegment += segment.slice(index, index + delimiterLength)
            index += delimiterLength
            continue
        }

        const placeholder = `__MOMEI_INLINE_CODE_${inlineCodePlaceholders.length}__`
        inlineCodePlaceholders.push(segment.slice(index, closingCursor))
        protectedSegment += placeholder
        index = closingCursor
    }

    const rewrittenSegment = protectedSegment
        .replace(/!\[([^\]]*)\]\((\/[^)\s]+)(\s+"[^"]*")?\)/gu, (_match, alt, url, title = '') => `![${alt}](${buildAbsoluteUrl(siteUrl, url)}${title})`)
        .replace(/<(img|audio|source|video)\b([^>]*?)\s(src|poster)=(['"])(\/[^'"]+)\4([^>]*)>/giu, (...args) => {
            const [match, tag, before, attribute, quote, url, after] = args as [string, string, string, string, string, string, string]
            return match.replace(`<${tag}${before} ${attribute}=${quote}${url}${quote}${after}>`, `<${tag}${before} ${attribute}=${quote}${buildAbsoluteUrl(siteUrl, url)}${quote}${after}>`)
        })

    return rewrittenSegment.replace(/__MOMEI_INLINE_CODE_(\d+)__/gu, (_match, placeholderIndex) => inlineCodePlaceholders[Number(placeholderIndex)] || '')
}

function resolveExportUrl(value: unknown, options: PostMarkdownExportOptions) {
    const normalizedValue = normalizeOptionalString(value)
    if (!normalizedValue) {
        return null
    }

    if (!options.absolutizeMediaUrls || !options.siteUrl || isAbsoluteHttpUrl(normalizedValue)) {
        return normalizedValue
    }

    if (!normalizedValue.startsWith('/')) {
        return normalizedValue
    }

    return buildAbsoluteUrl(options.siteUrl, normalizedValue)
}

export function absolutizeMarkdownMediaUrls(markdown: string, siteUrl?: string | null) {
    if (!markdown || !siteUrl) {
        return markdown
    }

    let rewrittenMarkdown = ''
    let plainTextBuffer = ''
    let index = 0

    while (index < markdown.length) {
        const lineEnd = markdown.indexOf('\n', index)
        const nextIndex = lineEnd === -1 ? markdown.length : lineEnd + 1
        const line = markdown.slice(index, lineEnd === -1 ? markdown.length : lineEnd)
        const fenceMatch = /^ {0,3}((`{3,})|(~{3,})).*$/u.exec(line)

        if (!fenceMatch) {
            plainTextBuffer += markdown.slice(index, nextIndex)
            index = nextIndex
            continue
        }

        rewrittenMarkdown += rewriteMarkdownMediaUrlsInTextSegment(plainTextBuffer, siteUrl)
        plainTextBuffer = ''

        const delimiter = fenceMatch[1]
        if (!delimiter) {
            plainTextBuffer += markdown.slice(index, nextIndex)
            index = nextIndex
            continue
        }

        const fenceChar = delimiter[0]
        const minimumDelimiterLength = delimiter.length
        let blockEnd = nextIndex
        let cursor = nextIndex

        while (cursor < markdown.length) {
            const closingLineEnd = markdown.indexOf('\n', cursor)
            const closingNextIndex = closingLineEnd === -1 ? markdown.length : closingLineEnd + 1
            const closingLine = markdown.slice(cursor, closingLineEnd === -1 ? markdown.length : closingLineEnd)
            const closingPattern = new RegExp(`^ {0,3}${fenceChar}{${minimumDelimiterLength},}[ \t]*$`, 'u')

            blockEnd = closingNextIndex
            if (closingPattern.test(closingLine)) {
                break
            }

            cursor = closingNextIndex
        }

        rewrittenMarkdown += markdown.slice(index, blockEnd)
        index = blockEnd
    }

    rewrittenMarkdown += rewriteMarkdownMediaUrlsInTextSegment(plainTextBuffer, siteUrl)
    return rewrittenMarkdown
}

/**
 * 将 Post 实体转换为带 Front-matter 的 Markdown 字符串 (Hexo 兼容)
 */
export function formatPostToMarkdown(post: Post, options: PostMarkdownExportOptions = {}): string {
    const frontMatter: Record<string, unknown> = {
        title: post.title,
        date: post.createdAt ? post.createdAt.toISOString() : new Date().toISOString(),
        categories: post.category ? [post.category.name] : [],
        tags: post.tags?.map((t) => t.name) || [],
        abbrlink: post.slug,
        description: post.summary || '',
        author: post.author?.name || 'Unknown',
        language: post.language,
    }

    if (post.coverImage) {
        frontMatter.image = resolveExportUrl(post.coverImage, options)
    }

    const audioMetadata = post.metadata?.audio
    if (audioMetadata && isRecord(audioMetadata)) {
        const audioUrl = resolveExportUrl(audioMetadata.url, options)

        if (audioUrl) {
            frontMatter.audio_url = audioUrl
        }
        if (typeof audioMetadata.duration === 'number') {
            frontMatter.audio_duration = audioMetadata.duration
        }
        if (typeof audioMetadata.size === 'number') {
            frontMatter.audio_size = audioMetadata.size
        }
        if (typeof audioMetadata.mimeType === 'string' && audioMetadata.mimeType) {
            frontMatter.audio_mime_type = audioMetadata.mimeType
        }
        if (typeof audioMetadata.language === 'string' && audioMetadata.language) {
            frontMatter.audio_language = audioMetadata.language
        }
    }

    // 可以在这里根据需要添加更多字段映射

    const yamlStr = yaml.dump(frontMatter, { skipInvalid: true, indent: 2 }).trim()
    const content = options.absolutizeMediaUrls
        ? absolutizeMarkdownMediaUrls(post.content || '', options.siteUrl)
        : (post.content || '')

    return `---\n${yamlStr}\n---\n\n${content}`
}

/**
 * 批量将文章打包为 ZIP
 */
export async function createPostsZip(posts: Post[]): Promise<Buffer> {
    const zip = new JSZip()
    posts.forEach((post) => {
        // 使用 slug 作为文件名，如果没有则使用 id，并带上语言后缀
        const filename = `${post.slug || post.id}.${post.language}.md`
        const content = formatPostToMarkdown(post)
        zip.file(filename, content)
    })
    return await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
    })
}
