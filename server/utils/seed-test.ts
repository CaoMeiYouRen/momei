import type { DataSource } from 'typeorm'
import { Setting } from '../entities/setting'
import { User } from '../entities/user'
import { Post } from '../entities/post'
import logger from '../utils/logger'
import { snowflake } from '../utils/snowflake'
import { auth } from '@/lib/auth'
import { PostStatus, PostVisibility } from '@/types/post'

/**
 * 填充 E2E 测试所需的初始数据
 */
export async function seedTestData(ds: DataSource) {
    logger.info('[Test Seed] Starting to seed test data...')

    try {
        const settingRepo = ds.getRepository(Setting)
        const userRepo = ds.getRepository(User)

        // 1. 确保系统标记为已安装
        const installedFlag = await settingRepo.findOne({ where: { key: 'system_installed' } })
        if (!installedFlag) {
            await settingRepo.save({
                key: 'system_installed',
                value: 'true',
                description: 'System installed flag (Auto-seeded for TEST_MODE)',
            })
            logger.info('[Test Seed] System marked as installed')
        }

        // 2. 填充基础站点配置 (避免前端请求报错)
        const baseSettings = [
            { key: 'site_title', value: 'Momei Test Blog' },
            { key: 'site_name', value: 'Momei Test' },
            { key: 'site_url', value: 'http://localhost:3001' },
            { key: 'default_language', value: 'zh-CN' },
        ]

        for (const s of baseSettings) {
            const existing = await settingRepo.findOne({ where: { key: s.key } })
            if (!existing) {
                await settingRepo.save({
                    ...s,
                    description: 'Auto-seeded for TEST_MODE',
                    level: 0,
                })
            }
        }

        // 3. 创建测试账号
        const testEmail = 'test@momei.test'
        const testPassword = 'Password123'

        const existingUser = await userRepo.findOne({ where: { email: testEmail } })

        if (!existingUser) {
            logger.info(`[Test Seed] Creating test admin: ${testEmail}`)

            // 注意：这里使用 auth.api.signUpEmail 会因为 nitro 环境未完全准备好可能报错
            // 如果报错，可以尝试直接操作数据库，但这需要手动处理密码哈希
            // 幸好 Better-Auth 的底层逻辑通常是解耦的
            try {
                const response = await auth.api.signUpEmail({
                    body: {
                        email: testEmail,
                        password: testPassword,
                        name: 'Test Admin',
                    },
                })

                if (response?.user) {
                    await userRepo.update(response.user.id, {
                        role: 'admin',
                        emailVerified: true,
                    })
                    logger.info('[Test Seed] Test admin created and promoted to admin')
                }
            } catch (e: any) {
                logger.error('[Test Seed] Failed to create user via Better-Auth:', e.message)
                // 备选方案：如果 auth.api 还没准备好，我们暂时跳过，
                // 但通常在 Nitro Plugin 中是可用的
            }
        } else {
            logger.info('[Test Seed] Test user already exists')
            if (existingUser.role !== 'admin' || !existingUser.emailVerified) {
                await userRepo.update(existingUser.id, {
                    role: 'admin',
                    emailVerified: true,
                })
                logger.info('[Test Seed] Existing test user promoted to admin')
            }
        }

        // 4. 创建一个测试文章
        const postRepo = ds.getRepository(Post)
        const testSlug = 'hello-momei-test'
        const existingPost = await postRepo.findOne({ where: { slug: testSlug } })

        if (!existingPost) {
            const admin = await userRepo.findOne({ where: { email: testEmail } })
            if (admin) {
                logger.info('[Test Seed] Creating test post...')
                const post = postRepo.create({
                    id: snowflake.generateId(),
                    title: 'Hello Momei Test',
                    slug: testSlug,
                    content: '# Hello Momei\n\nThis is a test post for E2E testing.\n\n## Section 1\nContent 1\n\n## Section 2\nContent 2',
                    summary: 'Test post summary',
                    status: PostStatus.PUBLISHED,
                    visibility: PostVisibility.PUBLIC,
                    authorId: admin.id,
                    language: 'zh-CN',
                    publishedAt: new Date(),
                })
                await postRepo.save(post)
                logger.info('[Test Seed] Test post created')
            }
        }

        logger.info('[Test Seed] Seeding completed successfully')
    } catch (error) {
        logger.error('[Test Seed] Failed to seed test data:', error)
    }
}
