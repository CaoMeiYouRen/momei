/**
 * CLI-specific types
 * Shared API types are now in @momei-blog/api-client
 */

import type { MomeiPost } from '@momei-blog/api-client'

/**
 * Hexo Front-matter 数据结构
 */
export interface HexoFrontMatter {
    title?: string
    date?: string | Date
    updated?: string | Date
    updatedAt?: string | Date
    updated_at?: string | Date
    tags?: string | string[]
    categories?: string | string[]
    category?: string | string[]
    slug?: string
    abbrlink?: string
    permalink?: string
    excerpt?: string
    description?: string
    desc?: string
    views?: number | string
    view?: number | string
    disableComment?: boolean
    disable_comment?: boolean
    image?: string
    cover?: string
    thumb?: string
    copyright?: string
    license?: string
    language?: string
    lang?: string
    translationId?: string
    translation_id?: string
    audio?: string | Record<string, unknown>
    audio_url?: string
    audio_duration?: number | string
    audio_size?: number | string
    audio_mime_type?: string
    audio_language?: string
    audio_locale?: string
    media?: string
    mediatype?: string
    mediaType?: string
    medialength?: number | string
    mediaLength?: number | string
    duration?: number | string
    metadata?: {
        audio?: Record<string, unknown>
        [key: string]: unknown
    }
    [key: string]: unknown
}

/**
 * CLI-specific import post request (extends MomeiPost with import-only fields)
 */
export interface CliImportPostRequest extends MomeiPost {
    abbrlink?: string
    permalink?: string
    sourceFile?: string
    confirmPathAliases?: boolean
}

export interface ParsedHexoPost {
    file: string
    relativeFile: string
    frontMatter: HexoFrontMatter
    content: string
    post: MomeiPost
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
    postId?: number | string
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

export type CliUploadType = 'image' | 'audio' | 'file'

export interface CliDirectUploadRequest {
    filename: string
    contentType: string
    size: number
    type?: CliUploadType
    prefix?: string
}

export interface CliDirectUploadProxyStrategy {
    strategy: 'proxy'
}

export interface CliDirectUploadPresignStrategy {
    strategy: 'put-presign'
    method: 'PUT'
    url: string
    headers: Record<string, string>
    publicUrl: string
    objectKey: string
    expiresIn: number
}

export type CliDirectUploadAuthorization = CliDirectUploadProxyStrategy | CliDirectUploadPresignStrategy

/**
 * 通用 Content Parser 接口
 * 所有平台适配器（Hexo、Hugo 等）都实现该接口
 */
export interface ContentParser {
    /** 解析指定目录中的 Markdown 文件 */
    parse(sourceDir: string, verbose?: boolean): Promise<ParsedPost[]>
}

/**
 * 通用解析后文章结构
 */
export interface ParsedPost {
    file: string
    relativeFile: string
    content: string
    post: MomeiPost
}
