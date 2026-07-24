/**
 * WordPress Parser — WordPress eXtended RSS (WXR) 格式解析适配器
 *
 * 实现 ContentParser 接口，支持解析 WordPress 导出文件（WXR XML）中的文章，
 * 将其映射为统一的 ParsedPost 结构，供后续导入链路使用。
 *
 * WXR 引用: https://codex.wordpress.org/WordPress_Export
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { XMLParser, type X2jOptions } from 'fast-xml-parser'
import type { MomeiPost } from '@momei-blog/api-client'
import type { ContentParser, ParsedPost } from './types'

// --- 内部类型定义 ---

/** WXR 文档根结构 */
interface WxrDocument {
    rss?: {
        channel?: WxrChannel
    }
}

/** WXR channel 结构 */
interface WxrChannel {
    title?: string
    link?: string
    description?: string
    language?: string
    item?: WxrItem | WxrItem[]
}

/** WXR item（文章/页面）结构 */
export interface WxrItem {
    title?: string
    link?: string
    pubDate?: string
    'dc:creator'?: string
    'dc:date'?: string
    'content:encoded'?: string
    'excerpt:encoded'?: string
    'wp:post_id'?: string | number
    'wp:post_date'?: string
    'wp:post_date_gmt'?: string
    'wp:post_modified'?: string
    'wp:post_modified_gmt'?: string
    'wp:status'?: string
    'wp:post_name'?: string
    'wp:post_type'?: string
    'wp:menu_order'?: string | number
    'wp:is_sticky'?: string | number
    category?: WxrCategory | WxrCategory[]
    'wp:postmeta'?: WpPostmeta | WpPostmeta[]
}

/** WXR category/tag 分类条目 */
interface WxrCategory {
    '@_domain'?: string
    '@_nicename'?: string
    '#text'?: string
}

/** WXR post meta */
interface WpPostmeta {
    'wp:meta_key'?: string
    'wp:meta_value'?: string
}

// --- XML 解析器配置 ---

const XML_PARSER_OPTIONS: Partial<X2jOptions> = {
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    // 确保 item 和 category 总是数组（即使只有一项）
    isArray: (tagName: string) =>
        tagName === 'item'
        || tagName === 'category'
        || tagName === 'wp:postmeta',
    // 去除空文本节点
    trimValues: true,
    // 允许布尔值属性
    allowBooleanAttributes: true,
}

// --- 辅助函数 ---

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
 * 解析 wp:post_date 格式（"YYYY-MM-DD HH:MM:SS"）为 ISO 字符串
 */
function parseWpDate(value: unknown): string | undefined {
    if (!value || typeof value !== 'string') {
        return undefined
    }
    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }
    // 尝试直接解析（WXR 中常用 "YYYY-MM-DD HH:MM:SS" 格式）
    const date = new Date(trimmed.replace(' ', 'T'))
    if (Number.isNaN(date.getTime())) {
        return undefined
    }
    return date.toISOString()
}

/**
 * 提取 Category 标签中指定 domain 的条目名称列表
 */
function extractCategoriesByDomain(
    categories: WxrCategory | WxrCategory[] | undefined,
    domain: string,
): string[] | undefined {
    if (!categories) {
        return undefined
    }
    const items = Array.isArray(categories) ? categories : [categories]
    const names = items
        .filter((cat) => cat['@_domain'] === domain)
        .map((cat) => cat['#text'] || cat['@_nicename'] || '')
        .filter(Boolean)
    return names.length > 0 ? names : undefined
}

/**
 * 提取文章分类（category domain）
 * 只取第一个分类作为主分类（Momei 只支持单分类）
 */
function extractPrimaryCategory(categories: WxrCategory | WxrCategory[] | undefined): string | null {
    if (!categories) {
        return null
    }
    const items = Array.isArray(categories) ? categories : [categories]
    const postCategory = items.find((cat) => cat['@_domain'] === 'category')
    if (!postCategory) {
        return null
    }
    return postCategory['#text'] || postCategory['@_nicename'] || null
}

/**
 * 提取标签（post_tag domain）
 */
function extractTags(categories: WxrCategory | WxrCategory[] | undefined): string[] | undefined {
    return extractCategoriesByDomain(categories, 'post_tag')
}

// --- 状态映射 ---

/**
 * WordPress 发布状态 → Momei 状态映射
 */
function mapWpStatus(wpStatus: string | undefined): 'draft' | 'published' {
    // publish → published；其他状态（draft, pending, private, future）均视为 draft
    if (wpStatus === 'publish') {
        return 'published'
    }
    return 'draft'
}

// --- 文件名派生 slug ---

function deriveSlugFromTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'untitled'
}

// --- 导出: 转换函数（纯函数，可直接测试） ---

/**
 * 将 WXR item 转换为 MomeiPost
 */
