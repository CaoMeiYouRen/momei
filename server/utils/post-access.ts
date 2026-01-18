import { PostStatus, PostVisibility } from '@/types/post'
import type { Post } from '@/server/entities/post'
import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { isAdmin } from '@/utils/shared/roles'

/**
 * 文章访问控制结果
 */
export interface PostAccessResult {
    /**
     * 是否允许访问完整内容
     */
    allowed: boolean
    /**
     * 如果不允许访问，是否应该返回 404 (隐私保护/Stealth Mode)
     */
    shouldNotFound: boolean
    /**
     * 如果不允许访问，受限的原因
     */
    reason?: 'PASSWORD_REQUIRED' | 'AUTH_REQUIRED' | 'SUBSCRIPTION_REQUIRED'
    /**
     * 过滤后的文章数据（如果不允许访问完整内容，则移除敏感字段）
     */
    data?: Partial<Post>
}

/**
 * 校验用户是否有权访问完整文章内容
 * @param post 文章实体
 * @param session 当前会话
 * @param unlockedIds 已解锁的文章 ID 列表 (通常来自加密 Cookie)
 */
export async function checkPostAccess(
    post: Post,
    session: any | null,
    unlockedIds: string[] = [],
): Promise<PostAccessResult> {
    const user = session?.user
    const isOwner = user && user.id === post.authorId
    const isSystemAdmin = user && isAdmin(user.role)

    // 管理员和作者始终拥有完整访问权限
    if (isOwner || isSystemAdmin) {
        return { allowed: true, shouldNotFound: false }
    }

    // 1. 处理文章状态 (Status)
    // 非发布状态（草稿、待审核等）只有作者和管理员可见
    if (post.status !== PostStatus.PUBLISHED) {
        return { allowed: false, shouldNotFound: true }
    }

    // 2. 处理可见性 (Visibility)
    switch (post.visibility) {
        case PostVisibility.PRIVATE:
            // 私有状态：仅限作者和管理员（前面已经判断过了，此处必然是其他人）
            // 伪装成 404 (Stealth Mode)
            return { allowed: false, shouldNotFound: true }

        case PostVisibility.REGISTERED:
            // 登录可见：必须登录
            if (!user) {
                return {
                    allowed: false,
                    shouldNotFound: false,
                    reason: 'AUTH_REQUIRED',
                    data: filterSensitivePostData(post),
                }
            }
            break

        case PostVisibility.PASSWORD:
            // 密码保护：检查是否已通过密码验证
            if (!unlockedIds.includes(post.id)) {
                return {
                    allowed: false,
                    shouldNotFound: false,
                    reason: 'PASSWORD_REQUIRED',
                    data: filterSensitivePostData(post),
                }
            }
            break

        case PostVisibility.SUBSCRIBER: {
            // 订阅可见：必须是活跃订阅者
            if (!user) {
                return {
                    allowed: false,
                    shouldNotFound: false,
                    reason: 'AUTH_REQUIRED',
                    data: filterSensitivePostData(post),
                }
            }
            const isSub = await isUserSubscriber(user.id)
            if (!isSub) {
                return {
                    allowed: false,
                    shouldNotFound: false,
                    reason: 'SUBSCRIPTION_REQUIRED',
                    data: filterSensitivePostData(post),
                }
            }
            break
        }

        case PostVisibility.PUBLIC:
        default:
            // 公开文章：所有人可见
            break
    }

    return { allowed: true, shouldNotFound: false }
}

/**
 * 过滤敏感数据，仅保留元数据（标题、摘要、封面、分类、标签等）
 */
function filterSensitivePostData(post: Post): Partial<Post> {
    const metadata = { ...(post as any) }
    delete metadata.content
    delete metadata.html
    delete metadata.password
    return {
        ...metadata,
        locked: true,
    }
}

/**
 * 检查用户是否是活跃订阅者
 */
async function isUserSubscriber(userId: string): Promise<boolean> {
    try {
        const subscriberRepo = dataSource.getRepository(Subscriber)
        const subscriber = await subscriberRepo.findOne({
            where: { userId, isActive: true },
        })
        return !!subscriber
    } catch (error) {
        console.error('Failed to check subscriber status:', error)
        return false
    }
}
