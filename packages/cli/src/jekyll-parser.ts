import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import matter from 'gray-matter'
import { CORE_SCHEMA, binaryTag, load as loadYaml, mergeTag, omapTag, pairsTag, setTag, timestampTag } from 'js-yaml'
import type { MomeiPost } from '@momei-blog/api-client'
import type { ContentParser, ParsedPost } from './types'
import { scanMarkdownFiles } from './parser'

// --- Jekyll Front-matter 数据结构 ---

/**
 * Jekyll 仅支持 YAML Front-matter（`---` 包裹）。
 * 常用字段：title / date / tags / categories / published / excerpt。
 * `permalink` 保留在索引签名中但不参与 canonical slug；slug 由文件名或 `slug` 字段决定。
 */
export interface JekyllFrontMatter {
    title?: string
    date?: string | Date
    last_modified_at?: string | Date
    tags?: string | string[]
    tag?: string
    categories?: string | string[]
    category?: string
    slug?: string
    published?: boolean
    excerpt?: string
    description?: string
    image?: string
    [key: string]: unknown
}

// --- Helper functions ---

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

function normalizeStringArray(value?: unknown, splitWhitespace = false): string[] | undefined {
    if (Array.isArray(value)) {
        const items = value
            .map((item) => typeof item === 'string' ? item.trim() : '')
            .filter(Boolean)
        return items.length > 0 ? items : undefined
    }
    if (typeof value === 'string') {
        // Jekyll 对复数键（tags / categories）的字符串写法按空白拆分为多项；
        // 单数键（tag / category）保持整串语义，因此由调用方决定是否拆分。
        const items = (splitWhitespace ? value.split(/\s+/) : [value])
            .map((item) => item.trim())
            .filter(Boolean)
        return items.length > 0 ? items : undefined
    }
    return undefined
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

/**
 * Jekyll 的主日期来源是文件名前缀 `YYYY-MM-DD-`（官方文档的常规写法），
 * front matter 的 `date` 缺失时按文件名日期补齐，避免已发布文章被降级为草稿。
 * 按 UTC 构造以保证跨机/跨时区确定性。
 */
function resolveFilenameDate(filePath: string) {
    const fileName = filePath.split(/[/\\]/).pop() || ''
    const match = fileName.match(/^(\d{4})-(\d{2})-(\d{2})-/)

    if (!match) {
        return undefined
    }

    const [, year, month, day] = match
    const yearNumber = Number(year)
    const monthNumber = Number(month)
    const dayNumber = Number(day)
    const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber))

    // Date.UTC 会把 13 月 / 45 日滚动到下一个月/年，必须回读校验才是合法的文件名日期
    if (
        date.getUTCFullYear() !== yearNumber
        || date.getUTCMonth() !== monthNumber - 1
        || date.getUTCDate() !== dayNumber
    ) {
        return undefined
    }

    return date.toISOString()
}

/**
 * 从 Jekyll 文件名推导 slug。
 * Jekyll 文章约定为 `YYYY-MM-DD-slug.md`，需要剥离日期前缀；页面包 `index.md` 取父目录名。
 */
function deriveSlug(filePath: string) {
    const segments = filePath.replace(/\.md$/i, '').split(/[/\\]/)
    const lastSegment = segments[segments.length - 1] || ''

    if ((lastSegment === 'index' || lastSegment === '_index') && segments.length >= 2) {
        return segments[segments.length - 2] || ''
    }

    return lastSegment.replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

// --- YAML Engine (reuse same tab fix as Hexo / Hugo parser) ---

function createYamlEngine() {
    return {
        parse: (input: string) => {
            const normalized = input.replace(/\t/g, '  ')
            if (!normalized.trim()) {
                return {}
            }
            return loadYaml(normalized, {
                schema: CORE_SCHEMA.withTags(timestampTag, mergeTag, binaryTag, setTag, omapTag, pairsTag),
            }) as Record<string, unknown>
        },
    }
}

/**
 * 解析 Jekyll Markdown 文件（YAML Front-matter）
 */
export async function parseJekyllMarkdown(filePath: string): Promise<{ frontMatter: JekyllFrontMatter, content: string }> {
    const fileContent = await readFile(filePath, 'utf-8')
    const { data, content } = matter(fileContent, {
        engines: {
            yaml: createYamlEngine(),
        },
        language: 'yaml',
    })

    return {
        frontMatter: data as JekyllFrontMatter,
        content: content.trim(),
    }
}

/**
 * 转换 Jekyll Front-matter 到 Momei Post 格式
 */
export function convertJekyllToMomeiPost(frontMatter: JekyllFrontMatter, content: string, filePath: string): MomeiPost {
    const title = pickFirstString(frontMatter.title) || 'Untitled'
    // Jekyll 语义：单数键 tag / category 优先（整串为单值），复数键标签按空白拆分；
    // categories 在墨梅单分类模型下取拆分后的首项（有意简化，与 Jekyll 的多分类 URL 语义不同）。
    const tags = normalizeStringArray(frontMatter.tag) || normalizeStringArray(frontMatter.tags, true)
    const category = normalizeStringArray(frontMatter.category)?.[0]
        ?? normalizeStringArray(frontMatter.categories, true)?.[0]
        ?? null
    const slug = pickFirstString(frontMatter.slug) || deriveSlug(filePath)
    const summary = pickFirstString(frontMatter.description, frontMatter.excerpt) || null
    const coverImage = pickFirstString(frontMatter.image) || null
    const date = toIsoDateString(frontMatter.date) ?? resolveFilenameDate(filePath)
    const updatedDate = toIsoDateString(frontMatter.last_modified_at)
    const isUnpublished = frontMatter.published === false

    const post: MomeiPost = {
        title,
        content,
        slug,
        summary,
        coverImage,
        metadata: undefined,
        language: 'zh-CN',
        translationId: null,
        category,
        tags,
        status: isUnpublished || !date ? 'draft' : 'published',
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
 * Jekyll Parser — 实现 ContentParser 接口
 */
export class JekyllParser implements ContentParser {
    async parse(sourceDir: string, verbose?: boolean): Promise<ParsedPost[]> {
        const files = await scanMarkdownFiles(sourceDir)

        if (verbose) {
            console.log(`Found ${files.length} markdown files in ${sourceDir}`)
        }

        const results: ParsedPost[] = []

        for (const file of files) {
            try {
                const { frontMatter, content } = await parseJekyllMarkdown(file)
                const relativeFile = relative(sourceDir, file)
                const post = convertJekyllToMomeiPost(frontMatter, content, relativeFile)
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
