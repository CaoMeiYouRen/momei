import { Brackets, type SelectQueryBuilder } from 'typeorm'
import { PostStatus, PostVisibility } from '@/types/post'
import type { Post } from '@/server/entities/post'
import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { isAdmin } from '@/utils/shared/roles'

const SUBSCRIBER_LOOKUP_ERROR_MESSAGE = 'Failed to resolve subscriber status'
export const POST_ACCESS_STATE_ERROR_MESSAGE = 'Failed to resolve content access state'

/**
 * 为查询构建器应用文章可见性过滤逻辑
 * @param qb SelectQueryBuilder
 * @param user 当前用户（可选）
 * @param mode 模式：'public' (常规列表) | 'feed' (订阅源) | 'manage' (管理后台)
 */
export async function applyPostVisibilityFilter(
    qb: SelectQueryBuilder<Post>,
    user?: any,
    mode: 'public' | 'feed' | 'manage' = 'public',
) {
    const isSystemAdmin = user && isAdmin(user.role)

    // 1. 处理管理模式
    if (mode === 'manage') {
        // 管理模式通常在 API 层处理更复杂的权限（如只能看自己的文章）
        // 这里仅确保已发布非私有的逻辑不强制应用，以便管理员/作者看到所有状态
        return qb
    }

    // 2. 处理订阅源 (RSS/Atom/JSON Feed)
    if (mode === 'feed') {
        // 订阅源为了通用性和隐私，强制仅显示 PUBLIC 状态的文章
        qb.andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
        qb.andWhere('post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
        return qb
    }

    // 3. 处理公共列表模式 (Public Mode)
    // 该函数用于“列表可见性”过滤，而不是“详情页是否可读全文”；
    // 详情页由 checkPostAccess 再执行一次更细粒度门禁。
    qb.andWhere('post.status = :status', { status: PostStatus.PUBLISHED })

    // 管理员在公共模式下也能看到所有已发布的文章
    if (isSystemAdmin) {
        return qb
    }

    // 检查订阅状态
    const isSub = await isUserSubscriber(user?.id)

    qb.andWhere(new Brackets((sub) => {
        // A. 任何人均可见公开文章
        sub.where('post.visibility = :publicVisibility', { publicVisibility: PostVisibility.PUBLIC })

        // B. 作者可见自己的任何文章
        if (user?.id) {
            sub.orWhere('post.authorId = :currentUserId', { currentUserId: user.id })
        }

        // C. 已登录用户可见“登录可见”的文章
        if (user) {
            sub.orWhere('post.visibility = :registeredVisibility', { registeredVisibility: PostVisibility.REGISTERED })
        }

        // D. 订阅者可见“订阅可见”的文章
        if (isSub) {
            sub.orWhere('post.visibility = :subscriberVisibility', { subscriberVisibility: PostVisibility.SUBSCRIBER })
        }

        // E. 密码保护文章在列表中保留可见（用于展示标题与摘要），
        // 但详情页仍会在 checkPostAccess 中要求解锁后才能读取正文。
        sub.orWhere('post.visibility = :passwordVisibility', { passwordVisibility: PostVisibility.PASSWORD })
    }))

    return qb
}

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
    session?: any,
    unlockedIds: string[] = [],
): Promise<PostAccessResult> {
    const user = session?.user
    const isOwner = user?.id === post.authorId
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
            const isSub = await isUserSubscriber(user?.id)
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
    if (!userId) {
        return false
    }

    try {
        const subscriberRepo = dataSource.getRepository(Subscriber)
        const subscriber = await subscriberRepo.findOne({
            where: { userId, isActive: true },
        })
        return !!subscriber
    } catch (error) {
        // 订阅态查询失败不在此处直接转 HTTP 错误，统一交由上层映射为
        // POST_ACCESS_STATE_UNAVAILABLE，避免调用方得到不一致错误结构。
        throw new Error(
            SUBSCRIBER_LOOKUP_ERROR_MESSAGE,
            error instanceof Error ? { cause: error } : undefined,
        )
    }
}

export function rethrowPostAccessError(error: unknown): never {
    if (error instanceof Error && error.message === SUBSCRIBER_LOOKUP_ERROR_MESSAGE) {
        throw createError({
            statusCode: 503,
            statusMessage: POST_ACCESS_STATE_ERROR_MESSAGE,
            data: {
                code: 503,
                message: POST_ACCESS_STATE_ERROR_MESSAGE,
                flag: 'POST_ACCESS_STATE_UNAVAILABLE',
            },
        })
    }

    throw error
}
