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
}

/**
 * 文章状态转换定义
 * 键为当前状态，值为可以转换到的目标状态列表
 */
export const POST_STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
    [PostStatus.DRAFT]: [PostStatus.PENDING, PostStatus.PUBLISHED, PostStatus.HIDDEN],
    [PostStatus.PENDING]: [PostStatus.PUBLISHED, PostStatus.REJECTED, PostStatus.DRAFT, PostStatus.HIDDEN],
    [PostStatus.PUBLISHED]: [PostStatus.HIDDEN, PostStatus.DRAFT, PostStatus.PENDING],
    [PostStatus.REJECTED]: [PostStatus.DRAFT, PostStatus.PENDING, PostStatus.HIDDEN],
    [PostStatus.HIDDEN]: [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.PENDING],
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
    audioUrl?: string | null
    audioDuration?: number | null
    audioSize?: number | null
    audioMimeType?: string | null
    // 归类与元数据
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
    // 其他
    copyright?: string | null
    // 权限标记 (前端辅助)
    locked?: boolean
    reason?: string
}
