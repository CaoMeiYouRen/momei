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
 * 注意：字段必须与 utils/schemas/post.ts 中的 createPostSchema 保持一致
 */
export interface MomeiPost {
    // 基本字段
    title: string
    content: string
    slug?: string

    // 描述性字段
    summary?: string | null
    coverImage?: string | null
    audioUrl?: string | null
    audioDuration?: number | null
    audioSize?: number | null
    audioMimeType?: string | null

    // 语言和翻译
    language?: string
    translationId?: string | null

    // 分类和标签
    category?: string | null
    categoryId?: string | null
    tags?: string[]

    // 版权信息
    copyright?: string | null

    // 状态和可见性
    status?: 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
    visibility?: 'public' | 'private' | 'password' | 'registered' | 'subscriber'
    password?: string | null

    // 元数据
    createdAt?: string | Date
    views?: number
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
