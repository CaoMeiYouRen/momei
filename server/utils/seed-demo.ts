import { DataSource } from 'typeorm'
import logger from './logger'
import { auth } from '@/lib/auth'
import { User } from '@/server/entities/user'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'

export async function seedDemoData(ds: DataSource) {
    const config = useRuntimeConfig()
    const demoEmail = config.public.demoUserEmail
    const demoPassword = config.public.demoPassword

    logger.info(`[Demo Seed] Starting to seed demo data for ${demoEmail}...`)

    try {
        // 1. 创建演示管理员用户
        const userRepo = ds.getRepository(User)
        const existingUser = await userRepo.findOne({ where: { email: demoEmail } })

        if (!existingUser) {
            await auth.api.signUpEmail({
                body: {
                    email: demoEmail,
                    password: demoPassword,
                    name: 'Demo Administrator',
                },
            })
            const user = await userRepo.findOne({ where: { email: demoEmail } })
            if (user) {
                user.role = 'admin'
                await userRepo.save(user)
            }
        }

        const admin = await userRepo.findOne({ where: { email: demoEmail } })
        if (!admin) {
            throw new Error('Failed to create demo admin')
        }

        // 2. 创建分类
        const categoryRepo = ds.getRepository(Category)
        const demoCategories = [
            { name: '技术分享', slug: 'tech', language: 'zh-CN' },
            { name: 'Tech Insights', slug: 'tech-en', language: 'en-US' },
            { name: '生活随笔', slug: 'life', language: 'zh-CN' },
        ]

        for (const cat of demoCategories) {
            const exists = await categoryRepo.findOne({ where: { slug: cat.slug, language: cat.language } })
            if (!exists) {
                const category = categoryRepo.create(cat)
                category.id = snowflake.generateId()
                await categoryRepo.save(category)
            }
        }

        const allCategories = await categoryRepo.find()
        const techCat = allCategories.find((c) => c.slug === 'tech')
        const techEnCat = allCategories.find((c) => c.slug === 'tech-en')

        // 3. 创建标签
        const tagRepo = ds.getRepository(Tag)
        const demoTags = [
            { name: 'Nuxt', slug: 'nuxt', language: 'zh-CN' },
            { name: 'Vue', slug: 'vue', language: 'zh-CN' },
            { name: 'AI', slug: 'ai', language: 'zh-CN' },
        ]

        for (const tag of demoTags) {
            const exists = await tagRepo.findOne({ where: { slug: tag.slug, language: tag.language } })
            if (!exists) {
                const tagEntity = tagRepo.create(tag)
                tagEntity.id = snowflake.generateId()
                await tagRepo.save(tagEntity)
            }
        }

        const savedTags = await tagRepo.find()

        // 4. 创建演示文章
        const postRepo = ds.getRepository(Post)
        const demoPosts = [
            {
                title: '欢迎来到墨梅博客演示模式',
                slug: 'welcome-to-momei-demo',
                summary: '这是一个演示模式下的自动填充文章。在这里您可以体验 Momei 的所有核心功能，包括 AI 助手、多语言管理和极致的 Markdown 编辑体验。',
                content: `## 欢迎体验 Momei

这是您的第一篇演示文章。在 **Demo 模式**中，您可以：

1. **AI 辅助写作**：点击编辑器右侧的“星星”图标，尝试生成摘要、建议标题或翻译全文。
2. **多语言管理**：在后台为文章添加不同语言的版本。
3. **即时预览**：享受丝滑的 Markdown 编辑体验。

> **注意**：由于这是演示模式，所有的修改都保存在内存数据库中。系统会定期自动重启并重置所有数据。

### 开始您的探索之旅吧！`,
                language: 'zh-CN',
                status: 'published' as any,
                authorId: admin.id,
                categoryId: techCat?.id,
                tags: savedTags,
                views: 128,
            },
            {
                title: 'Welcome to Momei Blog Demo',
                slug: 'welcome-to-momei-demo-en',
                summary: 'This is an auto-generated post in Demo mode. Here you can experience all core features of Momei, including AI assistance, multi-language management, and a seamless Markdown editing experience.',
                content: `## Welcome to Momei Experience

This is your first demo post. In **Demo Mode**, you can:

1. **AI-Assisted Writing**: Click the "stars" icon on the right side of the editor to generate summaries, suggest titles, or translate the entire text.
2. **Multi-language Management**: Create different language versions for your articles in the admin panel.
3. **Instant Preview**: Enjoy a smooth Markdown editing experience.

> **Note**: As this is a demo mode, all changes are saved in an in-memory database. The system will automatically restart and reset all data periodically.

### Start your journey now!`,
                language: 'en-US',
                status: 'published' as any,
                authorId: admin.id,
                categoryId: techEnCat?.id,
                tags: [],
                views: 42,
            },
        ]

        for (const p of demoPosts) {
            const exists = await postRepo.findOne({ where: { slug: p.slug, language: p.language } })
            if (!exists) {
                const post = postRepo.create(p)
                post.id = snowflake.generateId()
                await postRepo.save(post)
            }
        }

        logger.info('[Demo Seed] Demo data seeded successfully.')
    } catch (error) {
        logger.error('[Demo Seed] Failed to seed demo data:', error)
    }
}
