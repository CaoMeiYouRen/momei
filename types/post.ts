import type {
    AIVisualAssetApplyMode,
    AIVisualAssetUsage,
    AIVisualPromptDimensions,
} from './ai'

/**
 * 文章状态枚举
 */
export enum PostStatus {
    /**
     * 草稿：仅作者可见，可编辑
     */
    DRAFT = 'draft',
    /**
     * 待审核：作者已提交，等待管理员审核
     */
    PENDING = 'pending',
    /**
     * 已发布：全网可见
     */
    PUBLISHED = 'published',
    /**
     * 被拒绝：管理员审核未通过，作者可见，可修改后重新提交
     */
    REJECTED = 'rejected',
    /**
     * 已隐藏：管理员或作者隐藏，不直接显示在列表，但可以通过链接访问（或完全隐藏）
     */
    HIDDEN = 'hidden',
    /**
     * 定时发布：已设定未来时间，等待系统自动发布
     */
    SCHEDULED = 'scheduled',
}

/**
 * 文章状态转换定义
 * 键为当前状态，值为可以转换到的目标状态列表
 */
export const POST_STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
    [PostStatus.DRAFT]: [PostStatus.PENDING, PostStatus.PUBLISHED, PostStatus.HIDDEN, PostStatus.SCHEDULED],
    [PostStatus.PENDING]: [PostStatus.PUBLISHED, PostStatus.REJECTED, PostStatus.DRAFT, PostStatus.HIDDEN, PostStatus.SCHEDULED],
    [PostStatus.PUBLISHED]: [PostStatus.HIDDEN, PostStatus.DRAFT, PostStatus.PENDING, PostStatus.SCHEDULED],
    [PostStatus.REJECTED]: [PostStatus.DRAFT, PostStatus.PENDING, PostStatus.HIDDEN, PostStatus.SCHEDULED],
    [PostStatus.HIDDEN]: [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.PENDING, PostStatus.SCHEDULED],
    [PostStatus.SCHEDULED]: [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.PENDING, PostStatus.HIDDEN],
}

/**
 * 文章可见性策略枚举
 */
export enum PostVisibility {
    /**
     * 公开：所有人可见
     */
    PUBLIC = 'public',
    /**
     * 私密：仅作者和管理员可见
     */
    PRIVATE = 'private',
    /**
     * 密码保护：需要输入正确密码可见
     */
    PASSWORD = 'password',
    /**
     * 登录可见：仅限注册用户登录后可见
     */
    REGISTERED = 'registered',
    /**
     * 订阅可见：仅限订阅者可见
     */
    SUBSCRIBER = 'subscriber',
}

/**
 * 音频元数据
 */
export interface PostAudioMetadata {
    url?: string | null
    duration?: number | null
    size?: number | null
    mimeType?: string | null
    language?: string | null
    translationId?: string | null
    postId?: string | null
    mode?: 'speech' | 'podcast' | null
}

export interface PostCoverMetadata {
    url?: string | null
    source?: 'ai' | 'upload' | 'manual' | null
    prompt?: string | null
    promptModel?: AIVisualPromptDimensions | null
    assetUsage?: AIVisualAssetUsage | null
    applyMode?: AIVisualAssetApplyMode | null
    language?: string | null
    translationId?: string | null
    postId?: string | null
    generatedAt?: string | Date | null
}

export interface PostVisualAssetMetadata {
    usage: AIVisualAssetUsage
    url?: string | null
    source?: 'ai' | 'upload' | 'manual' | null
    prompt?: string | null
    promptModel?: AIVisualPromptDimensions | null
    applyMode?: AIVisualAssetApplyMode | null
    language?: string | null
    translationId?: string | null
    postId?: string | null
    generatedAt?: string | Date | null
}

/**
 * TTS 元数据
 */
export interface PostTTSMetadata {
    provider?: string | null
    voice?: string | null
    generatedAt?: string | Date | null
    language?: string | null
    translationId?: string | null
    postId?: string | null
    mode?: 'speech' | 'podcast' | null
}

/**
 * 大纲元数据
 */
export interface PostScaffoldMetadata {
    outline?: string | null
    metadata?: Record<string, unknown> | null
}

export type PostHexoRepositoryProvider = 'github' | 'gitee'

export type PostDistributionChannel = 'memos' | 'wechatsync'

export type PostDistributionAction = 'create' | 'update' | 'republish' | 'retry' | 'terminate'

export type PostDistributionMode = 'update-existing' | 'republish-new'

export type PostDistributionStatus = 'idle' | 'delivering' | 'succeeded' | 'failed' | 'cancelled'

export type PostDistributionFailureReason =
    | 'auth_failed'
    | 'rate_limited'
    | 'network_error'
    | 'content_validation_failed'
    | 'remote_missing'
    | 'manual_terminated'
    | 'unknown'

