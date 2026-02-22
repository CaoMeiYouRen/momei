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
}

/**
 * TTS 元数据
 */
export interface PostTTSMetadata {
    provider?: string | null
    voice?: string | null
    generatedAt?: string | Date | null
}

/**
 * 大纲元数据
 */
export interface PostScaffoldMetadata {
    outline?: string | null
    metadata?: Record<string, unknown> | null
}

/**
 * 集成元数据
 */
export interface PostIntegrationMetadata {
    memosId?: string | null
}

/**
 * 文章统一元数据结构
 */
export interface PostMetadata {
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
    // 音频相关 (Podcast)
    /** @deprecated 请改用 metadata.audio.url */
    audioUrl?: string | null
    /** @deprecated 请改用 metadata.audio.duration */
    audioDuration?: number | null
    /** @deprecated 请改用 metadata.audio.size */
    audioSize?: number | null
    /** @deprecated 请改用 metadata.audio.mimeType */
    audioMimeType?: string | null
    /** @deprecated 请改用 metadata.tts.provider */
    ttsProvider?: string | null
    /** @deprecated 请改用 metadata.tts.voice */
    ttsVoice?: string | null
    /** @deprecated 请改用 metadata.tts.generatedAt */
    ttsGeneratedAt?: string | Date | null
    // AI 与元数据
    /** @deprecated 请改用 metadata.scaffold.outline */
    scaffoldOutline?: string | null
    /** @deprecated 请改用 metadata.scaffold.metadata */
    scaffoldMetadata?: Record<string, unknown> | null
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
    /** @deprecated 请改用 metadata.integration.memosId */
    memosId?: string | null
    // 权限标记 (前端辅助)
    locked?: boolean
    reason?: string
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
