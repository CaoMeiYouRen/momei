/**
 * 评论状态枚举
 */
export enum CommentStatus {
    /**
     * 待审核
     */
    PENDING = 'pending',
    /**
     * 已发布
     */
    PUBLISHED = 'published',
    /**
     * 已标记为垃圾
     */
    SPAM = 'spam',
}

/**
 * 评论实体接口
 */
export interface Comment {
    id: string
    postId: string
    authorId: string | null
    parentId: string | null
    content: string
    authorName: string
    authorEmail?: string // 仅管理员可见
    authorEmailHash?: string // 用于前端渲染 Gravatar 头像 (SHA256)
    authorUrl: string | null
    status: CommentStatus
    ip?: string // 仅管理员可见
    userAgent?: string // 仅管理员可见
    isSticked: boolean
    likes: number
    createdAt: string
    updatedAt: string
    // 关联数据
    author?: {
        name: string
        image?: string
    }
    replies?: Comment[]
}
