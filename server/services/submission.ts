import { createPostService } from './post'
import { dataSource } from '@/server/database'
import { Submission } from '@/server/entities/submission'
import { SubmissionStatus } from '@/types/submission'
import { PostStatus, PostVisibility } from '@/types/post'
import { assignDefined } from '@/server/utils/object'

/**
 * 投稿服务
 */
export const submissionService = {
    /**
     * 获取投稿列表（管理员）
     */
    async getSubmissions(options: {
        page?: number
        limit?: number
        status?: SubmissionStatus
    } = {}) {
        const submissionRepo = dataSource.getRepository(Submission)
        const { page = 1, limit = 10, status } = options

        const qb = submissionRepo.createQueryBuilder('submission')
            .leftJoinAndSelect('submission.author', 'author')
            .orderBy('submission.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)

        if (status) {
            qb.andWhere('submission.status = :status', { status })
        }

        const [items, total] = await qb.getManyAndCount()

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    },

    /**
     * 获取单个投稿详情
     */
    async getSubmissionById(id: string) {
        const submissionRepo = dataSource.getRepository(Submission)
        return await submissionRepo.findOne({
            where: { id },
            relations: ['author'],
        })
    },

    /**
     * 创建投稿
     */
    async createSubmission(data: {
        title: string
        content: string
        contributorName: string
        contributorEmail: string
        contributorUrl?: string | null
        authorId?: string | null
        ip?: string | null
        userAgent?: string | null
    }) {
        const submissionRepo = dataSource.getRepository(Submission)
        const submission = new Submission()

        assignDefined(submission, data, [
            'title',
            'content',
            'contributorName',
            'contributorEmail',
            'contributorUrl',
            'authorId',
            'ip',
            'userAgent',
        ])
        // 处理可选字段的 null 值
        if (data.contributorUrl === undefined) {
            submission.contributorUrl = null
        }
        if (data.authorId === undefined) {
            submission.authorId = null
        }
        if (data.ip === undefined) {
            submission.ip = null
        }
        if (data.userAgent === undefined) {
            submission.userAgent = null
        }
        submission.status = SubmissionStatus.PENDING

        return await submissionRepo.save(submission)
    },

    /**
     * 审核投稿
     */
    async reviewSubmission(id: string, data: {
        status: SubmissionStatus
        adminNote?: string | null
        // 采纳时的一些配置
        acceptOptions?: {
            categoryId?: string | null
            tags?: string[]
            language?: string
            publishImmediately?: boolean
        }
    }, reviewerId: string) {
        const submissionRepo = dataSource.getRepository(Submission)

        const submission = await submissionRepo.findOne({ where: { id } })
        if (!submission) {
            throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
        }

        assignDefined(submission, data, ['status', 'adminNote'])

        if (data.status === SubmissionStatus.ACCEPTED) {
            // 如果采纳，则调用文章服务创建正式文章
            await createPostService(
                {
                    title: submission.title,
                    content: submission.content,
                    summary: submission.content.slice(0, 200),
                    language: data.acceptOptions?.language || 'zh-CN',
                    categoryId: data.acceptOptions?.categoryId,
                    tags: data.acceptOptions?.tags || [],
                    status: data.acceptOptions?.publishImmediately ? PostStatus.PUBLISHED : PostStatus.PENDING,
                    visibility: PostVisibility.PUBLIC,
                },
                submission.authorId || reviewerId, // 如果投稿者已登录则归属于他，否则归属于审核人
                { isAdmin: true }, // 管理员操作，允许直接发布
            )
        }

        return await submissionRepo.save(submission)
    },

    /**
     * 删除投稿
     */
    async deleteSubmission(id: number) {
        const submissionRepo = dataSource.getRepository(Submission)
        const submission = await submissionRepo.findOne({ where: { id: id.toString() } })
        if (!submission) {
            throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
        }
        await submissionRepo.remove(submission)
    },
}
