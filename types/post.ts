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
    [PostStatus.DRAFT]: [PostStatus.PENDING],
    [PostStatus.PENDING]: [PostStatus.PUBLISHED, PostStatus.REJECTED, PostStatus.DRAFT],
    [PostStatus.PUBLISHED]: [PostStatus.HIDDEN, PostStatus.DRAFT],
    [PostStatus.REJECTED]: [PostStatus.DRAFT],
    [PostStatus.HIDDEN]: [PostStatus.PUBLISHED, PostStatus.DRAFT],
}
