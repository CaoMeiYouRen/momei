import { defineConfig } from 'vitepress'

const translatedDocSourcePattern = /^i18n\/(en-US|zh-TW|ko-KR|ja-JP)\//

const buildEditLink = ({ filePath }: { filePath: string }) =>
    `https://github.com/CaoMeiYouRen/momei/edit/master/docs/${filePath}`

// https://vitepress.dev/reference/site-config
export default defineConfig({
    // Shared settings
    lastUpdated: true,
    cleanUrls: true,
    ignoreDeadLinks: true,
    rewrites(id) {
        // 将 i18n 目录下的文件链接重写为根路径，以适配 docs 文档结构变化
        return id.replace(translatedDocSourcePattern, '$1/')
    },
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
                    { text: '翻译治理', link: '/guide/translation-governance' },
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
                            { text: '翻译治理与贡献流程', link: '/guide/translation-governance' },
                            { text: '部署指南', link: '/guide/deploy' },
                            { text: '环境与系统设置', link: '/guide/variables' },
                            { text: '开发指南', link: '/guide/development' },
                            { text: 'AI 协同开发', link: '/guide/ai-development' },
                            { text: '功能特性', link: '/guide/features' },
                            { text: '方案对比', link: '/guide/comparison' },
                        ],
                    },
                    {
                        text: '项目规划',
                        items: [
                            { text: '路线图', link: '/plan/roadmap' },
                            { text: '待办事项', link: '/plan/todo' },
                            { text: '待办归档', link: '/plan/todo-archive' },
                        ],
                    },
                    {
                        text: '回归记录',
                        items: [
                            { text: '管理规划', link: '/reports/regression' },
                            { text: '当前窗口', link: '/reports/regression/current' },
                            { text: '历史归档', link: '/reports/regression/archive/' },
                        ],
                    },
                    {
                        text: '开发规范',
                        items: [
                            { text: '项目规划规范', link: '/standards/planning' },
                            { text: '通用开发规范', link: '/standards/development' },
                            { text: 'AI 资产治理规范', link: '/standards/ai-governance' },
                            { text: '外部 Skills 准入清单', link: '/standards/external-skills-intake' },
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
                            { text: '商业化与社交', link: '/design/modules/commercial' },
                            { text: '广告投放与外链跳转', link: '/design/modules/ad-network-integration' },
                            { text: '语音识别 (ASR)', link: '/design/modules/asr' },
                            { text: '音频播客', link: '/design/modules/audio' },
                            { text: '内容订阅', link: '/design/modules/subscription' },
                            { text: '国际化系统', link: '/design/modules/i18n' },
                            { text: '邮件系统', link: '/design/modules/email' },
                            { text: '通知中心', link: '/design/modules/notifications' },
                            { text: '阅读模式', link: '/design/modules/reader-mode' },
                            { text: '评论互动', link: '/design/modules/interactions' },
                            { text: '友链系统', link: '/design/modules/friend-links' },
                            { text: '分类标签', link: '/design/modules/taxonomy' },
                            { text: '搜索系统', link: '/design/modules/search' },
                            { text: '主题系统', link: '/design/modules/theme' },
                            { text: '存储管理', link: '/design/modules/storage' },
                            { text: '系统能力', link: '/design/modules/system' },
                            { text: '定时任务', link: '/design/modules/scheduled-publication' },
                            { text: '后台管理', link: '/design/modules/admin' },
                            { text: '用户空间', link: '/design/modules/user' },
                            { text: '开放接口', link: '/design/modules/open-api' },
                            { text: '开放发布协议', link: '/design/modules/federation-protocols' },
                            { text: 'MCP 服务器', link: '/design/modules/mcp' },
                        ],
                    },
                    {
                        text: '专项设计与治理',
                        items: [
                            { text: '治理概览', link: '/design/governance/index' },
                            { text: '商业化转型重评框架', link: '/design/governance/commercialization-reassessment-framework' },
                            { text: '注释漂移治理', link: '/design/governance/comment-drift-governance' },
                            { text: 'ESLint / 类型债治理', link: '/design/governance/eslint-type-debt-tightening' },
                            { text: '可缓存接口清单', link: '/design/governance/cacheable-api-inventory' },
                            { text: '内容分发模板与标签', link: '/design/governance/content-distribution-template-tag-adaptation' },
                            { text: '第三方分发治理', link: '/design/governance/content-distribution-governance' },
                            { text: '远程仓库同步评估（Hexo 风格）', link: '/design/governance/hexo-repository-sync' },
                            { text: '文档翻译 freshness 治理', link: '/design/governance/docs-translation-freshness-governance' },
                            { text: '文章分享系统', link: '/design/governance/post-sharing' },
                            { text: '国际化扩展与多语言 SEO', link: '/design/governance/i18n-seo-unification' },
                            { text: '国际化字段治理', link: '/design/governance/i18n-field-governance' },
                            { text: '配置项多语言回退治理', link: '/design/governance/settings-i18n-fallback-governance' },
                            { text: 'AI 成本治理', link: '/design/governance/ai-cost-governance' },
                            { text: 'AI 初始化 / 配置助手评估', link: '/design/governance/ai-setup-assistant-evaluation' },
                            { text: 'ASR 性能优化', link: '/design/governance/asr-performance-optimization' },
                            { text: '系统配置统一化', link: '/design/governance/system-config-unification' },
                            { text: 'Cloudflare 运行时研究', link: '/design/governance/cloudflare-runtime-study' },
                            { text: 'CLI / MCP 自动化', link: '/design/governance/cli-mcp-automation' },
                            { text: '批量翻译编排评估', link: '/design/governance/batch-translation-orchestration' },
                            { text: '迁移链接治理', link: '/design/governance/migration-link-governance' },
                                { text: 'Post 元数据统一化', link: '/design/governance/post-metadata-unification' },
                            { text: '外部 Feed 聚合挂载', link: '/design/governance/subscription-external-feed-aggregation' },
                            { text: 'E2E 测试增强', link: '/design/governance/e2e-testing-enhancement' },
                            { text: 'E2E 覆盖矩阵', link: '/design/governance/e2e-coverage-matrix' },
                            { text: '第八阶段审计与复盘', link: '/design/governance/phase-8-feasibility-report' },
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
                    pattern: buildEditLink,
                    text: '在 GitHub 上编辑此页',
                },
            },
        },
        'zh-TW': {
            label: '繁體中文',
            lang: 'zh-TW',
            link: '/zh-TW/',
            title: '墨梅部落格',
            description: 'AI 驅動、原生國際化的開發者部落格平台',
            themeConfig: {
                nav: [
                    { text: '首頁', link: '/zh-TW/' },
                    { text: '快速開始', link: '/zh-TW/guide/quick-start' },
                    { text: '翻譯治理', link: '/zh-TW/guide/translation-governance' },
                    { text: '部署指南', link: '/zh-TW/guide/deploy' },
                    { text: '路線圖', link: '/zh-TW/plan/roadmap' },
                ],
                sidebar: [
                    {
                        text: '指南',
                        items: [
                            { text: '快速開始', link: '/zh-TW/guide/quick-start' },
                            { text: '翻譯治理與貢獻流程', link: '/zh-TW/guide/translation-governance' },
                            { text: '部署指南', link: '/zh-TW/guide/deploy' },
                            { text: '變數與設定映射', link: '/zh-TW/guide/variables' },
                            { text: '功能特色', link: '/zh-TW/guide/features' },
                        ],
                    },
                    {
                        text: '規劃',
                        items: [
                            { text: '路線圖', link: '/zh-TW/plan/roadmap' },
                            { text: '中文待辦事項', link: '/plan/todo' },
                        ],
                    },
                ],
                lastUpdatedText: '最後更新',
                docFooter: {
                    prev: '上一頁',
                    next: '下一頁',
                },
                outline: {
                    label: '頁面導覽',
                },
                editLink: {
                    pattern: buildEditLink,
                    text: '在 GitHub 上編輯此頁',
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
                    { text: 'Translation Governance', link: '/en-US/guide/translation-governance' },
                    { text: 'Deploy', link: '/en-US/guide/deploy' },
                    { text: 'Roadmap', link: '/en-US/plan/roadmap' },
                ],
                sidebar: [
                    {
                        text: 'Guide',
                        items: [
                            { text: 'Quick Start', link: '/en-US/guide/quick-start' },
                            { text: 'Translation Governance', link: '/en-US/guide/translation-governance' },
                            { text: 'Deployment', link: '/en-US/guide/deploy' },
                            { text: 'Variables & Settings', link: '/en-US/guide/variables' },
                            { text: 'Dev Guide', link: '/en-US/guide/development' },
                            { text: 'Features', link: '/en-US/guide/features' },
                        ],
                    },
                    {
                        text: 'Planning',
                        items: [
                            { text: 'Roadmap', link: '/en-US/plan/roadmap' },

                        ],
                    },
                    {
                        text: 'Standards',
                        items: [
                            { text: 'Planning', link: '/en-US/standards/planning' },
                            { text: 'Development', link: '/en-US/standards/development' },
                            { text: 'AI Collaboration', link: '/en-US/standards/ai-collaboration' },
                            { text: 'Documentation', link: '/en-US/standards/documentation' },
                            { text: 'Security', link: '/en-US/standards/security' },
                            { text: 'Testing', link: '/en-US/standards/testing' },
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
                    pattern: buildEditLink,
                    text: 'Edit this page on GitHub',
                },
            },
        },
        'ko-KR': {
            label: '한국어',
            lang: 'ko-KR',
            link: '/ko-KR/',
            title: '모메이 블로그',
            description: 'AI 기반 네이티브 i18n 개발자 블로그 플랫폼',
            themeConfig: {
                nav: [
                    { text: '홈', link: '/ko-KR/' },
                    { text: '빠른 시작', link: '/ko-KR/guide/quick-start' },
                    { text: '번역 거버넌스', link: '/ko-KR/guide/translation-governance' },
                    { text: '배포 가이드', link: '/ko-KR/guide/deploy' },
                    { text: '로드맵', link: '/ko-KR/plan/roadmap' },
                ],
                sidebar: [
                    {
                        text: '가이드',
                        items: [
                            { text: '빠른 시작', link: '/ko-KR/guide/quick-start' },
                            { text: '번역 거버넌스와 기여 절차', link: '/ko-KR/guide/translation-governance' },
                            { text: '배포 가이드', link: '/ko-KR/guide/deploy' },
                            { text: '변수 및 설정 매핑', link: '/ko-KR/guide/variables' },
                            { text: '기능 개요', link: '/ko-KR/guide/features' },
                        ],
                    },
                    {
                        text: '계획',
                        items: [
                            { text: '로드맵', link: '/ko-KR/plan/roadmap' },
                            { text: '중문 할 일 목록', link: '/plan/todo' },
                        ],
                    },
                ],
                lastUpdatedText: '마지막 업데이트',
                docFooter: {
                    prev: '이전',
                    next: '다음',
                },
                outline: {
                    label: '이 페이지에서',
                },
                editLink: {
                    pattern: buildEditLink,
                    text: 'GitHub에서 이 페이지 편집',
                },
            },
        },
        'ja-JP': {
            label: '日本語',
            lang: 'ja-JP',
            link: '/ja-JP/',
            title: 'Momei Blog',
            description: 'AI 駆動・ネイティブ国際化対応の開発者向けブログプラットフォーム',
            themeConfig: {
                nav: [
                    { text: 'ホーム', link: '/ja-JP/' },
                    { text: 'クイックスタート', link: '/ja-JP/guide/quick-start' },
                    { text: 'デプロイガイド', link: '/ja-JP/guide/deploy' },
                    { text: '翻訳ガバナンス', link: '/ja-JP/guide/translation-governance' },
                    { text: 'ロードマップ要約', link: '/ja-JP/plan/roadmap' },
                ],
                sidebar: [
                    {
                        text: 'ガイド',
                        items: [
                            { text: 'クイックスタート', link: '/ja-JP/guide/quick-start' },
                            { text: 'デプロイガイド', link: '/ja-JP/guide/deploy' },
                            { text: '翻訳ガバナンスと貢献方針', link: '/ja-JP/guide/translation-governance' },
                        ],
                    },
                    {
                        text: '計画',
                        items: [
                            { text: 'ロードマップ要約', link: '/ja-JP/plan/roadmap' },
                            { text: '中国語 Todo', link: '/plan/todo' },
                        ],
                    },
                    {
                        text: '参加',
                        items: [
                            { text: 'README (日本語)', link: 'https://github.com/CaoMeiYouRen/momei/blob/master/README.ja-JP.md' },
                            { text: 'Contributing', link: 'https://github.com/CaoMeiYouRen/momei/blob/master/CONTRIBUTING.md' },
                        ],
                    },
                ],
                lastUpdatedText: '最終更新',
                docFooter: {
                    prev: '前へ',
                    next: '次へ',
                },
                outline: {
                    label: 'このページの内容',
                },
                editLink: {
                    pattern: buildEditLink,
                    text: 'GitHub でこのページを編集',
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

