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

    // 处理分类：支持字符串或数组
    const categories = Array.isArray(frontMatter.categories)
        ? frontMatter.categories
        : typeof frontMatter.categories === 'string'
            ? [frontMatter.categories]
            : undefined

    // 生成 slug：优先使用 permalink，否则从文件名提取
    let slug = frontMatter.permalink
    if (!slug) {
        const fileName = filePath.split(/[/\\]/).pop() || ''
        slug = fileName.replace(/\.md$/, '')
    }

    // 处理发布时间
    let publishedAt: string | undefined
    if (frontMatter.date) {
        const date = typeof frontMatter.date === 'string' ? new Date(frontMatter.date) : frontMatter.date
        publishedAt = date.toISOString()
    }

    // 构建 Momei Post 对象
    const post: MomeiPost = {
        title: frontMatter.title || 'Untitled',
        content,
        excerpt: frontMatter.excerpt,
        slug,
        status: publishedAt ? 'published' : 'draft',
        publishedAt,
        tags,
        categories,
        lang: frontMatter.lang,
        metadata: {
            source: 'hexo',
            originalPath: filePath,
            updated: frontMatter.updated,
            disableComment: frontMatter.disableComment,
        },
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
