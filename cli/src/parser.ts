import { readFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'
import type { HexoFrontMatter, MomeiPost } from './types.js'

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
    // 处理标签：支持字符串或数组
    const tags = Array.isArray(frontMatter.tags)
        ? frontMatter.tags
        : typeof frontMatter.tags === 'string'
            ? [frontMatter.tags]
            : undefined

    // 处理分类：Hexo可能有多个分类，但Momei只支持单个分类
    // 取第一个分类作为主分类
    const category = Array.isArray(frontMatter.categories)
        ? frontMatter.categories[0] || null
        : typeof frontMatter.categories === 'string'
            ? frontMatter.categories
            : null

    // 生成 slug：优先使用 permalink，否则从文件名提取
    let slug = frontMatter.permalink
    if (!slug) {
        const fileName = filePath.split(/[/\\]/).pop() || ''
        slug = fileName.replace(/\.md$/, '')
    }

    // 处理发布时间
    let createdAt: string | undefined
    if (frontMatter.date) {
        const date = typeof frontMatter.date === 'string' ? new Date(frontMatter.date) : frontMatter.date
        createdAt = date.toISOString()
    }

    // 判断文章状态：如果有日期则设为published，否则为draft
    const status = createdAt ? 'published' : 'draft'

    // 构建 Momei Post 对象（必须与 createPostSchema 保持一致）
    const post: MomeiPost = {
        // 基本字段
        title: frontMatter.title || 'Untitled',
        content,
        slug,

        // 描述性字段
        summary: frontMatter.excerpt || null,

        // 语言和翻译
        language: frontMatter.lang || 'zh-CN',

        // 分类和标签
        category,
        tags,

        // 状态和可见性
        status,
        visibility: 'public',

        // 其他字段
        createdAt,
    }

    return post
}

/**
 * 批量解析 Hexo 文件
 */
export async function parseHexoFiles(sourceDir: string, verbose = false): Promise<Array<{ file: string, post: MomeiPost }>> {
    const files = await scanMarkdownFiles(sourceDir)

    if (verbose) {
        console.log(`Found ${files.length} markdown files in ${sourceDir}`)
    }

    const results: Array<{ file: string, post: MomeiPost }> = []

    for (const file of files) {
        try {
            const { frontMatter, content } = await parseHexoMarkdown(file)
            const post = convertToMomeiPost(frontMatter, content, relative(sourceDir, file))
            results.push({ file, post })

            if (verbose) {
                console.log(`✓ Parsed: ${relative(sourceDir, file)}`)
            }
        } catch (error) {
            if (verbose) {
                console.error(`✗ Failed to parse ${relative(sourceDir, file)}:`, error)
            }
        }
    }

    return results
}
