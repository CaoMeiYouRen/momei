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
