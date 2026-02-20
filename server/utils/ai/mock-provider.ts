import type { AIChatOptions, AIChatResponse, AIProvider, AIImageOptions, AIImageResponse } from '@/types/ai'

export class MockAIProvider implements AIProvider {
    name = 'mock'
    model = 'mock-model'

    async chat(options: AIChatOptions): Promise<AIChatResponse> {
        const lastMessage = options.messages[options.messages.length - 1]?.content
        if (!lastMessage) {
            throw new Error('Messages cannot be empty')
        }
        const systemMessage = options.messages.find((m) => m.role === 'system')?.content || ''

        let content = 'This is a mock AI response for Demo mode.'

        // Simulate thinking time to show loading state
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500))

        // Task Detection
        if (systemMessage.includes('titles') || lastMessage.includes('titles')) {
            const list = [
                '如何在 Nuxt 4 中构建高性能国际化博客',
                '深度解析 Momei 博客的 AI 辅助创作功能',
                '从零开始：使用 TypeScript 和 PrimeVue 搭建个人空间',
                '前端交互新标杆：Momei 博客设计理念分享',
                '为什么墨梅博客是极客创作的首选工具',
            ]
            content = JSON.stringify(list)
        } else if (systemMessage.includes('slug') || lastMessage.includes('slug')) {
            content = 'momei-blog-demo-onboarding'
        } else if (systemMessage.includes('summarize') || lastMessage.includes('summary')) {
            content = '这是对当前内容的智能摘要。在墨梅博客的演示模式中，所有的 AI 功能都在本地模拟运行：不仅保留了完整的交互动画（如打字机效果、流式加载），还能为您返回高质量的模拟结果。这让您可以零成本体验全功能的博文管理系统。'
        } else if (systemMessage.includes('tag') || lastMessage.includes('tag')) {
            content = JSON.stringify(['Nuxt', 'TypeScript', 'AI', '开源', '博客'])
        } else if (lastMessage.includes('Translate')) {
            if (lastMessage.includes('en') || lastMessage.includes('English') || lastMessage.includes('to en')) {
                content = 'This is a simulated AI translation. Momei Blog uses advanced LLM technology to provide one-click translation, ensuring that your Markdown formatting, code snippets, and mathematical formulas are accurately preserved across languages. In this demo, we use pre-defined high-quality text as a placeholder.'
            } else {
                content = '这是一段模拟的 AI 翻译。墨梅博客通过领先的大语言模型技术，为您提供一键式翻译，并能完美保留 Markdown 格式、代码片段和数学公式。在当前的演示版本中，我们使用预设的高质量文本进行展示。'
            }
        }

        return {
            content,
            model: 'mock-demo-v1',
            usage: {
                promptTokens: 120,
                completionTokens: 250,
                totalTokens: 370,
            },
        }
    }

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        // Simulate thinking time to show loading state
        await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000))

        return {
            images: [
                {
                    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1024&h=1024',
                    revisedPrompt: `A high-quality 3D render of ${options.prompt}, photorealistic style, 8k resolution.`,
                },
            ],
        }
    }

    check(): Promise<boolean> {
        return Promise.resolve(true)
    }
}