export function convertWxrItemToMomeiPost(
    item: WxrItem,
    _filePath: string,
    channelLanguage?: string,
): MomeiPost {
    const title = pickFirstString(item.title) || 'Untitled'
    const content = typeof item['content:encoded'] === 'string' ? item['content:encoded'].trim() : ''
    const excerpt = typeof item['excerpt:encoded'] === 'string' ? item['excerpt:encoded'].trim() : ''

    // 日期优先级: dc:date > pubDate > wp:post_date_gmt > wp:post_date
    const dateStr = pickFirstString(
        item['dc:date'],
        item.pubDate,
        item['wp:post_date_gmt'],
        item['wp:post_date'],
    )
    const date = dateStr ? toIsoDateString(dateStr) : undefined

    const modifiedDateStr = pickFirstString(
        item['wp:post_modified_gmt'],
        item['wp:post_modified'],
    )
    const modifiedDate = modifiedDateStr ? parseWpDate(modifiedDateStr) : undefined

    const summary = excerpt || null
    const slug = pickFirstString(item['wp:post_name']) || deriveSlugFromTitle(title)
    const language = channelLanguage || 'zh-CN'

    const status = mapWpStatus(item['wp:status'])

    // 如果没有日期且状态为 published，回退为 draft
    const finalStatus = (!date && status === 'published') ? 'draft' : status

    // 分类与标签
    const categories = item.category
    const category = extractPrimaryCategory(categories)
    const tags = extractTags(categories)

    const post: MomeiPost = {
        title,
        content,
        slug,
        summary,
        language,
        translationId: null,
        category,
        tags,
        status: finalStatus,
        visibility: 'public',
        createdAt: date,
        publishedAt: date,
    }

    if (modifiedDate !== undefined) {
        post.updatedAt = modifiedDate
    }

    return post
}

// --- WordPressParser 类 ---

/**
 * WordPress WXR 解析适配器
 *
 * sourceDir 参数应指向 WordPress 导出的 WXR XML 文件（或包含 XML 文件的目录）。
 * 解析后返回 ParsedPost[]，仅包含 post_type='post' 的条目。
 */
export class WordPressParser implements ContentParser {
    private xmlParser: XMLParser

    constructor() {
        this.xmlParser = new XMLParser(XML_PARSER_OPTIONS)
    }

    async parse(sourceDir: string, verbose?: boolean): Promise<ParsedPost[]> {
        // 默认文件名为 wordpress.xml（可被目录下第一个 .xml 文件覆盖）
        let xmlFilePath = sourceDir

        // 尝试检测是否为目录：如果是目录，查找其中的 XML 文件
        // 注意：这里在运行时不使用 fs.stat 检查——我们直接尝试读取，
        // 如果失败则按目录处理
        try {
            const content = await readFile(xmlFilePath, 'utf-8')
            return this.parseXmlContent(content, xmlFilePath, verbose)
        } catch {
            // 不是文件或读取失败，按目录处理
            const { readdir } = await import('node:fs/promises')
            let xmlFiles: string[]
            try {
                const entries = await readdir(sourceDir)
                xmlFiles = entries
                    .filter((entry) => entry.endsWith('.xml'))
                    .map((entry) => resolve(sourceDir, entry))
            } catch {
                throw new Error(`Cannot read source: "${sourceDir}" is neither a valid WXR XML file nor a directory containing XML files`)
            }

            if (xmlFiles.length === 0) {
                throw new Error(`No XML files found in directory: "${sourceDir}"`)
            }

            if (verbose) {
                console.log(`Found ${xmlFiles.length} XML file(s) in ${sourceDir}, using first: ${xmlFiles[0]}`)
            }

            // 已通过 xmlFiles.length === 0 守卫确保非空
            xmlFilePath = xmlFiles[0] as string
            const content = await readFile(xmlFilePath, 'utf-8')
            return this.parseXmlContent(content, xmlFilePath, verbose)
        }
    }

    private parseXmlContent(xmlContent: string, filePath: string, verbose?: boolean): ParsedPost[] {
        const parsed = this.xmlParser.parse(xmlContent) as WxrDocument

        const channel = parsed?.rss?.channel
        if (!channel) {
            throw new Error('Invalid WXR file: missing <rss><channel> structure')
        }

        const channelLanguage = pickFirstString(channel.language)

        const rawItems = channel.item
        if (!rawItems) {
            if (verbose) {
                console.log('No items found in WXR file')
            }
            return []
        }

        const items = Array.isArray(rawItems) ? rawItems : [rawItems]
        if (verbose) {
            console.log(`Found ${items.length} items in WXR file`)
        }

        const results: ParsedPost[] = []

        for (const item of items) {
            // 只处理 post 类型（跳过 page、attachment、revision 等）
            const postType = item['wp:post_type']
            if (postType !== undefined && postType !== 'post') {
                if (verbose) {
                    console.log(`  ↷ Skipping non-post item: ${item.title || 'untitled'} (type: ${postType})`)
                }
                continue
            }

            try {
                // 使用标题作为相对路径标识
                const relativeFile = item['wp:post_name']
                    ? `${item['wp:post_name']}.xml`
                    : `post-${item['wp:post_id'] || 'unknown'}.xml`

                const fullPath = resolve(filePath, '..', relativeFile)
                const content = typeof item['content:encoded'] === 'string' ? item['content:encoded'].trim() : ''
                const post = convertWxrItemToMomeiPost(item, relativeFile, channelLanguage)

                results.push({ file: fullPath, relativeFile, content, post })

                if (verbose) {
                    console.log(`  ✓ ${post.title} (${relativeFile})`)
                }
            } catch (error) {
                if (verbose) {
                    console.error(`  ✗ Failed to parse item: ${item.title || 'untitled'}`, error)
                }
            }
        }

        return results
    }
}
