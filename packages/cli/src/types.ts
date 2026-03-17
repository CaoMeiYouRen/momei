/**
 * Hexo Front-matter 数据结构
 */
export interface HexoFrontMatter {
    title?: string
    date?: string | Date
    updated?: string | Date
    tags?: string | string[]
    categories?: string | string[]
    category?: string | string[]
    slug?: string
    abbrlink?: string
    permalink?: string
    excerpt?: string
    description?: string
    desc?: string
    disableComment?: boolean
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

export type MomeiPostStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'hidden' | 'scheduled'
export type MomeiPostVisibility = 'public' | 'private' | 'password' | 'registered' | 'subscriber'

export interface MomeiPostAudioMetadata {
    url?: string | null
    duration?: number | null
    size?: number | null
    mimeType?: string | null
    language?: string | null
}

export interface MomeiPostScaffoldMetadata {
    outline?: string | null
    metadata?: Record<string, unknown> | null
}

export interface MomeiPublishIntent {
    syncToMemos?: boolean
    pushOption?: 'none' | 'draft' | 'now'
    pushCriteria?: {
        categoryIds?: string[]
        tagIds?: string[]
    }
}

export interface MomeiPostMetadata {
    audio?: MomeiPostAudioMetadata
    scaffold?: MomeiPostScaffoldMetadata
    publish?: {
        intent?: MomeiPublishIntent | null
    }
    integration?: {
        memosId?: string | null
    }
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
    metadata?: MomeiPostMetadata | null
    metaVersion?: number

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
    status?: MomeiPostStatus
    visibility?: MomeiPostVisibility
    password?: string | null
    pushOption?: 'none' | 'draft' | 'now'
    syncToMemos?: boolean
    pushCriteria?: MomeiPublishIntent['pushCriteria']

    // 元数据
    createdAt?: string | Date
    publishedAt?: string | Date
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

export interface CliAutomationTaskStartResponse {
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    estimatedCost?: number
    estimatedQuotaUnits?: number
}

export interface CliAutomationTaskStatusResponse {
    id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    error?: string | null
    updatedAt?: string | Date
    result?: Record<string, unknown> | string
    audioUrl?: string | null
}

export type CliTranslatePostSlugStrategy = 'source' | 'translate' | 'ai'
export type CliTranslatePostCategoryStrategy = 'cluster' | 'suggest'
export type CliTranslatePostConfirmationMode = 'auto' | 'require' | 'confirmed'

export interface CliCategoryRecommendationCandidate {
    id: string
    name: string
    slug: string
    language: string
    reason: 'translation-cluster' | 'translated-name' | 'translated-slug' | 'ai-recommended'
}

export interface CliCategoryRecommendationResult {
    sourceCategory: {
        id: string
        name: string
        slug: string
        language: string
    } | null
    matchedCategoryId: string | null
    candidates: CliCategoryRecommendationCandidate[]
    proposedCategory: {
        name: string
        slug: string
        reason: 'translated-source-name'
    } | null
}

export interface CliTranslatePostRequest {
    sourcePostId: string
    targetLanguage: string
    sourceLanguage?: string
    targetPostId?: string | null
    scopes?: ('title' | 'content' | 'summary' | 'category' | 'tags' | 'coverImage' | 'audio')[]
    targetStatus?: 'draft' | 'pending'
    slugStrategy?: CliTranslatePostSlugStrategy
    categoryStrategy?: CliTranslatePostCategoryStrategy
    confirmationMode?: CliTranslatePostConfirmationMode
    previewTaskId?: string
    approvedSlug?: string | null
    approvedCategoryId?: string | null
}
