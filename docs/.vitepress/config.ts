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
                            { text: '可缓存接口清单', link: '/plan/cacheable-api-inventory' },
                            { text: '回归日志索引', link: '/plan/regression-log-index' },
                            { text: '活动回归日志', link: '/plan/regression-log' },
                            { text: '回归日志归档', link: '/plan/regression-log-archive' },
                            { text: '待办事项', link: '/plan/todo' },
                            { text: '待办归档', link: '/plan/todo-archive' },
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
                            { text: '内容分发模板与标签', link: '/design/modules/content-distribution-template-tag-adaptation' },
                            { text: '创作安全', link: '/design/modules/creative-security' },
                            { text: '认证系统', link: '/design/modules/auth' },
                            { text: 'AI 辅助', link: '/design/modules/ai' },
                            { text: 'AI 成本治理', link: '/design/modules/ai-cost-governance' },
                            { text: '商业化与社交', link: '/design/modules/commercial' },
                            { text: '广告投放与外链跳转', link: '/design/modules/ad-network-integration' },
                            { text: '语音识别 (ASR)', link: '/design/modules/asr' },
                            { text: 'ASR 性能优化', link: '/design/modules/asr-performance-optimization' },
                            { text: '音频播客', link: '/design/modules/audio' },
                            { text: '内容订阅', link: '/design/modules/subscription' },
                            { text: '外部 Feed 聚合挂载', link: '/design/modules/subscription-external-feed-aggregation' },
                            { text: '国际化系统', link: '/design/modules/i18n' },
                            { text: '国际化扩展与多语言 SEO', link: '/design/modules/i18n-seo-unification' },
                            { text: '配置项多语言回退治理', link: '/design/modules/settings-i18n-fallback-governance' },
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
                            { text: '系统配置统一化', link: '/design/modules/system-config-unification' },
                            { text: 'Cloudflare 运行时研究', link: '/design/modules/cloudflare-runtime-study' },
                            { text: 'AI 初始化 / 配置助手评估', link: '/design/modules/ai-setup-assistant-evaluation' },
                            { text: '定时任务', link: '/design/modules/scheduled-publication' },
                            { text: '后台管理', link: '/design/modules/admin' },
                            { text: '用户空间', link: '/design/modules/user' },
                            { text: '开放接口', link: '/design/modules/open-api' },
                            { text: '开放发布协议', link: '/design/modules/federation-protocols' },
                            { text: 'MCP 服务器', link: '/design/modules/mcp' },
                            { text: 'CLI / MCP 自动化', link: '/design/modules/cli-mcp-automation' },
                            { text: '迁移链接治理', link: '/design/modules/migration-link-governance' },
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
                    { text: 'API 設計', link: '/zh-TW/design/api' },
                ],
                sidebar: [
                    {
                        text: '指南',
                        items: [
                            { text: '快速開始', link: '/zh-TW/guide/quick-start' },
                            { text: '翻譯治理與貢獻流程', link: '/zh-TW/guide/translation-governance' },
                            { text: '部署指南', link: '/zh-TW/guide/deploy' },
                            { text: '變數與設定映射', link: '/zh-TW/guide/variables' },
                            { text: '開發指南', link: '/zh-TW/guide/development' },
                            { text: 'AI 驅動開發指南', link: '/zh-TW/guide/ai-development' },
                            { text: '功能特色', link: '/zh-TW/guide/features' },
                            { text: '方案比較', link: '/zh-TW/guide/comparison' },
                        ],
                    },
                    {
                        text: '規劃',
                        items: [
                            { text: '路線圖', link: '/zh-TW/plan/roadmap' },
                            { text: '中文待辦事項', link: '/plan/todo' },
                        ],
                    },
                    {
                        text: '規範',
                        items: [
                            { text: '規劃與評估規範', link: '/zh-TW/standards/planning' },
                            { text: '開發規範', link: '/zh-TW/standards/development' },
                            { text: 'AI 協作規範', link: '/zh-TW/standards/ai-collaboration' },
                            { text: 'API 規範', link: '/zh-TW/standards/api' },
                            { text: '測試規範', link: '/zh-TW/standards/testing' },
                            { text: '安全規範', link: '/zh-TW/standards/security' },
                            { text: '文件規範', link: '/zh-TW/standards/documentation' },
                        ],
                    },
                    {
                        text: '設計',
                        items: [
                            { text: 'UI 設計', link: '/zh-TW/design/ui' },
                            { text: 'API 設計', link: '/zh-TW/design/api' },
                            { text: '資料庫設計', link: '/zh-TW/design/database' },
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
                    { text: 'API Design', link: '/en-US/design/api' },
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
                            { text: 'AI Synergy', link: '/en-US/guide/ai-development' },
                            { text: 'Features', link: '/en-US/guide/features' },
                            { text: 'Comparison', link: '/en-US/guide/comparison' },
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
                    { text: 'API 설계', link: '/ko-KR/design/api' },
                ],
                sidebar: [
                    {
                        text: '가이드',
                        items: [
                            { text: '빠른 시작', link: '/ko-KR/guide/quick-start' },
                            { text: '번역 거버넌스와 기여 절차', link: '/ko-KR/guide/translation-governance' },
                            { text: '배포 가이드', link: '/ko-KR/guide/deploy' },
                            { text: '변수 및 설정 매핑', link: '/ko-KR/guide/variables' },
                            { text: '개발 가이드', link: '/ko-KR/guide/development' },
                            { text: 'AI 주도 개발 가이드', link: '/ko-KR/guide/ai-development' },
                            { text: '기능 개요', link: '/ko-KR/guide/features' },
                            { text: '솔루션 비교', link: '/ko-KR/guide/comparison' },
                        ],
                    },
                    {
                        text: '계획',
                        items: [
                            { text: '로드맵', link: '/ko-KR/plan/roadmap' },
                            { text: '중문 할 일 목록', link: '/plan/todo' },
                        ],
                    },
                    {
                        text: '표준',
                        items: [
                            { text: '계획 및 평가 표준', link: '/ko-KR/standards/planning' },
                            { text: '개발 표준', link: '/ko-KR/standards/development' },
                            { text: 'AI 협업 표준', link: '/ko-KR/standards/ai-collaboration' },
                            { text: 'API 표준', link: '/ko-KR/standards/api' },
                            { text: '테스트 표준', link: '/ko-KR/standards/testing' },
                            { text: '보안 개발 표준', link: '/ko-KR/standards/security' },
                            { text: '문서 표준', link: '/ko-KR/standards/documentation' },
                        ],
                    },
                    {
                        text: '설계',
                        items: [
                            { text: 'UI 설계', link: '/ko-KR/design/ui' },
                            { text: 'API 설계', link: '/ko-KR/design/api' },
                            { text: '데이터베이스 설계', link: '/ko-KR/design/database' },
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

