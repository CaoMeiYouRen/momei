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
