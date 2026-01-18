import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import { CommentStatus } from '@/types/comment'

/**
 * 评论服务
 */
export const commentService = {
    /**
     * 获取指定文章的评论列表（嵌套结构）
     */
    async getCommentsByPostId(postId: string, options: { isAdmin?: boolean } = {}) {
        const commentRepo = dataSource.getRepository(Comment)

        // 查询所有已发布的评论（管理员可以看到所有）
        const query: any = { postId }
        if (!options.isAdmin) {
            query.status = CommentStatus.PUBLISHED
        }

        const allComments = await commentRepo.find({
            where: query,
            order: {
                isSticked: 'DESC',
                createdAt: 'ASC',
            },
            relations: ['author'],
        })

        // 构建树形结构
        return this.buildCommentTree(allComments)
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
        // 如果是管理员或者已发表过的受信任用户，可以直接发布（此处先简单处理，默认全部发布）
        // TODO: 增加 SPAM 检查逻辑
        comment.status = CommentStatus.PUBLISHED

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
    buildCommentTree(comments: Comment[]) {
        const map = new Map<string, any>()
        const tree: any[] = []

        comments.forEach((comment) => {
            map.set(comment.id, { ...comment, replies: [] })
        })

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
