import { Brackets } from 'typeorm'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import { CommentStatus } from '@/types/comment'
import { sha256 } from '@/utils/shared/hash'

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

        const comment = new Comment()
        comment.postId = data.postId
        comment.parentId = data.parentId || null
        comment.content = data.content
        comment.authorName = data.authorName
        comment.authorEmail = data.authorEmail
        comment.authorUrl = data.authorUrl || null
        comment.authorId = data.authorId || null
        comment.ip = data.ip || null
        comment.userAgent = data.userAgent || null

        // 默认状态逻辑：
        // 游客评论需审核，登录用户评论直接发布
        if (data.authorId) {
            comment.status = CommentStatus.PUBLISHED
        } else {
            comment.status = CommentStatus.PENDING
        }

        await commentRepo.save(comment)
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

            // 计算邮箱哈希用于头像展示 (SHA256)
            if (comment.authorEmail) {
                item.authorEmailHash = await sha256(comment.authorEmail)
            }

            // 隐私保护：非管理员隐藏 Email, IP 和 UserAgent
            if (!isAdmin) {
                delete item.authorEmail
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