export interface PostDistributionChannelState {
    status?: PostDistributionStatus | null
    remoteId?: string | null
    remoteUrl?: string | null
    lastMode?: PostDistributionMode | null
    lastAction?: PostDistributionAction | null
    lastAttemptId?: string | null
    activeAttemptId?: string | null
    lastAttemptAt?: string | Date | null
    activeSince?: string | Date | null
    lastSuccessAt?: string | Date | null
    lastFailureAt?: string | Date | null
    lastFinishedAt?: string | Date | null
    lastFailureReason?: PostDistributionFailureReason | null
    lastMessage?: string | null
    lastOperatorId?: string | null
    retryCount?: number | null
}

export interface PostDistributionTimelineEntry {
    id: string
    channel: PostDistributionChannel
    action: PostDistributionAction
    mode?: PostDistributionMode | null
    status: PostDistributionStatus
    triggeredBy?: 'manual' | 'retry' | 'system' | null
    operatorId?: string | null
    startedAt: string | Date
    finishedAt?: string | Date | null
    retryOfAttemptId?: string | null
    remoteId?: string | null
    remoteUrl?: string | null
    failureReason?: PostDistributionFailureReason | null
    message?: string | null
    details?: Record<string, unknown> | null
}

export interface PostDistributionMetadata {
    channels?: {
        memos?: PostDistributionChannelState | null
        wechatsync?: PostDistributionChannelState | null
    }
    timeline?: PostDistributionTimelineEntry[] | null
}

export interface PostHexoRepositorySyncState {
    provider?: PostHexoRepositoryProvider | null
    owner?: string | null
    repo?: string | null
    branch?: string | null
    filePath?: string | null
    remoteUrl?: string | null
    remoteSha?: string | null
    lastOperation?: 'sync' | 'retry' | null
    lastSyncedAt?: string | Date | null
    lastFailureAt?: string | Date | null
    lastFailureReason?: PostDistributionFailureReason | null
    lastMessage?: string | null
    lastOperatorId?: string | null
}

/**
 * 集成元数据
 */
export interface PostIntegrationMetadata {
    memosId?: string | null
    distribution?: PostDistributionMetadata | null
    hexoRepositorySync?: PostHexoRepositorySyncState | null
}

/**
 * 文章统一元数据结构
 */
export interface PostMetadata {
    cover?: PostCoverMetadata
    visualAssets?: PostVisualAssetMetadata[] | null
    audio?: PostAudioMetadata
    tts?: PostTTSMetadata
    scaffold?: PostScaffoldMetadata
    publish?: {
        intent?: PublishIntent | null
    }
    integration?: PostIntegrationMetadata
}

/**
 * 文章基础信息接口
 */
export interface Post {
    id: string
    title: string
    content: string
    summary?: string | null
    slug: string
    status: PostStatus
    visibility: PostVisibility
    password?: string | null
    coverImage?: string | null
    // AI 与元数据
    metadata?: PostMetadata | null
    metaVersion?: number
    // 归类与时间
    categoryId?: string | null
    category?: {
        id: string
        name: string
        slug: string
    } | null
    tags?: {
        id: string
        name: string
        slug: string
    }[] | null
    // 统计与时间
    views: number
    isPinned?: boolean
    publishedAt?: string | Date | null
    createdAt?: string | Date | null
    updatedAt?: string | Date | null
    // 作者
    authorId?: string
    author?: {
        id: string
        name: string
        image?: string | null
        emailHash?: string | null
    } | null
    // 国际化
    language: string
    translationId?: string | null
    translations?: Post[] | null
    // 发布意图 (副作用控制)
    /** @deprecated 请改用 metadata.publish.intent */
    publishIntent?: PublishIntent | null
    // 其他
    copyright?: string | null
    /** @deprecated 请改用 metadata.audio.url */
    audioUrl?: string | null
    /** @deprecated 请改用 metadata.audio.duration */
    audioDuration?: number | null
    /** @deprecated 请改用 metadata.audio.size */
    audioSize?: number | null
    /** @deprecated 请改用 metadata.audio.mimeType */
    audioMimeType?: string | null
    /** @deprecated 请改用 metadata.integration.memosId */
    memosId?: string | null
    // 权限标记 (前端辅助)
    locked?: boolean
    reason?: string
}

/**
 * 公开文章列表分页响应数据结构（/api/posts 返回）
 */
export interface PostListData {
    items: Post[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * 发布意图 (副作用控制选项)
 */
export interface PublishIntent {
    /**
     * 是否同步到 Memos
     */
    syncToMemos?: boolean
    /**
     * 推送通知选项
     */
    pushOption?: 'none' | 'draft' | 'now'
    /**
     * 推送筛选条件
     */
    pushCriteria?: {
        categoryIds?: string[]
        tagIds?: string[]
    }
}
