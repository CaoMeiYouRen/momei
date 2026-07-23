import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import matter from 'gray-matter'
import { parse as parseToml } from 'smol-toml'
import yaml from 'js-yaml'
import type { MomeiPost } from '@momei-blog/api-client'
import type { ContentParser, ParsedPost } from './types'
import { scanMarkdownFiles } from './parser'

// --- Hugo Front-matter 数据结构 ---

/**
 * Hugo 支持的三种 Front-matter 格式：
 * - YAML (---)
 * - TOML (+++)
 * - JSON  ({)
 */
export interface HugoFrontMatter {
    title?: string
    date?: string | Date
    lastmod?: string | Date
    updated?: string | Date
    publishDate?: string | Date
    expiryDate?: string | Date
    slug?: string
    url?: string
    draft?: boolean
    tags?: string | string[]
    categories?: string | string[]
    keywords?: string | string[]
    description?: string
    summary?: string
    image?: string
    cover?: string
    featured_image?: string
    images?: string[]
    weight?: number
    aliases?: string[]
    author?: string
    [key: string]: unknown
}

// --- Helper functions ---

function pickFirstString(...values: unknown[]) {
    for (const value of values) {
        if (typeof value !== 'string') continue
        const trimmed = value.trim()
        if (trimmed) return trimmed
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

function toIsoDateString(value: unknown) {
    if (!value) return undefined
    if (typeof value !== 'string' && !(value instanceof Date)) return undefined
    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return undefined
    return date.toISOString()
}

function normalizeTags(value: unknown): string[] | undefined {
    // Hugo tags can be: string, string[], or in TOML: [{tag: "value"}, ...]
    if (Array.isArray(value)) {
        const tags = value
            .map((item) => {
                if (typeof item === 'string') return item.trim()
                // Handle TOML array of inline tables like [{tag: "value"}]
                if (item && typeof item === 'object' && 'tag' in item) {
                    return String((item as Record<string, unknown>).tag).trim()
                }
                return ''
            })
            .filter(Boolean)
        return tags.length > 0 ? tags : undefined
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed ? [trimmed] : undefined
    }
    return undefined
}

function normalizeCategories(value: unknown): string | null {
    if (Array.isArray(value)) {
        const first = value[0]
        if (typeof first === 'string') return first.trim() || null
        return null
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || null
    }
    return null
}

// --- YAML Engine (reuse same tab fix as Hexo parser) ---

function createYamlEngine() {
    return {
        parse: (input: string) => {
            const normalized = input.replace(/\t/g, '  ')
            return yaml.load(normalized) as Record<string, unknown>
        },
    }
}

// --- TOML Engine ---

function createTomlEngine() {
    return {
        parse: (input: string) => {
            // smol-toml parses TOML strings into objects
            return parseToml(input) as Record<string, unknown>
        },
    }
}

/**
 * 解析 Hugo Markdown 文件
 * 自动检测 Front-matter 格式（YAML/TOML/JSON）
 */
export async function parseHugoMarkdown(filePath: string): Promise<{ frontMatter: HugoFrontMatter, content: string }> {
    const fileContent = await readFile(filePath, 'utf-8')

    // gray-matter 自动检测分隔符：
    // --- → YAML (使用 yaml engine)
    // +++ → TOML (使用 toml engine)
    // {   → JSON (使用 JSON engine)
    const { data, content } = matter(fileContent, {
        engines: {
            yaml: createYamlEngine(),
            toml: createTomlEngine(),
        },
        // JSON 解析使用内置 JSON 解析器 + 自定义语言检测
        language: 'yaml', // default language
    })

    // 如果 gray-matter 没有自动检测到 TOML，尝试手动检测
    if (Object.keys(data).length === 0 && content === fileContent.trim()) {
        // Try manual detection for edge cases
        const trimmed = fileContent.trimStart()
        if (trimmed.startsWith('+++')) {
            const endIndex = trimmed.indexOf('+++', 3)
            if (endIndex !== -1) {
                const tomlStr = trimmed.slice(3, endIndex).trim()
                const body = trimmed.slice(endIndex + 3).trim()
                return {
                    frontMatter: parseToml(tomlStr) as HugoFrontMatter,
                    content: body,
                }
            }
        }
    }

    return {
        frontMatter: data as HugoFrontMatter,
        content: content.trim(),
    }
}

/**
 * 从文件路径推导 slug
 * 处理 Hugo 的 index.md / _index.md 页面包模式
 */
function deriveSlug(filePath: string): string {
    const segments = filePath.replace(/\.md$/i, '').split(/[/\\]/)
    const lastSegment = segments[segments.length - 1] || ''
    // For index.md or _index.md, use parent directory name
    if ((lastSegment === 'index' || lastSegment === '_index') && segments.length >= 2) {
        return segments[segments.length - 2] || ''
    }
    return lastSegment
}

/**
 * 转换 Hugo Front-matter 到 Momei Post 格式
 */
export function convertHugoToMomeiPost(frontMatter: HugoFrontMatter, content: string, filePath: string): MomeiPost {
    const title = pickFirstString(frontMatter.title) || 'Untitled'
    const tags = normalizeTags(frontMatter.tags) || normalizeStringArray(frontMatter.keywords)
    const category = normalizeCategories(frontMatter.categories)
    const slug = pickFirstString(frontMatter.slug) || deriveSlug(filePath)
    const description = pickFirstString(frontMatter.description, frontMatter.summary)
    const coverImage = pickFirstString(frontMatter.image, frontMatter.cover, frontMatter.featured_image, frontMatter.images?.[0]) || null
    const date = toIsoDateString(frontMatter.date)
    const updatedDate = toIsoDateString(frontMatter.lastmod ?? frontMatter.updated)
    const status = frontMatter.draft === true ? 'draft' : date ? 'published' : 'draft'

    const metadata = undefined

    const post: MomeiPost = {
        title,
        content,
        slug,
        summary: description || null,
        coverImage,
        metadata,
        language: 'zh-CN',
        translationId: null,
        category,
        tags,
        status,
        visibility: 'public',
        createdAt: date,
        publishedAt: date,
    }

    if (updatedDate !== undefined) {
        post.updatedAt = updatedDate
    }

    return post
}

/**
 * Hugo Parser — 实现 ContentParser 接口
 */
export class HugoParser implements ContentParser {
    async parse(sourceDir: string, verbose?: boolean): Promise<ParsedPost[]> {
        const files = await scanMarkdownFiles(sourceDir)

        if (verbose) {
            console.log(`Found ${files.length} markdown files in ${sourceDir}`)
        }

        const results: ParsedPost[] = []

        for (const file of files) {
            try {
                const { frontMatter, content } = await parseHugoMarkdown(file)
                const relativeFile = relative(sourceDir, file)
                const post = convertHugoToMomeiPost(frontMatter, content, relativeFile)
                results.push({ file, relativeFile, content, post })

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
}
