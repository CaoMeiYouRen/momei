import { Brackets, In, type SelectQueryBuilder } from 'typeorm'
import { notifyAdmins, sendInAppNotification } from './notification'
import { dataSource } from '@/server/database'
import { limiterStorage } from '@/server/database/storage'
import { Comment as CommentEntity } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import { resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import { CommentStatus, type Comment, type CommentPreferredTranslation } from '@/types/comment'
import { processAuthorPrivacy } from '@/server/utils/author'
import { getSettings } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import { assignDefined, toPlainObject } from '@/server/utils/object'
import { normalizeDurationSeconds } from '@/utils/shared/duration'
import { AdminNotificationEvent, NotificationType } from '@/utils/shared/notification'
import { PostStatus, PostVisibility } from '@/types/post'

interface CreateCommentInput {
    postId: string
    parentId?: string | null
    content: string
    authorName: string
    authorEmail: string
    authorUrl?: string | null
    authorId?: string | null
    ip?: string | null
    userAgent?: string | null
}

interface CommentViewerOptions {
    isAdmin?: boolean
    viewerEmail?: string
    viewerId?: string
}

function normalizeCommentInterval(value: string | null | undefined) {
    return normalizeDurationSeconds(value, 0)
}

function buildCommentIntervalKey(data: CreateCommentInput) {
    if (data.authorId) {
        return `comment_interval:user:${data.authorId}`
    }

    if (data.authorEmail) {
        return `comment_interval:email:${data.authorEmail.trim().toLowerCase()}`
    }

    if (data.ip) {
        return `comment_interval:ip:${data.ip}`
    }

    return 'comment_interval:anonymous'
}

async function enforceCommentInterval(data: CreateCommentInput, intervalValue: string | null | undefined) {
    const interval = normalizeCommentInterval(intervalValue)
    if (interval <= 0) {
        return
    }

    const count = await limiterStorage.increment(buildCommentIntervalKey(data), interval)
    if (count > 1) {
        throw createError({
            statusCode: 429,
            statusMessage: `评论过于频繁，请在 ${interval} 秒后重试`,
        })
    }
}

function applyCommentViewerVisibilityFilter(
    qb: SelectQueryBuilder<CommentEntity>,
    options: CommentViewerOptions,
) {
    if (options.isAdmin) {
        return qb
    }

    qb.andWhere(new Brackets((qbInner) => {
        qbInner.where('comment.status = :published', { published: CommentStatus.PUBLISHED })

        if (options.viewerEmail) {
            qbInner.orWhere('(comment.status = :pending AND comment.authorEmail = :email)', {
                pending: CommentStatus.PENDING,
                email: options.viewerEmail,
            })
        }

        if (options.viewerId) {
            qbInner.orWhere('(comment.status = :pending AND comment.authorId = :userId)', {
                pending: CommentStatus.PENDING,
                userId: options.viewerId,
            })
        }
    }))

    return qb
}

interface CommentReadContext {
    currentPostId: string
    currentLanguage: AppLocaleCode
}

async function resolveCommentReadContext(postId: string): Promise<{
    context: CommentReadContext
    postIds: string[]
}> {
    const postRepo = dataSource.getRepository(Post)
    const currentPost = await postRepo.findOne({
        where: { id: postId },
        select: ['id', 'language', 'translationId', 'slug', 'title', 'status', 'visibility'],
    })

    if (!currentPost) {
        return {
            context: {
                currentPostId: postId,
                currentLanguage: resolveAppLocaleCode(),
            },
            postIds: [postId],
        }
    }

    const siblingWhere = currentPost.translationId
        ? {
            translationId: currentPost.translationId,
            status: PostStatus.PUBLISHED,
            visibility: PostVisibility.PUBLIC,
        }
        : {
            slug: currentPost.slug,
            status: PostStatus.PUBLISHED,
            visibility: PostVisibility.PUBLIC,
        }

    const siblingPosts = await postRepo.find({
        where: siblingWhere,
        select: ['id'],
    })

    const postIds = Array.from(new Set([
        currentPost.id,
        ...siblingPosts.map((post) => post.id),
    ]))

    return {
        context: {
            currentPostId: currentPost.id,
            currentLanguage: resolveAppLocaleCode(currentPost.language),
        },
        postIds,
    }
}

function mapPreferredTranslation(comment: CommentEntity, contextLanguage: AppLocaleCode): CommentPreferredTranslation | null {
    const cachedTranslation = comment.translationCache?.[contextLanguage]
    if (!cachedTranslation) {
        return null
    }

    return {
        targetLanguage: contextLanguage,
        content: cachedTranslation.content,
        updatedAt: cachedTranslation.updatedAt,
    }
}

function compareCommentThreads(left: Comment, right: Comment, context: CommentReadContext) {
    const leftLanguagePriority = left.sourceLanguage === context.currentLanguage ? 0 : 1
    const rightLanguagePriority = right.sourceLanguage === context.currentLanguage ? 0 : 1

    if (leftLanguagePriority !== rightLanguagePriority) {
        return leftLanguagePriority - rightLanguagePriority
    }

    const leftPinned = left.isSticked ? 0 : 1
    const rightPinned = right.isSticked ? 0 : 1
    if (leftPinned !== rightPinned) {
        return leftPinned - rightPinned
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
}

function serializeCommentDate(value: Date | string | null | undefined) {
    if (typeof value === 'string') {
        return value
    }

    if (value instanceof Date) {
        return value.toISOString()
    }

    return new Date().toISOString()
}

/**
 * 评论服务
 */
export const commentService = {
    /**
     * 获取指定文章的评论列表（嵌套结构）
     */
    async getCommentsByPostId(postId: string, options: CommentViewerOptions = {}) {
        const commentRepo = dataSource.getRepository(CommentEntity)
        const { context, postIds } = await resolveCommentReadContext(postId)

        if (postIds.length === 0) {
            return []
        }

        const qb = commentRepo.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.author', 'author')
            .leftJoin('comment.post', 'post')
            .addSelect(['post.id', 'post.title', 'post.language'])
            .where({ postId: In(postIds) })
            .orderBy('comment.isSticked', 'DESC')
            .addOrderBy('comment.createdAt', 'ASC')

        applyCommentViewerVisibilityFilter(qb, options)

        const allComments = await qb.getMany()

        // 构建树形结构并处理隐私
        return await this.buildCommentTree(allComments, options.isAdmin, context)
    },

    /**
     * 获取单条评论并复用评论可见性规则。
     */
    async getCommentById(commentId: string, options: CommentViewerOptions = {}) {
        const commentRepo = dataSource.getRepository(CommentEntity)
        const qb = commentRepo.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.author', 'author')
            .where('comment.id = :commentId', { commentId })

        applyCommentViewerVisibilityFilter(qb, options)

        return await qb.getOne()
    },

    /**
     * 创建评论
     */
    async createComment(data: CreateCommentInput) {
        const postRepo = dataSource.getRepository(Post)
        const commentRepo = dataSource.getRepository(CommentEntity)

        // 检查文章是否存在
        const post = await postRepo.findOne({ where: { id: data.postId } })
        if (!post) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }

        // 执行黑名单检查
        const settings = await getSettings([
            SettingKey.BLACKLISTED_KEYWORDS,
            SettingKey.ENABLE_COMMENT_REVIEW,
            SettingKey.COMMENT_INTERVAL,
        ])

        const blacklistedKeywords = String(settings[SettingKey.BLACKLISTED_KEYWORDS] || '')
            .split(/[,，\n]/)
            .map((k) => k.trim())
            .filter(Boolean)

        if (blacklistedKeywords.some((keyword) => data.content.includes(keyword))) {
            throw createError({ statusCode: 400, statusMessage: '评论包含不当内容' })
        }

        await enforceCommentInterval(data, settings[SettingKey.COMMENT_INTERVAL])

        const comment = new CommentEntity()
        assignDefined(comment, data, [
            'postId',
            'parentId',
            'content',
            'authorName',
            'authorEmail',
            'authorUrl',
            'authorId',
            'ip',
            'userAgent',
        ])
        // 处理 parentId 和其他可选字段的 null 值
        if (data.parentId === undefined) {
            comment.parentId = null
        }
        if (data.authorUrl === undefined) {
            comment.authorUrl = null
        }
        if (data.authorId === undefined) {
            comment.authorId = null
        }
        if (data.ip === undefined) {
            comment.ip = null
        }
        if (data.userAgent === undefined) {
            comment.userAgent = null
        }

        // 状态逻辑：
        // 1. 如果全局开启了评论审核，则所有评论进入待审核状态（除非是管理员，这里暂不处理管理员例外）
        // 2. 如果未开启全局审核，则游客评论需审核，登录用户评论直接发布
        const enableReview = String(settings[SettingKey.ENABLE_COMMENT_REVIEW]) === 'true'

        if (enableReview) {
            comment.status = CommentStatus.PENDING
        } else if (data.authorId) {
            comment.status = CommentStatus.PUBLISHED
        } else {
            comment.status = CommentStatus.PENDING
        }

        await commentRepo.save(comment)

        // 发送通知
        notifyAdmins(AdminNotificationEvent.NEW_COMMENT, {
            title: `新评论: ${post.title}`,
            content: `<p>来自 <strong>${comment.authorName}</strong> 的评论:</p><p>${comment.content}</p>`,
        }).catch((err) => {
            console.error('Failed to notify admins of new comment:', err)
        })

        // 发送站内通知给文章作者
        if (post.authorId && post.authorId !== data.authorId) {
            sendInAppNotification({
                userId: post.authorId,
                type: NotificationType.COMMENT_REPLY,
                title: `文章有新评论: ${post.title}`,
                content: `${comment.authorName}: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
                link: `/posts/${post.slug || post.id}#comment-${comment.id}`,
            }).catch((err) => {
                console.error('Failed to send in-app notification to post author:', err)
            })
        }

        // 如果是回复，发送站内通知给父评论作者
        if (data.parentId) {
            void commentRepo.findOne({ where: { id: data.parentId } }).then((parent) => {
                if (parent?.authorId && parent.authorId !== data.authorId && parent.authorId !== post.authorId) {
                    sendInAppNotification({
                        userId: parent.authorId,
                        type: NotificationType.COMMENT_REPLY,
                        title: `评论收到新回复: ${post.title}`,
                        content: `${comment.authorName} 回复了你: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
                        link: `/posts/${post.slug || post.id}#comment-${comment.id}`,
                    }).catch((err) => {
                        console.error('Failed to send in-app notification to parent comment author:', err)
                    })
                }
            })
        }

        return comment
    },

    /**
     * 删除评论
     */
    async deleteComment(id: string) {
        const commentRepo = dataSource.getRepository(CommentEntity)
        await commentRepo.delete(id)
    },

    /**
     * 辅助方法：构建评论树
     */
    async buildCommentTree(comments: CommentEntity[], isAdmin: boolean = false, context?: CommentReadContext) {
        const map = new Map<string, Comment>()
        const tree: Comment[] = []

        for (const comment of comments) {
            let item = Object.assign(toPlainObject(comment), {
                createdAt: serializeCommentDate(comment.createdAt),
                updatedAt: serializeCommentDate(comment.updatedAt),
                replies: [] as Comment[],
                sourceLanguage: comment.post?.language ? resolveAppLocaleCode(comment.post.language) : undefined,
                sourcePostId: comment.postId,
                sourcePostTitle: comment.post?.title || null,
                isCrossLocaleFallback: context ? comment.postId !== context.currentPostId : false,
                preferredTranslation: context ? mapPreferredTranslation(comment, context.currentLanguage) : null,
            }) as Comment & { translationCache?: unknown }

            // 处理作者隐私及哈希 (SHA256)
            item = await processAuthorPrivacy(item, isAdmin, 'authorEmail', 'authorEmailHash') as Comment & { translationCache?: unknown }
            delete item.translationCache

            // 隐私保护：非管理员隐藏 IP 和 UserAgent
            if (!isAdmin) {
                delete item.ip
                delete item.userAgent
            }

            map.set(comment.id, item)
        }

        comments.forEach((comment) => {
            const item = map.get(comment.id)
            if (!item) {
                return
            }

            const parent = comment.parentId ? map.get(comment.parentId) : null
            if (parent) {
                parent.replies?.push(item)
            } else {
                tree.push(item)
            }
        })

        if (context) {
            tree.sort((left, right) => compareCommentThreads(left, right, context))
        }

        return tree
    },
}
