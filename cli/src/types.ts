/**
 * Hexo Front-matter 数据结构
 */
export interface HexoFrontMatter {
    title: string
    date?: string | Date
    updated?: string | Date
    tags?: string | string[]
    categories?: string | string[]
    permalink?: string
    excerpt?: string
    disableComment?: boolean
    lang?: string
    [key: string]: any
}

/**
 * Momei API 文章数据结构
 */
export interface MomeiPost {
    title: string
    content: string
    excerpt?: string
    slug?: string
    status?: 'draft' | 'published'
    publishedAt?: string
    tags?: string[]
    categories?: string[]
    lang?: string
    metadata?: Record<string, any>
}

/**
 * CLI 配置选项
 */
export interface CliOptions {
    apiUrl: string
    apiKey: string
    source: string
    dryRun?: boolean
    verbose?: boolean
    concurrency?: number
}

/**
 * 导入结果
 */
export interface ImportResult {
    success: boolean
    file: string
    postId?: number
    error?: string
}

/**
 * 导入统计
 */
export interface ImportStats {
    total: number
    success: number
    failed: number
    skipped: number
    results: ImportResult[]
}
