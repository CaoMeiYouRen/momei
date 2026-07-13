/**
 * Shared type definitions for Momei API
 * Extracted from CLI and MCP packages to eliminate duplication
 */

// ===== Enums & Literal Types =====

export type MomeiPostStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'hidden' | 'scheduled'
export type MomeiPostVisibility = 'public' | 'private' | 'password' | 'registered' | 'subscriber'

// ===== Post Types =====

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

export interface MomeiPost {
    title: string
    content: string
    slug?: string
    summary?: string | null
    coverImage?: string | null
    metadata?: MomeiPostMetadata | null
    metaVersion?: number
    language?: string
    translationId?: string | null
    category?: string | null
    categoryId?: string | null
    tags?: string[]
    copyright?: string | null
    status?: MomeiPostStatus
    visibility?: MomeiPostVisibility
    password?: string | null
    pushOption?: 'none' | 'draft' | 'now'
    syncToMemos?: boolean
    pushCriteria?: MomeiPublishIntent['pushCriteria']
    createdAt?: string | Date
    publishedAt?: string | Date
    views?: number
}

export interface MomeiPostListQuery {
    status?: MomeiPostStatus
    language?: string
    search?: string
    /** Category slug or ID */
    category?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'ASC' | 'DESC'
}

export interface MomeiPostListResponse {
    items: MomeiPost[]
    total: number
    page: number
    limit: number
}

// ===== Category Types =====

export interface MomeiCategory {
    id: string
    name: string
    slug: string
    description: string | null
    parentId: string | null
    language: string
    translationId: string | null
    postCount?: number
    createdAt: string
    updatedAt: string
}

export interface MomeiCategoryBody {
    name: string
    slug: string
    description?: string | null
    parentId?: string | null
    language?: string
    translationId?: string | null
}

export interface MomeiCategoryListQuery {
    language?: string
    search?: string
    parentId?: string
    aggregate?: boolean
    page?: number
    limit?: number
    orderBy?: string
    order?: 'ASC' | 'DESC'
}

export interface MomeiCategoryListResponse {
    items: MomeiCategory[]
    total: number
    page: number
    limit: number
}

// ===== Tag Types =====

export interface MomeiTag {
    id: string
    name: string
    slug: string
    language: string
    translationId: string | null
    postCount?: number
    createdAt: string
    updatedAt: string
}

export interface MomeiTagBody {
    name: string
    slug: string
    language?: string
    translationId?: string | null
}

export interface MomeiTagListQuery {
    language?: string
    search?: string
    aggregate?: boolean
    page?: number
    limit?: number
    orderBy?: string
    order?: 'ASC' | 'DESC'
}

export interface MomeiTagListResponse {
    items: MomeiTag[]
    total: number
    page: number
    limit: number
}

// ===== Snippet Types =====

export interface MomeiSnippet {
    id: string
    content: string
    media: string[] | null
    audioUrl: string | null
    audioTranscription: string | null
    source: string
    metadata: Record<string, unknown> | null
    status: 'inbox' | 'converted' | 'archived'
    postId: string | null
    authorId: string
    createdAt: string
    updatedAt: string
}

export interface MomeiSnippetBody {
    content: string
    media?: string[]
    audioUrl?: string
    source?: string
    status?: 'inbox' | 'converted' | 'archived'
    metadata?: Record<string, unknown>
}

export interface MomeiSnippetListQuery {
    status?: 'inbox' | 'converted' | 'archived'
    source?: string
    search?: string
    page?: number
    limit?: number
}

export interface MomeiSnippetListResponse {
    items: MomeiSnippet[]
    total: number
    page: number
    limit: number
}

export interface MomeiSnippetConvertResult {
    postId: string
    snippetId: string
    url: string
}

// ===== Post Version Types =====

export interface MomeiPostVersion {
    id: string
    postId: string
    sequence: number
    parentVersionId: string | null
    restoredFromVersionId: string | null
    source: string
    commitSummary: string
    changedFields: string[]
    snapshotHash: string
    createdAt: string
    authorId: string
    author: { id: string, name: string, image?: string | null } | null
}

export interface MomeiPostVersionListResponse {
    items: MomeiPostVersion[]
    total: number
}

export interface MomeiCreateVersionResponse {
    created: boolean
    version: MomeiPostVersion
}

// ===== AI/Task Types =====

export interface MomeiAutomationTaskStartResponse {
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    estimatedCost?: number
    estimatedQuotaUnits?: number
}

export interface MomeiAutomationTaskStatusResponse {
    id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    error?: string | null
    updatedAt?: string | Date
    result?: Record<string, unknown> | string
    audioUrl?: string | null
}

export interface MomeiSuggestTitlesPayload {
    content: string
    language?: string
}

export interface MomeiRecommendTagsPayload {
    content: string
    existingTags?: string[]
    language?: string
}

export interface MomeiRecommendCategoriesPayload {
    postId: string
    targetLanguage: string
    sourceLanguage?: string
    limit?: number
}

export interface MomeiCategoryRecommendationCandidate {
    id: string
    name: string
    slug: string
    language: string
    reason: 'translation-cluster' | 'translated-name' | 'translated-slug' | 'ai-recommended'
}

