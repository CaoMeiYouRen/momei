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
        const now = Date.now()
        const demoPosts = [
            {
                title: '欢迎来到墨梅博客演示模式',
                slug: 'welcome-to-momei-demo',
                translationId: 'welcome-to-momei-demo',
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
                publishedAt: new Date(now - 1000 * 60 * 60 * 6),
                authorId: admin.id,
                categoryId: techCat?.id,
                tags: savedTags,
                views: 128,
            },
            {
                title: 'Welcome to Momei Blog Demo',
                slug: 'welcome-to-momei-demo',
                translationId: 'welcome-to-momei-demo',
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
                publishedAt: new Date(now - 1000 * 60 * 60 * 6),
                authorId: admin.id,
                categoryId: techEnCat?.id,
                tags: [],
                views: 42,
            },
            {
                title: '3 分钟体验路线：从公开内容到后台创作',
                slug: 'demo-journey-in-three-minutes',
                translationId: 'demo-journey-in-three-minutes',
                summary: '如果您想在几分钟内理解墨梅的公开内容、搜索、多语言与后台创作能力，这篇文章就是最佳起点。',
                content: `## 为什么先看这篇

这是一条为首次访问者准备的 Demo 路线图：

1. 打开公开文章，感受阅读页、目录与内容渲染。
2. 试试搜索、分类、标签和归档，理解站点结构。
3. 登录后台，体验 AI 标题、摘要、翻译和发布流程。

### 推荐您继续体验

- 在顶部导航切换语言，查看多语言界面的差异。
- 进入后台后点击编辑器上的 AI 按钮，快速生成标题与摘要。
- 最后打开文章列表，看看多语言和状态管理如何协同工作。`,
                language: 'zh-CN',
                status: 'published' as any,
                publishedAt: new Date(now - 1000 * 60 * 35),
                authorId: admin.id,
                categoryId: techCat?.id,
                tags: savedTags.slice(0, 2),
                views: 96,
            },
            {
                title: '3-Minute Journey: From Public Reading to AI Creation',
                slug: 'demo-journey-in-three-minutes',
                translationId: 'demo-journey-in-three-minutes',
                summary: 'This guided route helps first-time visitors understand public content, search, multilingual publishing, and the admin creation flow in a few minutes.',
                content: `## Why start here

This post is the fastest route through the demo experience:

1. Open a public article and inspect reading, TOC, and rendering.
2. Try search, categories, tags, and archives to understand the site structure.
3. Sign in to the admin panel and explore AI-assisted writing, translation, and publishing.

### Recommended next steps

- Switch the UI language from the header.
- Use the AI tools in the editor to generate titles and summaries.
- Revisit the admin list to see translation and status management together.`,
                language: 'en-US',
                status: 'published' as any,
                publishedAt: new Date(now - 1000 * 60 * 35),
                authorId: admin.id,
                categoryId: techEnCat?.id,
                tags: [],
                views: 55,
            },
            {
                title: '用 AI 将灵感整理成文章与多语言版本',
                slug: 'ai-creation-workflow-demo',
                translationId: 'ai-creation-workflow-demo',
                summary: '这篇 Demo 文章专门展示标题建议、摘要生成、标签推荐和翻译工作流如何串成一条可操作的内容生产链路。',
                content: `## 一条更接近真实创作的路径

在后台编辑器里，您可以把一次 Demo 体验分成四步：

1. 先输入一段草稿或灵感。
2. 用 AI 生成候选标题与摘要。
3. 继续推荐标签、整理 Markdown 格式。
4. 一键翻译到另一种语言，再进入发布流程。

### 为什么这个流程重要

它不是单点功能展示，而是帮助您判断墨梅是否适合真实创作节奏。`,
                language: 'zh-CN',
                status: 'published' as any,
                publishedAt: new Date(now - 1000 * 60 * 10),
                authorId: admin.id,
                categoryId: techCat?.id,
                tags: savedTags,
                views: 164,
            },
            {
                title: 'Turn Ideas into Multilingual Posts with AI',
                slug: 'ai-creation-workflow-demo',
                translationId: 'ai-creation-workflow-demo',
                summary: 'This demo post shows how title suggestions, summary generation, tag recommendation, and translation can become one practical content workflow.',
                content: `## A workflow that feels closer to real writing

Inside the admin editor, the demo follows four steps:

1. Start with a rough draft or a short idea.
2. Generate title options and summaries with AI.
3. Clean up tags and formatting.
4. Translate the post into another language before publishing.

### Why this matters

The goal is not to showcase isolated tricks, but to help you evaluate whether Momei fits a real publishing rhythm.`,
                language: 'en-US',
                status: 'published' as any,
                publishedAt: new Date(now - 1000 * 60 * 10),
                authorId: admin.id,
                categoryId: techEnCat?.id,
                tags: [],
                views: 71,
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
