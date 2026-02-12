import { Brackets } from 'typeorm'
import { notifyAdmins, sendInAppNotification } from './notification'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import { CommentStatus } from '@/types/comment'
import { processAuthorPrivacy } from '@/server/utils/author'
import { getSettings } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import { assignDefined } from '@/server/utils/object'
import { AdminNotificationEvent, NotificationType } from '@/utils/shared/notification'

/**
 * 评论服务
 */
export const commentService = {
    /**
     * 获取指定文章的评论列表（嵌套结构）
     */
    async getCommentsByPostId(postId: string, options: {
        isAdmin?: boolean
        viewerEmail?: string
        viewerId?: string
    } = {}) {
        const commentRepo = dataSource.getRepository(Comment)

        const qb = commentRepo.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.author', 'author')
            .where('comment.postId = :postId', { postId })
            .orderBy('comment.isSticked', 'DESC')
            .addOrderBy('comment.createdAt', 'ASC')

        if (!options.isAdmin) {
            // 普通用户：只能看到“已发布”的，或者“自己发布的待审核”评论
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
        }

        const allComments = await qb.getMany()

        // 构建树形结构并处理隐私
        return await this.buildCommentTree(allComments, options.isAdmin)
    },

    /**
     * 创建评论
     */
    async createComment(data: {
        postId: string
        parentId?: string | null
        content: string
        authorName: string
        authorEmail: string
        authorUrl?: string | null
        authorId?: string | null
        ip?: string | null
        userAgent?: string | null
    }) {
        const postRepo = dataSource.getRepository(Post)
        const commentRepo = dataSource.getRepository(Comment)

        // 检查文章是否存在
        const post = await postRepo.findOne({ where: { id: data.postId } })
        if (!post) {
            throw createError({ statusCode: 404, statusMessage: 'Post not found' })
        }

        // 执行黑名单检查
        const settings = await getSettings([
            SettingKey.BLACKLISTED_KEYWORDS,
            SettingKey.ENABLE_COMMENT_REVIEW,
        ])

        const blacklistedKeywords = String(settings[SettingKey.BLACKLISTED_KEYWORDS] || '')
            .split(/[,，\n]/)
            .map((k) => k.trim())
            .filter(Boolean)

        if (blacklistedKeywords.some((keyword) => data.content.includes(keyword))) {
            throw createError({ statusCode: 400, statusMessage: '评论包含不当内容' })
        }

        const comment = new Comment()
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
            commentRepo.findOne({ where: { id: data.parentId } }).then((parent) => {
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
        const commentRepo = dataSource.getRepository(Comment)
        await commentRepo.delete(id)
    },

    /**
     * 辅助方法：构建评论树
     */
    async buildCommentTree(comments: Comment[], isAdmin: boolean = false) {
        const map = new Map<string, any>()
        const tree: any[] = []

        for (const comment of comments) {
            const item = { ...comment, replies: [] } as any

            // 处理作者隐私及哈希 (SHA256)
            await processAuthorPrivacy(item, isAdmin, 'authorEmail', 'authorEmailHash')

            // 隐私保护：非管理员隐藏 IP 和 UserAgent
            if (!isAdmin) {
                delete item.ip
                delete item.userAgent
            }

            map.set(comment.id, item)
        }

        comments.forEach((comment) => {
            const item = map.get(comment.id)
            if (comment.parentId && map.has(comment.parentId)) {
                map.get(comment.parentId).replies.push(item)
            } else {
                tree.push(item)
            }
        })

        return tree
    },
}
