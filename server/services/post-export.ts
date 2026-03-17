import yaml from 'js-yaml'
import JSZip from 'jszip'
import type { Post } from '@/server/entities/post'

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 将 Post 实体转换为带 Front-matter 的 Markdown 字符串 (Hexo 兼容)
 */
export function formatPostToMarkdown(post: Post): string {
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
        frontMatter.image = post.coverImage
    }

    const audioMetadata = post.metadata?.audio
    if (audioMetadata && isRecord(audioMetadata)) {
        const audioUrl = typeof audioMetadata.url === 'string' ? audioMetadata.url : undefined

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
    return `---\n${yamlStr}\n---\n\n${post.content || ''}`
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
