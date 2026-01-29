import { z } from 'zod'

export const themeConfigSchema = z.object({
    name: z.string().min(1, '名称不能为空').max(128, '名称太长'),
    description: z.string().max(1000, '描述太长').optional().nullable(),
    configData: z.string().min(1, '配置数据不能为空'),
    previewImage: z.string().optional().nullable(),
})

export type ThemeConfigInput = z.infer<typeof themeConfigSchema>
