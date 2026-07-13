/**
 * Post formatter for CLI export
 *
 * Converts API post data to Markdown (with Front-matter) or JSON.
 * This is a CLI-side implementation (cannot import server code).
 */
import yaml from 'js-yaml'
import type { MomeiPost } from '@momei-blog/api-client'

// ===== Public API =====

/**
 * Format a MomeiPost to Markdown with Hexo-compatible Front-matter.
 *
 * The Front-matter includes: title, date, categories, tags, slug,
 * description, language, cover image, copyright, status, audio metadata.
 */
export function formatPostToMarkdown(post: MomeiPost): string {
    const frontMatter: Record<string, unknown> = {
        title: post.title,
        date: post.createdAt
            ? new Date(post.createdAt).toISOString()
            : new Date().toISOString(),
        categories: post.category ? [post.category] : [],
        tags: post.tags || [],
        slug: post.slug || '',
        description: post.summary || '',
        language: post.language || '',
    }

    if (post.coverImage) {
        frontMatter.image = post.coverImage
    }

    if (post.translationId) {
        frontMatter.translation_id = post.translationId
    }

    const audioMetadata = post.metadata?.audio
    if (audioMetadata?.url) {
        frontMatter.audio_url = audioMetadata.url
        if (audioMetadata.duration) {
            frontMatter.audio_duration = audioMetadata.duration
        }
        if (typeof audioMetadata.size === 'number') {
            frontMatter.audio_size = audioMetadata.size
        }
        if (audioMetadata.mimeType) {
            frontMatter.audio_mime_type = audioMetadata.mimeType
        }
        if (audioMetadata.language) {
            frontMatter.audio_language = audioMetadata.language
        }
    }

    if (post.copyright) {
        frontMatter.copyright = post.copyright
    }

    if (post.status) {
        frontMatter.status = post.status
    }

    const yamlStr = yaml.dump(frontMatter, { skipInvalid: true, indent: 2 }).trim()
    return `---\n${yamlStr}\n---\n\n${post.content || ''}`
}

/**
 * Format a MomeiPost to indented JSON string.
 */
export function formatPostToJson(post: MomeiPost): string {
    return JSON.stringify(post, null, 2)
}

/**
 * Maximum filename length (excluding extension and language suffix)
 * to avoid filesystem limitations on common platforms.
 */
const MAX_FILENAME_BASE_LENGTH = 200

/**
 * Generate a safe filesystem filename for a post.
 *
 * Sanitises the base name by:
 * - removing filesystem-illegal characters
 * - stripping leading/trailing dots and whitespace
 * - truncating to {@link MAX_FILENAME_BASE_LENGTH} characters
 */
export function getPostFilename(post: MomeiPost, extension: string): string {
    const raw = post.slug
        || post.title?.replace(/[<>:"/\\|?*]+/gu, '_')
        || 'untitled'

    // Strip leading/trailing dots and whitespace
    const cleaned = raw.replace(/^[.\s]+|[.\s]+$/gu, '')

    // Truncate to safe length
    const base = cleaned.length > MAX_FILENAME_BASE_LENGTH
        ? cleaned.slice(0, MAX_FILENAME_BASE_LENGTH)
        : cleaned

    const lang = post.language || 'unknown'
    return `${base}.${lang}${extension}`
}
