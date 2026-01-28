import { z } from 'zod'
import { SubmissionStatus } from '../../types/submission'

export const submissionSchema = z.object({
    title: z.string().min(1, '标题不能为空').max(200, '标题过长'),
    content: z.string().min(10, '内容太少，请填写至少 10 个字符'),
    contributorName: z.string().min(1, '姓名不能为空').max(50, '名字过长'),
    contributorEmail: z.email('无效的邮箱地址'),
    contributorUrl: z.url('无效的网址格式').optional().or(z.literal('')),
    captchaToken: z.string().min(1, '请完成验证码校验'),
})

export const submissionReviewSchema = z.object({
    status: z.enum(SubmissionStatus as any),
    adminNote: z.string().optional().nullable(),
    acceptOptions: z.object({
        categoryId: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
        language: z.string().optional().default('zh-CN'),
        publishImmediately: z.boolean().optional(),
    }).optional(),
})
