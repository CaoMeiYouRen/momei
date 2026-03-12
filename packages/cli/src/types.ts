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

export type CliLinkGovernanceScope =
    | 'asset-url'
    | 'post-link'
    | 'category-link'
    | 'tag-link'
    | 'archive-link'
    | 'page-link'
    | 'permalink-rule'

export type CliLinkGovernanceSourceKind = 'absolute' | 'root-relative' | 'relative' | 'path-rule'
export type CliLinkGovernanceMatchMode = 'exact' | 'prefix' | 'pattern'
export type CliLinkGovernanceTargetType = 'asset' | 'post' | 'category' | 'tag' | 'archive' | 'page'
export type CliLinkGovernanceMode = 'dry-run' | 'apply'
export type CliLinkGovernanceValidationMode = 'static' | 'static+online'

export interface CliLinkGovernanceMappingSeed {
    source: string
    sourceKind: CliLinkGovernanceSourceKind
    matchMode: CliLinkGovernanceMatchMode
    scope: CliLinkGovernanceScope
    targetType: CliLinkGovernanceTargetType
    targetRef: {
        id?: string
        slug?: string
        translationId?: string
        locale?: string
        objectKey?: string
        pageKey?: 'about' | 'friend-links' | 'feedback' | 'submit' | 'privacy-policy' | 'user-agreement'
        archiveKey?: { year?: number, month?: number }
    }
    redirectMode?: 'rewrite-only' | 'redirect-seed' | 'alias-only'
    notes?: string
}

export interface CliLinkGovernanceRequest {
    scopes: CliLinkGovernanceScope[]
    filters?: {
        domains?: string[]
        pathPrefixes?: string[]
        contentTypes?: ('post' | 'category' | 'tag' | 'page' | 'asset-record')[]
    }
    seeds?: CliLinkGovernanceMappingSeed[]
    options?: {
        reportFormat?: 'json' | 'markdown'
        validationMode?: CliLinkGovernanceValidationMode
        allowRelativeLinks?: boolean
        retryFailuresFromReportId?: string
        skipConfirmation?: boolean
    }
}

export interface CliLinkGovernanceReportData {
    reportId: string
    mode: CliLinkGovernanceMode
    summary: {
        total: number
        resolved: number
        rewritten: number
        unchanged: number
        skipped: number
        failed: number
        needsConfirmation: number
    }
    items: {
        sourceValue: string
        targetValue: string | null
        scope: CliLinkGovernanceScope
        contentType: 'post' | 'category' | 'tag' | 'page' | 'asset-record'
        contentId: string
        status: 'resolved' | 'rewritten' | 'unchanged' | 'skipped' | 'failed' | 'needs-confirmation'
        field?: 'content' | 'coverImage' | 'metadata.audio.url'
    }[]
    redirectSeeds: {
        source: string
        target: string
        statusCode: 301 | 302
        reason: 'legacy-permalink' | 'path-rule' | 'asset-domain-migration'
    }[]
    markdown?: string | null
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