export interface MomeiCategoryRecommendationResult {
    sourceCategory: {
        id: string
        name: string
        slug: string
        language: string
    } | null
    matchedCategoryId: string | null
    candidates: MomeiCategoryRecommendationCandidate[]
    proposedCategory: {
        name: string
        slug: string
        reason: 'translated-source-name'
    } | null
}

export type MomeiTranslatePostSlugStrategy = 'source' | 'translate' | 'ai'
export type MomeiTranslatePostCategoryStrategy = 'cluster' | 'suggest'
export type MomeiTranslatePostConfirmationMode = 'auto' | 'require' | 'confirmed'

export interface MomeiTranslatePostRequest {
    sourcePostId: string
    targetLanguage: string
    sourceLanguage?: string
    targetPostId?: string | null
    scopes?: ('title' | 'content' | 'summary' | 'category' | 'tags' | 'coverImage' | 'audio')[]
    targetStatus?: 'draft' | 'pending'
    slugStrategy?: MomeiTranslatePostSlugStrategy
    categoryStrategy?: MomeiTranslatePostCategoryStrategy
    confirmationMode?: MomeiTranslatePostConfirmationMode
    previewTaskId?: string
    approvedSlug?: string | null
    approvedCategoryId?: string | null
}

export interface MomeiCoverImagePayload {
    prompt: string
    postId: string
    model?: string
    size?: string
    aspectRatio?: string
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
    n?: number
}

export interface MomeiCreateTTSPayload {
    postId?: string
    text?: string
    provider?: string
    mode?: 'speech' | 'podcast'
    voice: string
    model?: string
    script?: string
    options?: Record<string, unknown>
}

// ===== Link Governance Types =====

export type MomeiLinkGovernanceScope =
    | 'asset-url'
    | 'post-link'
    | 'category-link'
    | 'tag-link'
    | 'archive-link'
    | 'page-link'
    | 'permalink-rule'

export type MomeiLinkGovernanceSourceKind = 'absolute' | 'root-relative' | 'relative' | 'path-rule'
export type MomeiLinkGovernanceMatchMode = 'exact' | 'prefix' | 'pattern'
export type MomeiLinkGovernanceTargetType = 'asset' | 'post' | 'category' | 'tag' | 'archive' | 'page'
export type MomeiLinkGovernanceMode = 'dry-run' | 'apply'
export type MomeiLinkGovernanceValidationMode = 'static' | 'static+online'

export interface MomeiLinkGovernanceMappingSeed {
    source: string
    sourceKind: MomeiLinkGovernanceSourceKind
    matchMode: MomeiLinkGovernanceMatchMode
    scope: MomeiLinkGovernanceScope
    targetType: MomeiLinkGovernanceTargetType
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

export interface MomeiLinkGovernanceRequest {
    scopes: MomeiLinkGovernanceScope[]
    filters?: {
        domains?: string[]
        pathPrefixes?: string[]
        contentTypes?: ('post' | 'category' | 'tag' | 'page' | 'asset-record')[]
    }
    seeds?: MomeiLinkGovernanceMappingSeed[]
    options?: {
        reportFormat?: 'json' | 'markdown'
        validationMode?: MomeiLinkGovernanceValidationMode
        allowRelativeLinks?: boolean
        retryFailuresFromReportId?: string
        skipConfirmation?: boolean
    }
}

export interface MomeiLinkGovernanceReportData {
    reportId: string
    mode: MomeiLinkGovernanceMode
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
        scope: MomeiLinkGovernanceScope
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

// ===== Import Validation Types =====

export interface MomeiImportPostRequest {
    title: string
    content: string
    slug?: string
    summary?: string | null
    coverImage?: string | null
    language?: string
    translationId?: string | null
    category?: string | null
    categoryId?: string | null
    tags?: string[]
    copyright?: string | null
    status?: MomeiPostStatus
    visibility?: MomeiPostVisibility
    password?: string | null
    pushOption?: 'none' | 'draft' | 'now'
    syncToMemos?: boolean
    abbrlink?: string
    permalink?: string
    sourceFile?: string
    confirmPathAliases?: boolean
}

export type MomeiImportPathAliasField = 'slug' | 'abbrlink' | 'permalink' | 'canonical'
export type MomeiImportPathAliasStatus = 'accepted' | 'fallback' | 'repaired' | 'invalid' | 'conflict' | 'needs-confirmation' | 'skipped'

export interface MomeiImportPathAliasReportItem {
    field: MomeiImportPathAliasField
    status: MomeiImportPathAliasStatus
    originalValue: string | null
    resolvedValue: string | null
    reason: string
    message: string
}

export interface MomeiImportPathAliasReport {
    language: string
    canonicalSlug: string | null
    canonicalSource: 'slug' | 'abbrlink' | 'source-file' | 'title' | 'repair' | 'fallback' | null
    canImport: boolean
    requiresConfirmation: boolean
    hasBlockingIssues: boolean
    summary: Record<MomeiImportPathAliasStatus, number>
    items: MomeiImportPathAliasReportItem[]
}
