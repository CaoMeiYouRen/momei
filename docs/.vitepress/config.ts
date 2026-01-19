import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: '墨梅博客',
    description: '墨梅博客项目文档',
    lang: 'zh-CN',
    // 显示最后更新时间
    lastUpdated: true,
    // 删除 .html 后缀
    cleanUrls: true,
    // 不会因为死链而导致构建失败
    ignoreDeadLinks: true,
    sitemap: {
        hostname: 'https://docs.momei.app',
    },
    markdown: {
        image: {
            lazyLoading: true,
        },
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
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
                    { text: '开发指南', link: '/guide/setup' },
                    { text: '功能特性', link: '/guide/features' },
                ],
            },
            {
                text: '项目规划',
                items: [
                    { text: '路线图', link: '/plan/roadmap' },
                    { text: '待办事项', link: '/plan/todo' },
                    { text: '方案对比', link: '/plan/comparison' },
                ],
            },
            {
                text: '开发规范',
                items: [
                    { text: '通用开发规范', link: '/standards/development' },
                    { text: 'API 规范', link: '/standards/api' },
                    { text: '测试规范', link: '/standards/testing' },
                ],
            },
            {
                text: '设计文档',
                items: [
                    { text: 'UI 设计', link: '/design/ui' },
                    { text: 'API 设计', link: '/design/api' },
                    { text: '数据库设计', link: '/design/database' },
                    {
                        text: '功能模块',
                        items: [
                            { text: '审核管理', link: '/design/modules/admin' },
                            { text: '认证系统', link: '/design/modules/auth' },
                            { text: '博客内容', link: '/design/modules/blog' },
                            { text: '开放接口', link: '/design/modules/open-api' },
                            { text: '系统能力', link: '/design/modules/system' },
                            { text: '用户空间', link: '/design/modules/user' },
                        ],
                    },
                ],
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/CaoMeiYouRen/momei' },
        ],

        search: {
            provider: 'local',
        },

        editLink: {
            pattern: 'https://github.com/CaoMeiYouRen/momei/edit/master/:path',
            text: '在 GitHub 上编辑此页',
        },

        lastUpdatedText: '最后更新时间',

        docFooter: {
            prev: '上一页',
            next: '下一页',
        },

        outline: {
            label: '页面导航',
            level: [2, 3],
        },

        footer: {
            message: '基于 MIT 许可发布',
            copyright: 'Copyright © 2025 CaoMeiYouRen',
        },
    },
})
