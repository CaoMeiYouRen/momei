import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: '墨梅博客平台',
    description: '墨梅博客平台项目文档',
    lang: 'zh-CN',
    // 显示最后更新时间
    lastUpdated: true,
    // 删除 .html 后缀
    cleanUrls: true,
    // 不会因为死链而导致构建失败
    ignoreDeadLinks: true,
    themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: '首页', link: '/' },
            { text: '开发指南', link: '/DEVELOPMENT' },
            { text: 'API 设计', link: '/API_DESIGN' },
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
                text: '项目文档',
                items: [
                    { text: '项目规划', link: '/PLAN' },
                    { text: '开发指南', link: '/DEVELOPMENT' },
                    { text: 'UI 设计', link: '/UI_DESIGN' },
                    { text: 'API 设计', link: '/API_DESIGN' },
                    { text: '测试规范', link: '/TESTING' },
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
