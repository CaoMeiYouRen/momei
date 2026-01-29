import { z } from 'zod'
import { isSystemInstalled, validateAdminPassword } from '~/server/services/installation'
import { auth } from '@/lib/auth'
import { dataSource } from '~/server/database'
import { User } from '~/server/entities/user'

/**
 * 管理员创建 Schema
 */
const adminCreationSchema = z.object({
    email: z.email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码长度至少为 8 位'),
    name: z.string().min(1, '昵称不能为空').max(50),
})

/**
 * 创建管理员账号
 * POST /api/install/create-admin
 */
export default defineEventHandler(async (event) => {
    // 检查是否已安装
    const installed = await isSystemInstalled()
    if (installed) {
        throw createError({
            statusCode: 403,
            statusMessage: 'System already installed',
        })
    }

    // 读取并验证请求体
    const body = await readBody(event)
    const result = adminCreationSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid admin data',
            data: result.error.issues,
        })
    }

    const { email, password, name } = result.data

    // 验证密码强度
    const passwordValidation = validateAdminPassword(password)
    if (!passwordValidation.valid) {
        throw createError({
            statusCode: 400,
            statusMessage: passwordValidation.message,
        })
    }

    try {
        // 检查是否已存在用户
        const userRepo = dataSource.getRepository(User)
        const existingUser = await userRepo.findOne({ where: { email } })

        if (existingUser) {
            throw createError({
                statusCode: 400,
                statusMessage: 'User with this email already exists',
            })
        }

        // 使用 better-auth 创建管理员账号
        const response = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        })

        if (!response || !response.user) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to create admin user',
            })
        }

        const user = response.user

        // 更新用户角色为管理员
        await userRepo.update(user.id, {
            role: 'admin',
            emailVerified: true, // 安装时创建的管理员自动验证邮箱
        })

        logger.info(`Admin user created successfully: ${email}`)

        return {
            code: 200,
            message: 'Admin user created successfully',
            data: {
                success: true,
                userId: user.id,
            },
        }
    } catch (error: any) {
        logger.error('Failed to create admin user:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to create admin user',
        })
    }
})
