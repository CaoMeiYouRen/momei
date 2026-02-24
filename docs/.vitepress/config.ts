import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    // Shared settings
    lastUpdated: true,
    cleanUrls: true,
    ignoreDeadLinks: true,
    sitemap: {
        hostname: 'https://docs.momei.app',
    },
    markdown: {
        image: {
            lazyLoading: true,
        },
    },

    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            title: '墨梅博客',
            description: 'AI 驱动、原生国际化的开发者博客平台',
            themeConfig: {
                nav: [
                    { text: '首页', link: '/' },
                    { text: '快速开始', link: '/guide/quick-start' },
                    { text: '部署指南', link: '/guide/deploy' },
                    { text: 'API 设计', link: '/design/api' },
                    {
                        text: '关于',
                        items: [
                            { text: '贡献指南', link: 'https://github.com/CaoMeiYouRen/momei/blob/master/CONTRIBUTING.md' },
                            { text: '安全政策', link: 'https://github.com/CaoMeiYouRen/momei/blob/master/SECURITY.md' },
                            { text: '行为准则', link: 'https://github.com/CaoMeiYouRen/momei/blob/master/CODE_OF_CONDUCT.md' },
                            { text: '更新日志', link: 'https://github.com/CaoMeiYouRen/momei/blob/master/CHANGELOG.md' },
                        ],
                    },
                ],
                sidebar: [
                    {
                        text: '指南',
                        items: [
                            { text: '快速开始', link: '/guide/quick-start' },
                            { text: '部署指南', link: '/guide/deploy' },
                            { text: '环境与系统设置', link: '/guide/variables' },
                            { text: '开发指南', link: '/guide/development' },
                            { text: 'AI 协同开发', link: '/guide/ai-development' },
                            { text: '功能特性', link: '/guide/features' },
                        ],
                    },
                    {
                        text: '项目规划',
                        items: [
                            { text: '路线图', link: '/plan/roadmap' },
                            { text: '待办事项', link: '/plan/todo' },
                            { text: '待办归档', link: '/plan/todo-archive' },
                            { text: '方案对比', link: '/plan/comparison' },
                        ],
                    },
                    {
                        text: '开发规范',
                        items: [
                            { text: '项目规划规范', link: '/standards/planning' },
                            { text: '通用开发规范', link: '/standards/development' },
                            { text: 'AI 协作规范', link: '/standards/ai-collaboration' },
                            { text: 'API 规范', link: '/standards/api' },
                            { text: '测试规范', link: '/standards/testing' },
                            { text: '安全规范', link: '/standards/security' },
                            { text: '性能规范', link: '/standards/performance' },
                            { text: '文档规范', link: '/standards/documentation' },
                        ],
                    },
                    {
                        text: '功能模块',
                        items: [
                            { text: '模块概览', link: '/design/modules/index' },
                            { text: '博客内容', link: '/design/modules/blog' },
                            { text: '创作安全', link: '/design/modules/creative-security' },
                            { text: '认证系统', link: '/design/modules/auth' },
                            { text: 'AI 辅助', link: '/design/modules/ai' },
                            { text: '语音识别 (ASR)', link: '/design/modules/asr' },
                            { text: '音频播客', link: '/design/modules/audio' },
                            { text: '国际化系统', link: '/design/modules/i18n' },
                            { text: '邮件系统', link: '/design/modules/email' },
                            { text: '通知中心', link: '/design/modules/notifications' },
                            { text: '阅读模式', link: '/design/modules/reader-mode' },
                            { text: '评论互动', link: '/design/modules/interactions' },
                            { text: '分类标签', link: '/design/modules/taxonomy' },
                            { text: '搜索系统', link: '/design/modules/search' },
                            { text: '主题系统', link: '/design/modules/theme' },
                            { text: '存储管理', link: '/design/modules/storage' },
                            { text: '系统能力', link: '/design/modules/system' },
                            { text: '后台管理', link: '/design/modules/admin' },
                            { text: '用户空间', link: '/design/modules/user' },
                            { text: '开放接口', link: '/design/modules/open-api' },
                            { text: 'MCP 服务器', link: '/design/modules/mcp' },
                        ],
                    },
                    {
                        text: '设计文档',
                        items: [
                            { text: 'UI 设计', link: '/design/ui' },
                            { text: 'API 设计', link: '/design/api' },
                            { text: '数据库设计', link: '/design/database' },
                        ],
                    },
                ],
                lastUpdatedText: '最后更新时间',
                docFooter: {
                    prev: '上一页',
                    next: '下一页',
                },
                outline: {
                    label: '页面导航',
                },
                editLink: {
                    pattern: 'https://github.com/CaoMeiYouRen/momei/edit/master/docs/:path',
                    text: '在 GitHub 上编辑此页',
                },
            },
        },
        'en-US': {
            label: 'English',
            lang: 'en-US',
            link: '/en-US/',
            title: 'Momei Blog',
            description: 'AI-driven, native i18n developer blog platform',
            themeConfig: {
                nav: [
                    { text: 'Home', link: '/en-US/' },
                    { text: 'Quick Start', link: '/en-US/guide/quick-start' },
                    { text: 'Deploy', link: '/en-US/guide/deploy' },
                    { text: 'API Design', link: '/en-US/design/api' },
                ],
                sidebar: [
                    {
                        text: 'Guide',
                        items: [
                            { text: 'Quick Start', link: '/en-US/guide/quick-start' },
                            { text: 'Deployment', link: '/en-US/guide/deploy' },
                            { text: 'Variables & Settings', link: '/en-US/guide/variables' },
                            { text: 'Dev Guide', link: '/en-US/guide/development' },
                            { text: 'AI Synergy', link: '/en-US/guide/ai-development' },
                            { text: 'Features', link: '/en-US/guide/features' },
                        ],
                    },
                    {
                        text: 'Planning',
                        items: [
                            { text: 'Roadmap', link: '/en-US/plan/roadmap' },
                            { text: 'Comparison', link: '/en-US/plan/comparison' },
                        ],
                    },
                    {
                        text: 'Standards',
                        items: [
                            { text: 'Planning', link: '/en-US/standards/planning' },
                            { text: 'Development', link: '/en-US/standards/development' },
                            { text: 'AI Collaboration', link: '/en-US/standards/ai-collaboration' },
                            { text: 'API Standard', link: '/en-US/standards/api' },
                            { text: 'Documentation', link: '/en-US/standards/documentation' },
                        ],
                    },
                    {
                        text: 'Design',
                        items: [
                            { text: 'UI Design', link: '/en-US/design/ui' },
                            { text: 'API Design', link: '/en-US/design/api' },
                            { text: 'Database Design', link: '/en-US/design/database' },
                        ],
                    },
                ],
                lastUpdatedText: 'Last Updated',
                docFooter: {
                    prev: 'Previous',
                    next: 'Next',
                },
                outline: {
                    label: 'On this page',
                },
                editLink: {
                    pattern: 'https://github.com/CaoMeiYouRen/momei/edit/master/docs/:path',
                    text: 'Edit this page on GitHub',
                },
            },
        },
    },

    themeConfig: {
        // Shared themeConfig
        socialLinks: [
            { icon: 'github', link: 'https://github.com/CaoMeiYouRen/momei' },
        ],
        search: {
            provider: 'local',
        },
        footer: {
            message: 'Code licensed under <a href="https://github.com/CaoMeiYouRen/momei/blob/master/LICENSE" target="_blank">MIT</a>, docs licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">CC BY-NC-SA 4.0</a>',
            copyright: 'Copyright © 2025 CaoMeiYouRen',
        },
    },
})

